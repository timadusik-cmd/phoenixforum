import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { hasPermission } from '../middleware/rbac.js';
import { getUserBadges } from '../utils/userBadges.js';

const router = Router();

// POST Create Reply
router.post('/', requireAuth, (req, res) => {
  try {
    const { thread_id, content, quote_post_id } = req.body;

    if (!thread_id || !content) {
      return res.status(400).json({ error: 'Укажите тему и текст ответа.' });
    }

    const cleanContent = content.trim();
    if (cleanContent.length < 2) {
      return res.status(400).json({ error: 'Ответ не может быть пустым.' });
    }

    const thread = db.prepare('SELECT * FROM threads WHERE id = ?').get(thread_id);
    if (!thread) {
      return res.status(404).json({ error: 'Тема не найдена.' });
    }

    if (thread.is_locked && !hasPermission(req.user.role, 'moderator')) {
      return res.status(403).json({ error: 'Эта тема закрыта для ответов администрацией.' });
    }

    const postId = 'post_' + Date.now() + '_' + Math.round(Math.random() * 1000);

    const postTx = db.transaction(() => {
      // 1. Insert post
      db.prepare(`
        INSERT INTO posts (id, thread_id, author_id, content, quote_post_id, is_first_post, is_solution, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(postId, thread.id, req.user.id, cleanContent, quote_post_id || null);

      // 2. Update thread updated_at
      db.prepare('UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(thread.id);

      // 3. Award XP to author (+10 XP)
      db.prepare(`
        UPDATE users 
        SET current_xp = current_xp + 10,
            level = CAST((current_xp + 10) / 200 AS INT) + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.user.id);

      // 4. Auto-subscribe replier
      db.prepare(`
        INSERT OR IGNORE INTO subscriptions (id, thread_id, user_id)
        VALUES (?, ?, ?)
      `).run('sub_' + Date.now(), thread.id, req.user.id);

      // 5. Notify thread author if not the same user
      if (thread.author_id !== req.user.id) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, text, link, is_read, created_at)
          VALUES (?, ?, 'reply', 'Новый ответ в вашей теме', ?, ?, 0, CURRENT_TIMESTAMP)
        `).run(
          'notif_' + Date.now() + '_1',
          thread.author_id,
          `${req.user.username} ответил в теме «${thread.title}»`,
          `/forum/thread/${thread.id}`
        );
      }

      // 6. Notify quoted author if exists and different
      if (quote_post_id) {
        const quotedPost = db.prepare('SELECT author_id FROM posts WHERE id = ?').get(quote_post_id);
        if (quotedPost && quotedPost.author_id !== req.user.id && quotedPost.author_id !== thread.author_id) {
          db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, text, link, is_read, created_at)
            VALUES (?, ?, 'mention', 'Вас процитировали в теме', ?, ?, 0, CURRENT_TIMESTAMP)
          `).run(
            'notif_' + Date.now() + '_2',
            quotedPost.author_id,
            `${req.user.username} процитировал ваше сообщение в теме «${thread.title}»`,
            `/forum/thread/${thread.id}`
          );
        }
      }
    });

    postTx();

    const createdPost = db.prepare(`
      SELECT p.*,
             u.id as author_id, u.username as author_name, u.avatar as author_avatar,
             u.role as author_role, u.role_badge as author_badge, u.role_color as author_color,
             u.level as author_level, u.reputation as author_reputation, u.fraction as author_fraction,
             u.bio as author_bio, u.signature as author_signature, u.created_at as author_joined,
             (SELECT COUNT(*) FROM posts p_cnt WHERE p_cnt.author_id = u.id) as author_posts_count,
             (SELECT COUNT(*) FROM threads t_cnt WHERE t_cnt.author_id = u.id) as author_topics_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `).get(postId);

    res.json({
      post: {
        ...createdPost,
        author_badges: getUserBadges(createdPost.author_id, {
          role: createdPost.author_role,
          role_badge: createdPost.author_badge,
          role_color: createdPost.author_color
        }),
        author_awards: db.prepare(`
          SELECT a.id, a.number, a.title, a.description, a.icon_key, ua.reason, ua.created_at
          FROM user_awards ua 
          JOIN awards a ON ua.award_id = a.id 
          WHERE ua.user_id = ? 
          ORDER BY a.number ASC 
          LIMIT 8
        `).all(createdPost.author_id),
        reactions: [],
        myReaction: null
      },
      message: 'Ответ успешно опубликован (+10 XP)!'
    });
  } catch (err) {
    console.error('Error posting reply:', err);
    res.status(500).json({ error: 'Ошибка сервера при отправке ответа.' });
  }
});

// PUT Edit Post
router.put('/:id', requireAuth, (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Текст сообщения не может быть пустым.' });
    }

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Сообщение не найдено.' });

    const isAuthor = post.author_id === req.user.id;
    const isMod = hasPermission(req.user.role, 'moderator');

    if (!isAuthor && !isMod) {
      return res.status(403).json({ error: 'У вас нет прав на редактирование этого сообщения.' });
    }

    db.prepare('UPDATE posts SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(content.trim(), post.id);

    res.json({ message: 'Сообщение успешно обновлено.' });
  } catch (err) {
    console.error('Error editing post:', err);
    res.status(500).json({ error: 'Ошибка при редактировании сообщения.' });
  }
});

// DELETE Post
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Сообщение не найдено.' });

    const isAuthor = post.author_id === req.user.id;
    const isMod = hasPermission(req.user.role, 'moderator');

    if (!isAuthor && !isMod) {
      return res.status(403).json({ error: 'У вас нет прав на удаление этого сообщения.' });
    }

    // If it's the first post of the thread, delete the entire thread
    if (post.is_first_post) {
      db.prepare('DELETE FROM threads WHERE id = ?').run(post.thread_id);
      return res.json({ deletedThread: true, message: 'Тема и первое сообщение удалены.' });
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(post.id);
    res.json({ deletedThread: false, message: 'Сообщение удалено.' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ error: 'Ошибка при удалении сообщения.' });
  }
});

// POST React to Post
router.post('/:id/react', requireAuth, (req, res) => {
  try {
    const { reaction_type } = req.body;
    const allowed = ['like', 'heart', 'fire', 'trophy', 'dislike'];
    if (!allowed.includes(reaction_type)) {
      return res.status(400).json({ error: 'Неизвестный тип реакции.' });
    }

    const post = db.prepare('SELECT p.*, t.title as thread_title FROM posts p JOIN threads t ON p.thread_id = t.id WHERE p.id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Сообщение не найдено.' });

    const existing = db.prepare('SELECT * FROM reactions WHERE post_id = ? AND user_id = ?')
      .get(post.id, req.user.id);

    let activeReaction = null;

    if (existing) {
      if (existing.reaction_type === reaction_type) {
        // Toggle off
        db.prepare('DELETE FROM reactions WHERE id = ?').run(existing.id);
        activeReaction = null;
      } else {
        // Switch reaction
        db.prepare('UPDATE reactions SET reaction_type = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(reaction_type, existing.id);
        activeReaction = reaction_type;
      }
    } else {
      // New reaction
      db.prepare('INSERT INTO reactions (id, post_id, user_id, reaction_type) VALUES (?, ?, ?, ?)')
        .run('rx_' + Date.now(), post.id, req.user.id, reaction_type);
      activeReaction = reaction_type;

      // Award author +5 XP and +1 Rep if positive and not reacting to own post
      if (reaction_type !== 'dislike' && post.author_id !== req.user.id) {
        db.prepare(`
          UPDATE users 
          SET current_xp = current_xp + 5,
              reputation = reputation + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(post.author_id);

        // Notify author
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, text, link, is_read, created_at)
          VALUES (?, ?, 'reaction', 'Новая реакция на ваше сообщение', ?, ?, 0, CURRENT_TIMESTAMP)
        `).run(
          'notif_' + Date.now(),
          post.author_id,
          `${req.user.username} поставил реакцию на ваше сообщение в теме «${post.thread_title}»`,
          `/forum/thread/${post.thread_id}`
        );
      }
    }

    // Return updated reaction counts
    const counts = db.prepare(`
      SELECT reaction_type, COUNT(*) as count 
      FROM reactions WHERE post_id = ? 
      GROUP BY reaction_type
    `).all(post.id);

    res.json({
      myReaction: activeReaction,
      reactions: counts
    });
  } catch (err) {
    console.error('Error toggling reaction:', err);
    res.status(500).json({ error: 'Ошибка при сохранении реакции.' });
  }
});

// PUT Mark as Solution
router.put('/:id/solution', requireAuth, (req, res) => {
  try {
    const post = db.prepare('SELECT p.*, t.author_id as thread_author_id FROM posts p JOIN threads t ON p.thread_id = t.id WHERE p.id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Сообщение не найдено.' });

    const isThreadAuthor = post.thread_author_id === req.user.id;
    const isMod = hasPermission(req.user.role, 'moderator');

    if (!isThreadAuthor && !isMod) {
      return res.status(403).json({ error: 'Только автор темы или модератор может отметить решение.' });
    }

    const newSolution = post.is_solution ? 0 : 1;

    // Reset others in this thread first, then set this one
    db.prepare('UPDATE posts SET is_solution = 0 WHERE thread_id = ?').run(post.thread_id);
    db.prepare('UPDATE posts SET is_solution = ? WHERE id = ?').run(newSolution, post.id);
    db.prepare('UPDATE threads SET is_solved = ? WHERE id = ?').run(newSolution, post.thread_id);

    res.json({ isSolution: newSolution, message: newSolution ? 'Сообщение отмечено как решение!' : 'Отметка решения снята.' });
  } catch (err) {
    console.error('Error setting solution:', err);
    res.status(500).json({ error: 'Ошибка при изменении статуса решения.' });
  }
});

export default router;
