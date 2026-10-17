import { Router } from 'express';
import db from '../db.js';
import { getUserBadges } from '../utils/userBadges.js';

const router = Router();

// GET all custom badges (public)
router.get('/badges/custom', (req, res) => {
  try {
    const badges = db.prepare('SELECT * FROM custom_badges ORDER BY level DESC, title ASC').all();
    res.json({ customBadges: badges });
  } catch (err) {
    console.error('Error fetching custom badges:', err);
    res.status(500).json({ error: 'Не удалось загрузить плашки.' });
  }
});

// GET Members List
router.get('/', (req, res) => {
  try {
    const { search, role, sort = 'reputation', page = 1, limit = 24 } = req.query;

    const conditions = [];
    const params = [];

    if (search && search.trim()) {
      conditions.push('(username LIKE ? OR character_name LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (role && role !== 'all') {
      if (role === 'staff') {
        conditions.push("role IN ('admin', 'superadmin', 'moderator', 'helper')");
      } else {
        conditions.push('role = ?');
        params.push(role);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'ORDER BY reputation DESC, current_xp DESC';
    if (sort === 'level') orderBy = 'ORDER BY level DESC, current_xp DESC';
    else if (sort === 'date') orderBy = 'ORDER BY created_at DESC';
    else if (sort === 'messages') orderBy = 'ORDER BY posts_count DESC';

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const users = db.prepare(`
      SELECT id, username, character_name, avatar, role, role_color, role_badge, status, 
             level, current_xp, reputation, fraction, server, bio, created_at,
             (SELECT COUNT(*) FROM posts p WHERE p.author_id = users.id) as posts_count,
             (SELECT COUNT(*) FROM threads t WHERE t.author_id = users.id) as topics_count
      FROM users
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params).count;

    const enrichedUsers = users.map(u => ({
      ...u,
      badges: getUserBadges(u.id, u)
    }));

    res.json({
      users: enrichedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Не удалось загрузить список пользователей.' });
  }
});

// GET Online Users & Staff
router.get('/stats/online', (req, res) => {
  try {
    const staff = db.prepare(`
      SELECT id, username, character_name, avatar, role, role_color, role_badge, status, level
      FROM users
      WHERE status = 'online' AND (
        role IN ('superadmin', 'admin', 'moderator', 'helper')
        OR id IN (
          SELECT user_id FROM user_badges ub 
          JOIN custom_badges cb ON ub.badge_key = cb.key 
          WHERE cb.level >= 2
        )
      )
      ORDER BY 
        CASE role 
          WHEN 'superadmin' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'moderator' THEN 3 
          WHEN 'helper' THEN 4 
          ELSE 5 
        END ASC,
        username ASC
    `).all();

    const staffWithBadges = staff.map(u => ({
      ...u,
      badges: getUserBadges(u.id, u)
    }));

    const allOnline = db.prepare(`
      SELECT id, username, character_name, avatar, role, role_color, role_badge, status, level
      FROM users
      WHERE status = 'online'
      ORDER BY 
        CASE role 
          WHEN 'superadmin' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'moderator' THEN 3 
          WHEN 'helper' THEN 4 
          ELSE 5 
        END ASC,
        username ASC
      LIMIT 40
    `).all();

    const usersWithBadges = allOnline.map(u => ({
      ...u,
      badges: getUserBadges(u.id, u)
    }));

    const totalMembersOnline = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'online'").get().count;

    res.json({
      staffOnline: staffWithBadges,
      usersOnline: usersWithBadges,
      totalMembersOnline,
      guestsOnline: 18,
      totalOnline: totalMembersOnline + 18,
      recordOnline: 142
    });
  } catch (err) {
    console.error('Error fetching online stats:', err);
    res.status(500).json({ error: 'Не удалось загрузить данные онлайна.' });
  }
});

// GET User Profile by ID or Username
router.get('/:idOrName', (req, res) => {
  try {
    const { idOrName } = req.params;

    const user = db.prepare(`
      SELECT id, username, character_name, avatar, cover_banner, role, role_color, role_badge, status, 
             level, current_xp, reputation, fraction, server, bio, signature, discord_tag, telegram_tag, vk_link, created_at
      FROM users
      WHERE id = ? OR username = ?
    `).get(idOrName, idOrName);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден.' });
    }

    const topicsCount = db.prepare('SELECT COUNT(*) as count FROM threads WHERE author_id = ?').get(user.id).count;
    const postsCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE author_id = ?').get(user.id).count;

    // Recent user topics
    const recentTopics = db.prepare(`
      SELECT t.id, t.title, t.tag, t.created_at, t.views_count, c.title as category_title, c.slug as category_slug,
             (SELECT COUNT(*) FROM posts p WHERE p.thread_id = t.id) - 1 as replies_count
      FROM threads t
      JOIN categories c ON t.category_id = c.id
      WHERE t.author_id = ?
      ORDER BY t.created_at DESC
      LIMIT 5
    `).all(user.id);

    // Recent user replies
    const recentPosts = db.prepare(`
      SELECT p.id, p.content, p.created_at, t.id as thread_id, t.title as thread_title
      FROM posts p
      JOIN threads t ON p.thread_id = t.id
      WHERE p.author_id = ? AND p.is_first_post = 0
      ORDER BY p.created_at DESC
      LIMIT 5
    `).all(user.id);

    res.json({
      user: {
        ...user,
        badges: getUserBadges(user.id, user),
        topicsCount,
        postsCount
      },
      recentTopics,
      recentPosts
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Ошибка при загрузке профиля.' });
  }
});

export default router;
