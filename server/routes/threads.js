import { Router } from 'express';
import db from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { hasPermission } from '../middleware/rbac.js';
import { getUserBadges } from '../utils/userBadges.js';

const router = Router();

// GET Recent Threads for sidebar
router.get('/recent', (req, res) => {
  try {
    const recent = db.prepare(`
      SELECT t.id, t.title, t.tag, t.created_at, t.views_count,
             u.id as author_id, u.username as author_name, u.avatar as author_avatar,
             c.title as category_title, c.slug as category_slug,
             (SELECT COUNT(*) FROM posts p WHERE p.thread_id = t.id) - 1 as replies_count
      FROM threads t
      JOIN users u ON t.author_id = u.id
      JOIN categories c ON t.category_id = c.id
      ORDER BY t.created_at DESC
      LIMIT 8
    `).all();

    res.json({ threads: recent });
  } catch (err) {
    console.error('Error fetching recent threads:', err);
    res.status(500).json({ error: 'Не удалось загрузить недавние темы.' });
  }
});

// GET Thread by ID with first post & all replies
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;

    // Increment view count
    db.prepare('UPDATE threads SET views_count = views_count + 1 WHERE id = ?').run(id);

    const thread = db.prepare(`
      SELECT t.*, c.title as category_title, c.slug as category_slug,
             u.id as author_id, u.username as author_name, u.avatar as author_avatar,
             u.role as author_role, u.role_badge as author_badge, u.role_color as author_color,
             u.level as author_level, u.reputation as author_reputation, u.fraction as author_fraction,
             u.created_at as author_joined
      FROM threads t
      JOIN categories c ON t.category_id = c.id
      JOIN users u ON t.author_id = u.id
      WHERE t.id = ?
    `).get(id);

    if (!thread) {
      return res.status(404).json({ error: 'Тема не найдена или была удалена.' });
    }

    // Get all posts in this thread (ordered by created_at)
    const posts = db.prepare(`
      SELECT p.*,
             u.id as author_id, u.username as author_name, u.avatar as author_avatar,
             u.role as author_role, u.role_badge as author_badge, u.role_color as author_color,
             u.level as author_level, u.reputation as author_reputation, u.fraction as author_fraction,
             u.bio as author_bio, u.signature as author_signature, u.created_at as author_joined,
             (SELECT COUNT(*) FROM posts p_cnt WHERE p_cnt.author_id = u.id) as author_posts_count,
             (SELECT COUNT(*) FROM threads t_cnt WHERE t_cnt.author_id = u.id) as author_topics_count,
             qp.content as quote_content, qu.username as quote_author
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN posts qp ON p.quote_post_id = qp.id
      LEFT JOIN users qu ON qp.author_id = qu.id
      WHERE p.thread_id = ?
      ORDER BY p.created_at ASC
    `).all(id);

    // Attach reactions for each post
    const getReactions = db.prepare(`
      SELECT r.reaction_type, COUNT(*) as count,
             GROUP_CONCAT(u.username) as users_list
      FROM reactions r
      JOIN users u ON r.user_id = u.id
      WHERE r.post_id = ?
      GROUP BY r.reaction_type
    `);

    const getUserReaction = req.user ? db.prepare('SELECT reaction_type FROM reactions WHERE post_id = ? AND user_id = ?') : null;

    const postsWithReactions = posts.map(p => {
      const rxList = getReactions.all(p.id);
      const userRx = getUserReaction ? getUserReaction.get(p.id, req.user.id) : null;
      return {
        ...p,
        author_badges: getUserBadges(p.author_id, {
          role: p.author_role,
          role_badge: p.author_badge,
          role_color: p.author_color
        }),
        author_awards: db.prepare(`
          SELECT a.id, a.number, a.title, a.description, a.icon_key, ua.reason, ua.created_at
          FROM user_awards ua 
          JOIN awards a ON ua.award_id = a.id 
          WHERE ua.user_id = ? 
          ORDER BY a.number ASC 
          LIMIT 8
        `).all(p.author_id),
        reactions: rxList.map(r => ({
          type: r.reaction_type,
          count: r.count,
          users: r.users_list ? r.users_list.split(',') : []
        })),
        myReaction: userRx ? userRx.reaction_type : null
      };
    });

    // Check if user is subscribed
    let isSubscribed = false;
    if (req.user) {
      const sub = db.prepare('SELECT id FROM subscriptions WHERE thread_id = ? AND user_id = ?').get(id, req.user.id);
      isSubscribed = !!sub;
    }

    thread.author_badges = getUserBadges(thread.author_id, {
      role: thread.author_role,
      role_badge: thread.author_badge,
      role_color: thread.author_color
    });

    res.json({
      thread,
      posts: postsWithReactions,
      isSubscribed
    });
  } catch (err) {
    console.error('Error fetching thread:', err);
    res.status(500).json({ error: 'Ошибка при загрузке темы.' });
  }
});

// POST Create Thread
router.post('/', requireAuth, (req, res) => {
  try {
    const { category_id, title, content, tag, is_pinned } = req.body;

    if (!category_id || !title || !content) {
      return res.status(400).json({ error: 'Укажите раздел, заголовок и текст темы.' });
    }

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (cleanTitle.length < 5 || cleanTitle.length > 150) {
      return res.status(400).json({ error: 'Заголовок темы должен содержать от 5 до 150 символов.' });
    }

    if (cleanContent.length < 10) {
      return res.status(400).json({ error: 'Содержание темы должно содержать минимум 10 символов.' });
    }

    const category = db.prepare('SELECT * FROM categories WHERE id = ? OR slug = ?').get(category_id, category_id);
    if (!category) {
      return res.status(404).json({ error: 'Выбранный раздел форума не существует.' });
    }

    // Check if category or subsection is locked (read-only):
    // Only Administrators and Superadministrators can create threads in locked sections!
    if (category.is_locked) {
      const isStaffAdmin = req.user && ['admin', 'superadmin'].includes(req.user.role);
      if (!isStaffAdmin) {
        return res.status(403).json({
          error: 'Данный раздел закрыт администрацией (только для чтения). Публикация тем в нём доступна только Администраторам форума.'
        });
      }
    }

    // Check category posting permission
    if (category.min_role_to_post && !hasPermission(req.user.role, category.min_role_to_post)) {
      return res.status(403).json({ error: `В этот раздел могут публиковать только пользователи с рангом ${category.min_role_to_post} и выше.` });
    }

    const threadId = 'th_' + Date.now() + '_' + Math.round(Math.random() * 1000);
    const postId = 'post_' + Date.now() + '_1';

    const canPin = hasPermission(req.user.role, 'moderator');
    const pinFlag = (is_pinned && canPin) ? 1 : 0;

    // Database transaction
    const createTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO threads (id, category_id, author_id, title, tag, is_pinned, is_locked, is_solved, is_important, views_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(threadId, category.id, req.user.id, cleanTitle, tag || 'Обсуждение', pinFlag);

      db.prepare(`
        INSERT INTO posts (id, thread_id, author_id, content, is_first_post, is_solution, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(postId, threadId, req.user.id, cleanContent);

      // Award XP to user (+25 XP for creating a topic)
      db.prepare(`
        UPDATE users 
        SET current_xp = current_xp + 25,
            level = CAST((current_xp + 25) / 200 AS INT) + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.user.id);

      // Auto-subscribe author
      db.prepare(`
        INSERT OR IGNORE INTO subscriptions (id, thread_id, user_id)
        VALUES (?, ?, ?)
      `).run('sub_' + Date.now(), threadId, req.user.id);

      // Audit log
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
        VALUES (?, ?, 'create_thread', 'thread', ?, ?, ?)
      `).run('log_' + Date.now(), req.user.id, threadId, `Создание темы: ${cleanTitle}`, req.ip || '');
    });

    createTx();

    res.json({
      threadId,
      message: 'Тема успешно создана! Вам начислено +25 XP.'
    });
  } catch (err) {
    console.error('Error creating thread:', err);
    res.status(500).json({ error: 'Ошибка сервера при создании темы.' });
  }
});

// Toggle Pin Thread
router.put('/:id/pin', requireAuth, (req, res) => {
  if (!hasPermission(req.user.role, 'moderator')) {
    return res.status(403).json({ error: 'Недостаточно прав для закрепления темы.' });
  }
  const thread = db.prepare('SELECT id, is_pinned FROM threads WHERE id = ?').get(req.params.id);
  if (!thread) return res.status(404).json({ error: 'Тема не найдена.' });

  const newPin = thread.is_pinned ? 0 : 1;
  db.prepare('UPDATE threads SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newPin, thread.id);

  res.json({ isPinned: newPin, message: newPin ? 'Тема закреплена.' : 'Тема откреплена.' });
});

// Toggle Lock Thread
router.put('/:id/lock', requireAuth, (req, res) => {
  if (!hasPermission(req.user.role, 'moderator')) {
    return res.status(403).json({ error: 'Недостаточно прав для блокировки темы.' });
  }
  const thread = db.prepare('SELECT id, is_locked FROM threads WHERE id = ?').get(req.params.id);
  if (!thread) return res.status(404).json({ error: 'Тема не найдена.' });

  const newLock = thread.is_locked ? 0 : 1;
  db.prepare('UPDATE threads SET is_locked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newLock, thread.id);

  res.json({ isLocked: newLock, message: newLock ? 'Тема закрыта для ответов.' : 'Тема открыта.' });
});

// Toggle Subscribe Thread
router.post('/:id/subscribe', requireAuth, (req, res) => {
  try {
    const thread = db.prepare('SELECT id, title FROM threads WHERE id = ?').get(req.params.id);
    if (!thread) return res.status(404).json({ error: 'Тема не найдена.' });

    const existing = db.prepare('SELECT id FROM subscriptions WHERE thread_id = ? AND user_id = ?')
      .get(thread.id, req.user.id);

    if (existing) {
      db.prepare('DELETE FROM subscriptions WHERE id = ?').run(existing.id);
      return res.json({ isSubscribed: false, message: 'Вы отписались от обновлений темы.' });
    } else {
      db.prepare('INSERT INTO subscriptions (id, thread_id, user_id) VALUES (?, ?, ?)')
        .run('sub_' + Date.now(), thread.id, req.user.id);
      return res.json({ isSubscribed: true, message: 'Вы подписались на обновления темы.' });
    }
  } catch (err) {
    console.error('Subscription toggle error:', err);
    res.status(500).json({ error: 'Ошибка сервера при смене статуса подписки.' });
  }
});

// PUT Edit / Move Thread (Author can change title and tag; Moderator can also move to other category)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const thread = db.prepare('SELECT * FROM threads WHERE id = ?').get(req.params.id);
    if (!thread) return res.status(404).json({ error: 'Тема не найдена.' });

    const isAuthor = thread.author_id === req.user.id;
    const isMod = hasPermission(req.user.role, 'moderator');

    if (!isAuthor && !isMod) {
      return res.status(403).json({ error: 'У вас нет прав на редактирование этой темы.' });
    }

    const { title, tag, category_id } = req.body;

    let newTitle = thread.title;
    if (title && title.trim()) {
      newTitle = title.trim();
      if (newTitle.length < 5 || newTitle.length > 150) {
        return res.status(400).json({ error: 'Заголовок темы должен содержать от 5 до 150 символов.' });
      }
    }

    let newTag = thread.tag;
    if (tag && tag.trim()) {
      newTag = tag.trim();
    }

    let newCategoryId = thread.category_id;
    let categoryMoved = false;

    if (category_id && category_id !== thread.category_id) {
      if (!isMod) {
        return res.status(403).json({ error: 'Только модераторы и администраторы могут перемещать темы между разделами.' });
      }

      const targetCat = db.prepare('SELECT * FROM categories WHERE id = ? OR slug = ?').get(category_id, category_id);
      if (!targetCat) {
        return res.status(404).json({ error: 'Целевой раздел не найден.' });
      }

      newCategoryId = targetCat.id;
      categoryMoved = true;

      // Audit log & notification
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
        VALUES (?, ?, 'move_thread', 'thread', ?, ?, ?)
      `).run('log_' + Date.now(), req.user.id, thread.id, `Перенос темы «${newTitle}» в раздел «${targetCat.title}»`, req.ip || '');

      if (thread.author_id !== req.user.id) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, text, link, is_read, created_at)
          VALUES (?, ?, 'system', 'Ваша тема перемещена', ?, ?, 0, CURRENT_TIMESTAMP)
        `).run(
          'notif_' + Date.now(),
          thread.author_id,
          `Модератор ${req.user.username} перенёс вашу тему «${newTitle}» в раздел «${targetCat.title}»`,
          `/forum/thread/${thread.id}`
        );
      }
    }

    db.prepare(`
      UPDATE threads 
      SET title = ?, tag = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newTitle, newTag, newCategoryId, thread.id);

    res.json({
      message: categoryMoved ? 'Тема успешно обновлена и перенесена в новый раздел!' : 'Тема успешно обновлена.',
      thread: {
        id: thread.id,
        title: newTitle,
        tag: newTag,
        category_id: newCategoryId
      }
    });
  } catch (err) {
    console.error('Error editing thread:', err);
    res.status(500).json({ error: 'Ошибка сервера при изменении темы.' });
  }
});

// Delete Thread
router.delete('/:id', requireAuth, (req, res) => {
  const thread = db.prepare('SELECT * FROM threads WHERE id = ?').get(req.params.id);
  if (!thread) return res.status(404).json({ error: 'Тема не найдена.' });

  const isAuthor = thread.author_id === req.user.id;
  const isMod = hasPermission(req.user.role, 'moderator');

  if (!isAuthor && !isMod) {
    return res.status(403).json({ error: 'У вас нет прав на удаление этой темы.' });
  }

  db.prepare('DELETE FROM threads WHERE id = ?').run(thread.id);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
    VALUES (?, ?, 'delete_thread', 'thread', ?, ?, ?)
  `).run('log_' + Date.now(), req.user.id, thread.id, `Удаление темы: ${thread.title}`, req.ip || '');

  res.json({ message: 'Тема успешно удалена.' });
});

export default router;

