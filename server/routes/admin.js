import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { getUserBadges } from '../utils/userBadges.js';
import { checkAndGrantUserAwards, getUserAwardsFull, AWARDS_LIST, LEVEL_THRESHOLDS } from '../utils/levelAwards.js';
import { DECORATIONS, DECORATION_CATEGORIES, getDecorationById } from '../utils/decorations.js';

const router = Router();

// Middleware: all admin routes require at least moderator/admin
router.use(requireAuth, requireRole('moderator'));

// 1. Dashboard Stats
router.get('/stats', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalThreads = db.prepare('SELECT COUNT(*) as count FROM threads').get().count;
    const totalPosts = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;
    const pendingReports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get().count;
    const bannedUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_banned = 1').get().count;

    res.json({
      stats: {
        totalUsers,
        totalThreads,
        totalPosts,
        pendingReports,
        bannedUsers
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Ошибка при получении статистики.' });
  }
});

// 2. Manage Forum Categories (Top-level groupings)
router.get('/forum-categories', (req, res) => {
  try {
    const cats = db.prepare('SELECT * FROM forum_categories ORDER BY display_order ASC, created_at ASC').all();
    res.json({ forumCategories: cats });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки категорий.' });
  }
});

router.post('/forum-categories', requireRole('admin'), (req, res) => {
  try {
    const { title, description, icon, color, display_order } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Укажите название категории.' });
    }
    const id = 'fcat_' + Date.now();
    db.prepare(`
      INSERT INTO forum_categories (id, title, description, icon, color, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, title.trim(), description || '', icon || 'folder', color || '#FF1F36', display_order || 0);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'create_forum_category', 'forum_category', ?, ?, ?)
    `).run('log_' + Date.now(), req.user.id, id, `Создание категории: ${title}`, req.ip || '');

    res.json({ message: 'Категория успешно создана!', id });
  } catch (err) {
    console.error('Error creating forum category:', err);
    res.status(500).json({ error: 'Ошибка при создании категории.' });
  }
});

router.put('/forum-categories/:id', requireRole('admin'), (req, res) => {
  try {
    const { title, description, icon, color, display_order, is_collapsed } = req.body;
    db.prepare(`
      UPDATE forum_categories
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          icon = COALESCE(?, icon),
          color = COALESCE(?, color),
          display_order = COALESCE(?, display_order),
          is_collapsed = COALESCE(?, is_collapsed)
      WHERE id = ?
    `).run(title, description, icon, color, display_order, is_collapsed, req.params.id);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'update_forum_category', 'forum_category', ?, ?, ?)
    `).run('log_' + Date.now(), req.user.id, req.params.id, `Обновление категории: ${title || req.params.id}`, req.ip || '');

    res.json({ message: 'Категория обновлена!' });
  } catch (err) {
    console.error('Error updating forum category:', err);
    res.status(500).json({ error: 'Ошибка обновления категории.' });
  }
});

router.delete('/forum-categories/:id', requireRole('admin'), (req, res) => {
  try {
    // Unlink any sections in this category
    db.prepare('UPDATE categories SET forum_category_id = NULL WHERE forum_category_id = ?').run(req.params.id);
    db.prepare('DELETE FROM forum_categories WHERE id = ?').run(req.params.id);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'delete_forum_category', 'forum_category', ?, ?, ?)
    `).run('log_' + Date.now(), req.user.id, req.params.id, `Удаление категории`, req.ip || '');

    res.json({ message: 'Категория удалена.' });
  } catch (err) {
    console.error('Error deleting forum category:', err);
    res.status(500).json({ error: 'Ошибка при удалении категории.' });
  }
});

router.post('/forum-categories/reorder', requireRole('admin'), (req, res) => {
  try {
    const { order } = req.body;
    if (Array.isArray(order)) {
      const updateStmt = db.prepare('UPDATE forum_categories SET display_order = ? WHERE id = ?');
      order.forEach((id, idx) => updateStmt.run(idx + 1, id));
    }
    res.json({ message: 'Порядок категорий сохранён!' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка изменения порядка категорий.' });
  }
});

// 2.1 Manage Sections (Разделы форума с глубокой кастомизацией)
router.post('/categories', requireRole('admin'), (req, res) => {
  try {
    const {
      forum_category_id, parent_id, slug, title, description,
      icon, icon_color, icon_bg, title_color, description_color,
      badge_text, badge_color, display_order, is_locked,
      min_role_to_view, min_role_to_post
    } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ error: 'Укажите название и URL-идентификатор (slug).' });
    }

    const catId = 'cat_' + Date.now();
    db.prepare(`
      INSERT INTO categories (
        id, forum_category_id, parent_id, slug, title, description,
        icon, icon_color, icon_bg, title_color, description_color,
        badge_text, badge_color, display_order, is_locked,
        min_role_to_view, min_role_to_post
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      catId,
      forum_category_id || null,
      parent_id || null,
      slug.toLowerCase().trim(),
      title.trim(),
      description || '',
      icon || 'forum',
      icon_color || '#FF1F36',
      icon_bg || 'rgba(255, 31, 54, 0.12)',
      title_color || '#FFFFFF',
      description_color || '#8E95A5',
      badge_text ? badge_text.trim() : null,
      badge_color || '#FF1F36',
      parseInt(display_order) || 0,
      is_locked ? 1 : 0,
      min_role_to_view || 'all',
      min_role_to_post || 'player'
    );

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'create_category', 'category', ?, ?, ?)
    `).run('log_' + Date.now(), req.user.id, catId, `Создание раздела: ${title}`, req.ip || '');

    res.json({ message: 'Раздел успешно создан!', id: catId });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: err.message || 'Ошибка при создании раздела.' });
  }
});

router.put('/categories/:id', requireRole('admin'), (req, res) => {
  try {
    const {
      forum_category_id, parent_id, slug, title, description,
      icon, icon_color, icon_bg, title_color, description_color,
      badge_text, badge_color, display_order, is_locked,
      min_role_to_view, min_role_to_post
    } = req.body;

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Раздел не найден' });
    }

    const updatedForumCatId = forum_category_id !== undefined ? (forum_category_id || null) : existing.forum_category_id;
    const updatedParentId = parent_id !== undefined ? (parent_id || null) : existing.parent_id;
    const updatedSlug = slug ? slug.toLowerCase().trim() : existing.slug;
    const updatedTitle = title ? title.trim() : existing.title;
    const updatedDescription = description !== undefined ? description : existing.description;
    const updatedIcon = icon !== undefined ? icon : existing.icon;
    const updatedIconColor = icon_color !== undefined ? icon_color : existing.icon_color;
    const updatedIconBg = icon_bg !== undefined ? icon_bg : existing.icon_bg;
    const updatedTitleColor = title_color !== undefined ? title_color : existing.title_color;
    const updatedDescriptionColor = description_color !== undefined ? description_color : existing.description_color;
    const updatedBadgeText = badge_text !== undefined ? (badge_text ? badge_text.trim() : null) : existing.badge_text;
    const updatedBadgeColor = badge_color !== undefined ? badge_color : existing.badge_color;
    const updatedDisplayOrder = display_order !== undefined ? (parseInt(display_order) || 0) : existing.display_order;
    const updatedIsLocked = is_locked !== undefined ? (is_locked ? 1 : 0) : existing.is_locked;
    const updatedMinRoleToView = min_role_to_view !== undefined ? min_role_to_view : existing.min_role_to_view;
    const updatedMinRoleToPost = min_role_to_post !== undefined ? min_role_to_post : existing.min_role_to_post;

    db.prepare(`
      UPDATE categories 
      SET forum_category_id = ?,
          parent_id = ?,
          slug = ?,
          title = ?,
          description = ?,
          icon = ?,
          icon_color = ?,
          icon_bg = ?,
          title_color = ?,
          description_color = ?,
          badge_text = ?,
          badge_color = ?,
          display_order = ?,
          is_locked = ?,
          min_role_to_view = ?,
          min_role_to_post = ?
      WHERE id = ?
    `).run(
      updatedForumCatId,
      updatedParentId,
      updatedSlug,
      updatedTitle,
      updatedDescription,
      updatedIcon,
      updatedIconColor,
      updatedIconBg,
      updatedTitleColor,
      updatedDescriptionColor,
      updatedBadgeText,
      updatedBadgeColor,
      updatedDisplayOrder,
      updatedIsLocked,
      updatedMinRoleToView,
      updatedMinRoleToPost,
      req.params.id
    );

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'update_category', 'category', ?, ?, ?)
    `).run('log_' + Date.now(), req.user.id, req.params.id, `Обновление раздела: ${updatedTitle}`, req.ip || '');

    res.json({ message: 'Раздел успешно обновлён.' });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: err.message || 'Ошибка при обновлении раздела.' });
  }
});

router.delete('/categories/:id', requireRole('admin'), (req, res) => {
  try {
    // Also unlink sub-sections
    db.prepare('UPDATE categories SET parent_id = NULL WHERE parent_id = ?').run(req.params.id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'delete_category', 'category', ?, ?, ?)
    `).run('log_' + Date.now(), req.user.id, req.params.id, `Удаление раздела`, req.ip || '');

    res.json({ message: 'Раздел удалён.' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Ошибка при удалении раздела.' });
  }
});

// 3. User Moderation: Change Role, Ban/Unban, Issue Warning
router.put('/users/:id/role', requireRole('admin'), (req, res) => {
  try {
    const { role } = req.body;
    const badges = {
      superadmin: { badge: 'Главный Администратор', subtitle: 'Команда проекта', color: '#FF1F36' },
      admin: { badge: 'Администратор', subtitle: 'Команда проекта', color: '#E52338' },
      moderator: { badge: 'Модератор', subtitle: 'Команда форума', color: '#D81B60' },
      helper: { badge: 'Хелпер', subtitle: 'Команда форума', color: '#FF9800' },
      verified: { badge: 'Проверенный', subtitle: 'Пользователь', color: '#0091FF' },
      streamer: { badge: 'Стример', subtitle: 'Специальный статус', color: '#A855F7' },
      vip: { badge: 'VIP', subtitle: 'Привилегированный статус', color: '#10B981' },
      player: { badge: 'Игрок', subtitle: 'Обычный пользователь', color: '#94A3B8' },
      guest: { badge: 'Гость', subtitle: 'Незарегистрированный', color: '#64748B' },
      developer: { badge: 'Разработчик', subtitle: 'Команда проекта', color: '#7C3AED' }
    };

    const allowed = Object.keys(badges);
    if (!allowed.includes(role)) {
      return res.status(400).json({ error: 'Недопустимая роль.' });
    }

    const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Пользователь не найден.' });

    const badgeInfo = badges[role];
    db.prepare(`
      UPDATE users 
      SET role = ?, role_badge = ?, role_color = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(role, badgeInfo.badge, badgeInfo.color, targetUser.id);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'change_user_role', 'user', ?, ?, ?)
    `).run('log_' + Date.now(), req.user.id, targetUser.id, `Выдача плашки [${badgeInfo.badge}] (${role}) пользователю ${targetUser.username}`, req.ip || '');

    res.json({
      message: `Пользователю ${targetUser.username} успешно выдана плашка «${badgeInfo.badge}»!`,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        role,
        role_badge: badgeInfo.badge,
        role_color: badgeInfo.color
      }
    });
  } catch (err) {
    console.error('Error changing role:', err);
    res.status(500).json({ error: 'Ошибка при изменении роли.' });
  }
});

// Ban / Unban user
router.put('/users/:id/ban', requireRole('moderator'), (req, res) => {
  try {
    const { is_banned, ban_reason } = req.body;
    const targetUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Пользователь не найден.' });

    // Prevent banning superadmin
    if (targetUser.role === 'superadmin') {
      return res.status(403).json({ error: 'Нельзя заблокировать главного администратора.' });
    }

    db.prepare(`
      UPDATE users 
      SET is_banned = ?, ban_reason = ?, status = 'offline', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(is_banned ? 1 : 0, is_banned ? (ban_reason || 'Нарушение правил проекта') : null, targetUser.id);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, ?, 'user', ?, ?, ?)
    `).run(
      'log_' + Date.now(),
      req.user.id,
      is_banned ? 'ban_user' : 'unban_user',
      targetUser.id,
      `${is_banned ? 'Блокировка' : 'Разблокировка'} пользователя ${targetUser.username}. Причина: ${ban_reason || '—'}`,
      req.ip || ''
    );

    res.json({ message: is_banned ? `Пользователь ${targetUser.username} заблокирован.` : `Пользователь ${targetUser.username} разблокирован.` });
  } catch (err) {
    console.error('Error banning user:', err);
    res.status(500).json({ error: 'Ошибка при изменении блокировки пользователя.' });
  }
});

// Issue Warning
router.post('/users/:id/warn', requireRole('moderator'), (req, res) => {
  try {
    const { reason, points = 1 } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Укажите причину предупреждения.' });
    }

    const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Пользователь не найден.' });

    const warnId = 'warn_' + Date.now();
    db.prepare(`
      INSERT INTO warnings (id, user_id, moderator_id, reason, points, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(warnId, targetUser.id, req.user.id, reason.trim(), parseInt(points));

    // Send notification to user
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, text, link, is_read, created_at)
      VALUES (?, ?, 'warning', 'Вам выдано предупреждение от модератора', ?, ?, 0, CURRENT_TIMESTAMP)
    `).run('notif_' + Date.now(), targetUser.id, `Причина: ${reason.trim()} (+${points} варн)`, '/forum/rules');

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'warn_user', 'user', ?, ?, ?)
    `).run('log_' + Date.now(), req.user.id, targetUser.id, `Выдача варна пользователю ${targetUser.username}: ${reason}`, req.ip || '');

    res.json({ message: `Предупреждение выдано пользователю ${targetUser.username}.` });
  } catch (err) {
    console.error('Error issuing warning:', err);
    res.status(500).json({ error: 'Ошибка при выдаче предупреждения.' });
  }
});

// 3.1 Manage User Level, XP, Reputation (Admin Only)
router.put('/users/:id/stats', requireRole('admin'), (req, res) => {
  try {
    const { level, current_xp, reputation } = req.body;
    const targetUser = db.prepare('SELECT id, username, level, current_xp, reputation FROM users WHERE id = ?').get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Пользователь не найден.' });

    const newLevel = level !== undefined ? Math.min(50, Math.max(1, parseInt(level) || 1)) : targetUser.level;
    const newXp = current_xp !== undefined ? Math.max(0, parseInt(current_xp) || 0) : targetUser.current_xp;
    const newRep = reputation !== undefined ? parseInt(reputation) || 0 : targetUser.reputation;

    db.prepare(`
      UPDATE users 
      SET level = ?, current_xp = ?, reputation = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newLevel, newXp, newRep, targetUser.id);

    // Check awards (e.g. awards for levels 10, 25, 50 or rep 15)
    checkAndGrantUserAwards(db, targetUser.id);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'update_user_stats', 'user', ?, ?, ?)
    `).run('log_' + Date.now(), req.user.id, targetUser.id, `Изменение статов пользователя ${targetUser.username}: Уровень=${newLevel}, XP=${newXp}, Репутация=${newRep}`, req.ip || '');

    res.json({
      message: `Статистика пользователя ${targetUser.username} успешно обновлена!`,
      stats: { level: newLevel, current_xp: newXp, reputation: newRep }
    });
  } catch (err) {
    console.error('Error updating user stats:', err);
    res.status(500).json({ error: 'Ошибка при обновлении статистики пользователя.' });
  }
});

// 3.2 Get User Awards Status (Admin)
router.get('/users/:id/awards', (req, res) => {
  try {
    const awards = getUserAwardsFull(db, req.params.id);
    res.json({ awards });
  } catch (err) {
    console.error('Error fetching user awards for admin:', err);
    res.status(500).json({ error: 'Ошибка при получении наград пользователя.' });
  }
});

// 3.3 Grant Award to User (Admin)
router.post('/users/:id/awards', requireRole('admin'), (req, res) => {
  try {
    const { award_id, reason = 'Выдано администрацией проекта' } = req.body;
    const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Пользователь не найден.' });

    const award = AWARDS_LIST.find(a => a.id === award_id);
    if (!award) return res.status(404).json({ error: 'Награда не найдена.' });

    const uaId = 'ua_' + Date.now() + '_' + Math.round(Math.random() * 1000);
    db.prepare(`
      INSERT OR REPLACE INTO user_awards (id, user_id, award_id, assigned_by, reason, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(uaId, targetUser.id, award.id, req.user.username, reason.trim());

    // Notification to user
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, text, link, is_read, created_at)
      VALUES (?, ?, 'award', '🎉 Администрация выдала вам награду!', ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(
      'notif_' + Date.now() + '_' + Math.round(Math.random() * 1000),
      targetUser.id,
      `Вам присвоена официальная награда «${award.title}» (${award.number}). Причина: ${reason.trim()}`,
      `/forum/profile/${targetUser.username}`
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'grant_award', 'user', ?, ?, ?)
    `).run('log_' + Date.now(), req.user.id, targetUser.id, `Выдача награды [${award.number}] ${award.title} пользователю ${targetUser.username}`, req.ip || '');

    res.json({ message: `Награда «${award.title}» успешно выдана пользователю ${targetUser.username}!` });
  } catch (err) {
    console.error('Error granting award:', err);
    res.status(500).json({ error: 'Ошибка при выдаче награды.' });
  }
});

// 3.4 Revoke Award from User (Admin)
router.delete('/users/:id/awards/:awardId', requireRole('admin'), (req, res) => {
  try {
    const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Пользователь не найден.' });

    const award = AWARDS_LIST.find(a => a.id === req.params.awardId);

    db.prepare('DELETE FROM user_awards WHERE user_id = ? AND award_id = ?').run(targetUser.id, req.params.awardId);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'revoke_award', 'user', ?, ?, ?)
    `).run('log_' + Date.now(), req.user.id, targetUser.id, `Снятие награды [${req.params.awardId}] у пользователя ${targetUser.username}`, req.ip || '');

    res.json({ message: `Награда успешно снята у пользователя ${targetUser.username}.` });
  } catch (err) {
    console.error('Error revoking award:', err);
    res.status(500).json({ error: 'Ошибка при снятии награды.' });
  }
});

// 4. Audit Logs (view recent actions)
router.get('/audit-logs', requireRole('admin'), (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT l.*, u.username as user_name, u.avatar as user_avatar, u.role_badge as user_badge
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `).all();

    res.json({ logs });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Ошибка при загрузке журнала аудита.' });
  }
});

// ==============================================================
// 5. CUSTOM BADGES MANAGEMENT (Only Superadmin & Admin)
// ==============================================================

function slugifyBadge(text) {
  const ruMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  const slug = String(text || '').toLowerCase().split('').map(c => ruMap[c] || c).join('')
    .replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return slug || ('badge_' + Date.now().toString(36));
}

function hexToRgba(hex, alpha = 0.4) {
  let c = String(hex || '#FF1F36').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(255, 31, 54, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// GET all custom badges
router.get('/custom-badges', requireRole('admin'), (req, res) => {
  try {
    const badges = db.prepare(`
      SELECT cb.*, 
             u.username as creator_name,
             (SELECT COUNT(*) FROM user_badges ub WHERE ub.badge_key = cb.key) as assigned_users_count
      FROM custom_badges cb
      LEFT JOIN users u ON cb.created_by = u.id
      ORDER BY cb.level DESC, cb.created_at DESC
    `).all();

    res.json({ customBadges: badges });
  } catch (err) {
    console.error('Error fetching custom badges:', err);
    res.status(500).json({ error: 'Ошибка при загрузке кастомных плашек.' });
  }
});

// POST create new custom badge (Only Superadmin and Admin)
router.post('/custom-badges', requireRole('admin'), (req, res) => {
  try {
    const { title, subtitle, color, glow, icon, level, style } = req.body;
    let { key } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Укажите название плашки (например, «ШЕФ LSPD»).' });
    }

    if (!key || !key.trim()) {
      key = slugifyBadge(title);
    } else {
      key = slugifyBadge(key);
    }

    // Check if key already exists in custom_badges
    const existing = db.prepare('SELECT id FROM custom_badges WHERE key = ?').get(key);
    if (existing) {
      key = key + '_' + Date.now().toString(36).slice(-3);
    }

    const badgeColor = (color && color.trim()) ? color.trim() : '#FF1F36';
    const badgeGlow = (glow && glow.trim()) ? glow.trim() : hexToRgba(badgeColor, 0.4);
    const badgeIcon = (icon && icon.trim()) ? icon.trim() : 'crown';
    const badgeLevel = Math.min(5, Math.max(1, parseInt(level) || 1));
    const badgeSubtitle = (subtitle && subtitle.trim()) ? subtitle.trim() : 'Особый статус';
    const badgeStyle = (style && (style === 'neon_crystal' || style === 'blue_btn')) ? 'neon_crystal' : 'classic';
    const badgeId = 'cb_' + Date.now();

    db.prepare(`
      INSERT INTO custom_badges (id, key, title, subtitle, color, glow, icon, level, style, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      badgeId,
      key,
      title.trim().toUpperCase(),
      badgeSubtitle,
      badgeColor,
      badgeGlow,
      badgeIcon,
      badgeLevel,
      badgeStyle,
      req.user.id
    );

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'create_custom_badge', 'custom_badge', ?, ?, ?)
    `).run(
      'log_' + Date.now(),
      req.user.id,
      badgeId,
      `Создание кастомной плашки: «${title.trim().toUpperCase()}» [${key}] (Цвет: ${badgeColor}, Ур: ${badgeLevel})`,
      req.ip || ''
    );

    const created = db.prepare('SELECT * FROM custom_badges WHERE id = ?').get(badgeId);
    res.json({
      message: `Плашка «${created.title}» успешно создана!`,
      badge: created
    });
  } catch (err) {
    console.error('Error creating custom badge:', err);
    res.status(500).json({ error: 'Ошибка при создании кастомной плашки.' });
  }
});

// PUT update custom badge
router.put('/custom-badges/:id', requireRole('admin'), (req, res) => {
  try {
    const { title, subtitle, color, glow, icon, level, style } = req.body;
    const badge = db.prepare('SELECT * FROM custom_badges WHERE id = ?').get(req.params.id);
    if (!badge) {
      return res.status(404).json({ error: 'Плашка не найдена.' });
    }

    const badgeColor = color ? color.trim() : badge.color;
    const badgeGlow = glow ? glow.trim() : (color ? hexToRgba(badgeColor, 0.4) : badge.glow);

    db.prepare(`
      UPDATE custom_badges
      SET title = COALESCE(?, title),
          subtitle = COALESCE(?, subtitle),
          color = ?,
          glow = ?,
          icon = COALESCE(?, icon),
          level = COALESCE(?, level),
          style = COALESCE(?, style)
      WHERE id = ?
    `).run(
      title ? title.trim().toUpperCase() : null,
      subtitle ? subtitle.trim() : null,
      badgeColor,
      badgeGlow,
      icon ? icon.trim() : null,
      level !== undefined ? parseInt(level) : null,
      style || null,
      badge.id
    );

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'update_custom_badge', 'custom_badge', ?, ?, ?)
    `).run(
      'log_' + Date.now(),
      req.user.id,
      badge.id,
      `Обновление плашки [${badge.key}]: «${title || badge.title}»`,
      req.ip || ''
    );

    const updated = db.prepare('SELECT * FROM custom_badges WHERE id = ?').get(badge.id);
    res.json({ message: 'Плашка успешно обновлена.', badge: updated });
  } catch (err) {
    console.error('Error updating custom badge:', err);
    res.status(500).json({ error: 'Ошибка при обновлении плашки.' });
  }
});

// DELETE custom badge
router.delete('/custom-badges/:id', requireRole('admin'), (req, res) => {
  try {
    const badge = db.prepare('SELECT * FROM custom_badges WHERE id = ?').get(req.params.id);
    if (!badge) {
      return res.status(404).json({ error: 'Плашка не найдена.' });
    }

    // Delete user assignments
    db.prepare('DELETE FROM user_badges WHERE badge_key = ?').run(badge.key);
    db.prepare('DELETE FROM custom_badges WHERE id = ?').run(badge.id);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'delete_custom_badge', 'custom_badge', ?, ?, ?)
    `).run(
      'log_' + Date.now(),
      req.user.id,
      badge.id,
      `Удаление кастомной плашки: «${badge.title}» [${badge.key}]`,
      req.ip || ''
    );

    res.json({ message: `Плашка «${badge.title}» успешно удалена.` });
  } catch (err) {
    console.error('Error deleting custom badge:', err);
    res.status(500).json({ error: 'Ошибка при удалении плашки.' });
  }
});

// ==============================================================
// 6. USER MULTI-BADGES ASSIGNMENT (Only Superadmin & Admin)
// ==============================================================

// GET all badges for a user
router.get('/users/:id/badges', requireRole('admin'), (req, res) => {
  try {
    const targetUser = db.prepare('SELECT id, username, role, role_badge, role_color FROM users WHERE id = ?').get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Пользователь не найден.' });

    const badges = getUserBadges(targetUser.id, targetUser);
    res.json({ badges, user: targetUser });
  } catch (err) {
    console.error('Error fetching user badges:', err);
    res.status(500).json({ error: 'Ошибка при получении плашек пользователя.' });
  }
});

// POST assign badge to user
router.post('/users/:id/badges', requireRole('admin'), (req, res) => {
  try {
    const { badge_key, is_primary = false } = req.body;
    if (!badge_key) return res.status(400).json({ error: 'Не указан ключ плашки (badge_key).' });

    const targetUser = db.prepare('SELECT id, username, role, role_badge, role_color FROM users WHERE id = ?').get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Пользователь не найден.' });

    // If making primary, unmark existing primary
    if (is_primary) {
      db.prepare('UPDATE user_badges SET is_primary = 0 WHERE user_id = ?').run(targetUser.id);
    }

    const badgeId = 'ub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    db.prepare(`
      INSERT INTO user_badges (id, user_id, badge_key, is_primary, display_order, created_at)
      VALUES (?, ?, ?, ?, (SELECT COUNT(*) FROM user_badges WHERE user_id = ?), CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, badge_key) DO UPDATE SET is_primary = excluded.is_primary
    `).run(badgeId, targetUser.id, badge_key, is_primary ? 1 : 0, targetUser.id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'assign_badge', 'user', ?, ?, ?)
    `).run(
      'log_' + Date.now(),
      req.user.id,
      targetUser.id,
      `Выдача плашки [${badge_key}] пользователю ${targetUser.username}`,
      req.ip || ''
    );

    const updatedBadges = getUserBadges(targetUser.id, targetUser);
    res.json({
      message: `Плашка [${badge_key}] успешно выдана пользователю ${targetUser.username}!`,
      badges: updatedBadges
    });
  } catch (err) {
    console.error('Error assigning badge to user:', err);
    res.status(500).json({ error: 'Ошибка при выдаче плашки пользователю.' });
  }
});

// DELETE remove badge from user
router.delete('/users/:id/badges/:badge_key', requireRole('admin'), (req, res) => {
  try {
    const { badge_key } = req.params;
    const targetUser = db.prepare('SELECT id, username, role, role_badge, role_color FROM users WHERE id = ?').get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Пользователь не найден.' });

    db.prepare('DELETE FROM user_badges WHERE user_id = ? AND badge_key = ?').run(targetUser.id, badge_key);

    // If no primary badge left, ensure at least one is primary if rows exist
    const hasPrimary = db.prepare('SELECT COUNT(*) as count FROM user_badges WHERE user_id = ? AND is_primary = 1').get(targetUser.id).count;
    if (hasPrimary === 0) {
      db.prepare('UPDATE user_badges SET is_primary = 1 WHERE id = (SELECT id FROM user_badges WHERE user_id = ? LIMIT 1)').run(targetUser.id);
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'remove_badge', 'user', ?, ?, ?)
    `).run(
      'log_' + Date.now(),
      req.user.id,
      targetUser.id,
      `Снятие плашки [${badge_key}] у пользователя ${targetUser.username}`,
      req.ip || ''
    );

    const updatedBadges = getUserBadges(targetUser.id, targetUser);
    res.json({
      message: `Плашка [${badge_key}] снята у пользователя ${targetUser.username}.`,
      badges: updatedBadges
    });
  } catch (err) {
    console.error('Error removing badge from user:', err);
    res.status(500).json({ error: 'Ошибка при снятии плашки.' });
  }
});

// ==============================================================
// 7. AVATAR DECORATIONS MANAGEMENT (RESTRICTED TO Ivan_Petrov ONLY)
// ==============================================================

function requireIvanPetrov(req, res, next) {
  const isIvan = req.user && (
    req.user.username === 'Ivan_Petrov' || 
    req.user.id === 'u_ivan_petrov'
  );
  if (!isIvan) {
    return res.status(403).json({
      error: 'Доступ к управлению украшениями аватарок разрешён только создателю проекта Ivan_Petrov.'
    });
  }
  next();
}

// GET all decorations and users with decorations
router.get('/decorations', requireIvanPetrov, (req, res) => {
  try {
    const usersWithDecorations = db.prepare(`
      SELECT id, username, character_name, avatar, avatar_decoration, role, role_badge, role_color, level
      FROM users
      WHERE avatar_decoration IS NOT NULL AND avatar_decoration != ''
      ORDER BY username ASC
    `).all();

    const allUsers = db.prepare(`
      SELECT id, username, character_name, avatar, avatar_decoration, role, role_badge, role_color, level
      FROM users
      ORDER BY 
        CASE role 
          WHEN 'superadmin' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'moderator' THEN 3 
          ELSE 4 
        END ASC,
        username ASC
    `).all();

    res.json({
      decorations: DECORATIONS,
      categories: DECORATION_CATEGORIES,
      usersWithDecorations,
      allUsers
    });
  } catch (err) {
    console.error('Error fetching admin decorations:', err);
    res.status(500).json({ error: 'Ошибка при загрузке украшений.' });
  }
});

// POST assign decoration to user
router.post('/users/:id/decoration', requireIvanPetrov, (req, res) => {
  try {
    const body = req.body || {};
    const decoration_id = body.decoration_id;
    const decoration_url = body.decoration_url;

    const targetUser = db.prepare('SELECT id, username, avatar, avatar_decoration FROM users WHERE id = ?').get(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Пользователь не найден.' });
    }

    let decUrl = decoration_url || null;
    let decName = 'Оформление';

    if (decoration_id) {
      const found = getDecorationById(decoration_id);
      if (found) {
        decUrl = found.url;
        decName = found.name;
      }
    } else if (decoration_url) {
      const found = getDecorationById(decoration_url);
      if (found) decName = found.name;
    }

    db.prepare(`
      UPDATE users 
      SET avatar_decoration = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(decUrl, targetUser.id);

    // Send notification to user
    try {
      if (decUrl) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, text, link, is_read, created_at)
          VALUES (?, ?, 'system', 'Вам выдано украшение аватарки', ?, ?, 0, CURRENT_TIMESTAMP)
        `).run(
          'notif_' + Date.now(),
          targetUser.id,
          `Создатель проекта Ivan_Petrov установил вам оформление «${decName}». Полюбуйтесь им в профиле!`,
          `/forum/member/${targetUser.id}`
        );
      }
    } catch (notifErr) {
      console.warn('Could not insert notification:', notifErr.message);
    }

    // Audit log
    try {
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
        VALUES (?, ?, 'set_avatar_decoration', 'user', ?, ?, ?)
      `).run(
        'log_' + Date.now(),
        req.user.id,
        targetUser.id,
        decUrl 
          ? `Выдача украшения «${decName}» [${decUrl}] пользователю ${targetUser.username}` 
          : `Снятие украшения аватарки у пользователя ${targetUser.username}`,
        req.ip || ''
      );
    } catch (auditErr) {
      console.warn('Could not insert audit log:', auditErr.message);
    }

    res.json({
      message: decUrl 
        ? `Украшение «${decName}» успешно выдано пользователю ${targetUser.username}!` 
        : `Украшение снято у пользователя ${targetUser.username}.`,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        avatar_decoration: decUrl
      }
    });
  } catch (err) {
    console.error('Error assigning decoration:', err);
    res.status(500).json({ error: 'Ошибка при сохранении украшения: ' + (err.message || 'неизвестная ошибка') });
  }
});

// DELETE remove decoration from user
router.delete('/users/:id/decoration', requireIvanPetrov, (req, res) => {
  try {
    const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Пользователь не найден.' });

    db.prepare('UPDATE users SET avatar_decoration = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(targetUser.id);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'remove_avatar_decoration', 'user', ?, ?, ?)
    `).run(
      'log_' + Date.now(),
      req.user.id,
      targetUser.id,
      `Снятие украшения аватарки у пользователя ${targetUser.username}`,
      req.ip || ''
    );

    res.json({ message: `Украшение аватарки снято у пользователя ${targetUser.username}.` });
  } catch (err) {
    console.error('Error removing decoration:', err);
    res.status(500).json({ error: 'Ошибка при снятии украшения.' });
  }
});

// ==========================================
// 8. Topic Prefixes Management
// ==========================================

// GET all prefixes with associated category mappings and thread counts
router.get('/prefixes', (req, res) => {
  try {
    const prefixes = db.prepare(`
      SELECT p.*,
             (SELECT COUNT(*) FROM threads t WHERE t.prefix_id = p.id) as threads_count
      FROM prefixes p
      ORDER BY p.display_order ASC, p.created_at ASC
    `).all();

    const getPrefixCats = db.prepare(`
      SELECT c.id, c.title, c.slug, c.parent_id, c.forum_category_id
      FROM prefix_categories pc
      JOIN categories c ON pc.category_id = c.id
      WHERE pc.prefix_id = ?
      ORDER BY c.display_order ASC, c.title ASC
    `);

    const enriched = prefixes.map(pfx => {
      const cats = pfx.apply_all ? [] : getPrefixCats.all(pfx.id);
      return {
        ...pfx,
        categories: cats,
        category_ids: cats.map(c => c.id)
      };
    });

    res.json({ prefixes: enriched });
  } catch (err) {
    console.error('Error fetching admin prefixes:', err);
    res.status(500).json({ error: 'Ошибка при загрузке префиксов тем.' });
  }
});

// POST Create new topic prefix
router.post('/prefixes', requireRole('admin'), (req, res) => {
  try {
    const {
      title,
      text_color = '#FFFFFF',
      bg_color = '#10B981',
      border_color = 'rgba(16, 185, 129, 0.45)',
      css_style = 'glow',
      icon = '',
      min_role = 'player',
      display_order = 0,
      apply_all = 1,
      category_ids = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Укажите название префикса.' });
    }

    const cleanTitle = title.trim();
    const id = 'pfx_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const applyAllFlag = apply_all ? 1 : 0;

    const createTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO prefixes (id, title, text_color, bg_color, border_color, css_style, icon, min_role, display_order, apply_all, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(id, cleanTitle, text_color, bg_color, border_color, css_style, icon || '', min_role, display_order || 0, applyAllFlag);

      if (!applyAllFlag && Array.isArray(category_ids) && category_ids.length > 0) {
        const insertPfxCat = db.prepare(`
          INSERT OR IGNORE INTO prefix_categories (id, prefix_id, category_id, created_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `);
        category_ids.forEach((catId, idx) => {
          if (catId) {
            insertPfxCat.run(`pfc_${Date.now()}_${idx}`, id, catId);
          }
        });
      }

      db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
        VALUES (?, ?, 'create_prefix', 'prefix', ?, ?, ?)
      `).run('log_' + Date.now(), req.user.id, id, `Создание префикса темы: ${cleanTitle}`, req.ip || '');
    });

    createTx();

    res.json({ message: 'Префикс успешно создан!', id });
  } catch (err) {
    console.error('Error creating prefix:', err);
    res.status(500).json({ error: 'Ошибка создания префикса: ' + (err.message || 'неизвестная ошибка') });
  }
});

// PUT Update topic prefix
router.put('/prefixes/:id', requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM prefixes WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Префикс не найден.' });
    }

    const {
      title,
      text_color,
      bg_color,
      border_color,
      css_style,
      icon,
      min_role,
      display_order,
      apply_all,
      category_ids
    } = req.body;

    const cleanTitle = title ? title.trim() : existing.title;
    const applyAllFlag = apply_all !== undefined ? (apply_all ? 1 : 0) : existing.apply_all;

    const updateTx = db.transaction(() => {
      db.prepare(`
        UPDATE prefixes
        SET title = ?,
            text_color = COALESCE(?, text_color),
            bg_color = COALESCE(?, bg_color),
            border_color = COALESCE(?, border_color),
            css_style = COALESCE(?, css_style),
            icon = COALESCE(?, icon),
            min_role = COALESCE(?, min_role),
            display_order = COALESCE(?, display_order),
            apply_all = ?
        WHERE id = ?
      `).run(
        cleanTitle,
        text_color,
        bg_color,
        border_color,
        css_style,
        icon,
        min_role,
        display_order,
        applyAllFlag,
        id
      );

      // Re-link categories
      db.prepare('DELETE FROM prefix_categories WHERE prefix_id = ?').run(id);

      if (!applyAllFlag && Array.isArray(category_ids) && category_ids.length > 0) {
        const insertPfxCat = db.prepare(`
          INSERT OR IGNORE INTO prefix_categories (id, prefix_id, category_id, created_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `);
        category_ids.forEach((catId, idx) => {
          if (catId) {
            insertPfxCat.run(`pfc_${Date.now()}_${idx}`, id, catId);
          }
        });
      }

      db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
        VALUES (?, ?, 'update_prefix', 'prefix', ?, ?, ?)
      `).run('log_' + Date.now(), req.user.id, id, `Обновление префикса темы: ${cleanTitle}`, req.ip || '');
    });

    updateTx();

    res.json({ message: 'Префикс успешно обновлён!' });
  } catch (err) {
    console.error('Error updating prefix:', err);
    res.status(500).json({ error: 'Ошибка обновления префикса: ' + (err.message || 'неизвестная ошибка') });
  }
});

// DELETE topic prefix
router.delete('/prefixes/:id', requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM prefixes WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Префикс не найден.' });
    }

    const delTx = db.transaction(() => {
      // Unlink threads using this prefix
      db.prepare('UPDATE threads SET prefix_id = NULL WHERE prefix_id = ?').run(id);
      db.prepare('DELETE FROM prefix_categories WHERE prefix_id = ?').run(id);
      db.prepare('DELETE FROM prefixes WHERE id = ?').run(id);

      db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
        VALUES (?, ?, 'delete_prefix', 'prefix', ?, ?, ?)
      `).run('log_' + Date.now(), req.user.id, id, `Удаление префикса темы: ${existing.title}`, req.ip || '');
    });

    delTx();

    res.json({ message: `Префикс «${existing.title}» успешно удалён.` });
  } catch (err) {
    console.error('Error deleting prefix:', err);
    res.status(500).json({ error: 'Ошибка при удалении префикса: ' + (err.message || 'неизвестная ошибка') });
  }
});

export default router;
