import { Router } from 'express';
import db from '../db.js';
import { getUserBadges } from '../utils/userBadges.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { getLevelProgress, checkAndGrantUserAwards, getUserAwardsFull, AWARDS_LIST } from '../utils/levelAwards.js';

// Ensure last_seen_at column exists in users table
try {
  db.exec("ALTER TABLE users ADD COLUMN last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP");
} catch (e) {}

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
      SELECT id, username, character_name, avatar, avatar_decoration, role, role_color, role_badge, status, 
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

// Real-time Guest Sessions tracking (active within the last 5 minutes)
const activeGuestSessions = new Map();

function cleanGuestSessions() {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  for (const [ip, ts] of activeGuestSessions.entries()) {
    if (ts < fiveMinAgo) {
      activeGuestSessions.delete(ip);
    }
  }
}

// POST Heartbeat - updates user or guest last_seen_at
router.post('/heartbeat', optionalAuth, (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'guest';
    if (req.user) {
      db.prepare("UPDATE users SET status = 'online', last_seen_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.user.id);
      activeGuestSessions.delete(clientIp);
    } else {
      activeGuestSessions.set(clientIp, Date.now());
    }
    cleanGuestSessions();
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: 'Heartbeat error' });
  }
});

// GET Online Users & Staff (ONLY users active in the last 5 minutes)
router.get('/stats/online', optionalAuth, (req, res) => {
  try {
    cleanGuestSessions();

    // Automatically mark inactive users as offline if last_seen_at is older than 5 minutes
    db.prepare(`
      UPDATE users 
      SET status = 'offline' 
      WHERE status = 'online' 
        AND (last_seen_at IS NULL OR last_seen_at < datetime('now', '-5 minutes'))
    `).run();

    // Only users active within the last 5 minutes are considered online right now
    const rawStaff = db.prepare(`
      SELECT id, username, character_name, avatar, avatar_decoration, role, role_color, role_badge, status, level, last_seen_at
      FROM users
      WHERE status = 'online'
        AND last_seen_at IS NOT NULL
        AND last_seen_at >= datetime('now', '-5 minutes')
      ORDER BY 
        CASE role 
          WHEN 'superadmin' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'moderator' THEN 3 
          ELSE 5 
        END ASC,
        username ASC
    `).all();

    const staffWithBadges = rawStaff
      .map(u => ({
        ...u,
        badges: getUserBadges(u.id, u)
      }))
      .filter(u => {
        // Only ranks from Moderator and above
        if (['superadmin', 'admin', 'moderator'].includes(u.role)) return true;

        const staffKeywords = ['модератор', 'администратор', 'руковод', 'owner', 'создатель', 'команда проекта', 'разработчик', 'founder', 'куратор'];
        const staffKeys = ['superadmin', 'admin', 'moderator', 'owner', 'developer', 'dev', 'management', 'team'];

        return (u.badges || []).some(b => {
          const key = String(b.key || '').toLowerCase();
          const title = String(b.title || '').toLowerCase();
          if (staffKeys.includes(key)) return true;
          if (staffKeywords.some(kw => title.includes(kw))) return true;
          if (b.level && b.level >= 4) return true;
          return false;
        });
      });

    const allOnline = db.prepare(`
      SELECT id, username, character_name, avatar, avatar_decoration, role, role_color, role_badge, status, level, last_seen_at
      FROM users
      WHERE status = 'online'
        AND last_seen_at IS NOT NULL
        AND last_seen_at >= datetime('now', '-5 minutes')
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

    const totalMembersOnline = db.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE status = 'online' 
        AND last_seen_at IS NOT NULL 
        AND last_seen_at >= datetime('now', '-5 minutes')
    `).get().count;

    const guestsOnline = activeGuestSessions.size;
    const totalOnline = totalMembersOnline + guestsOnline;

    res.json({
      staffOnline: staffWithBadges,
      usersOnline: usersWithBadges,
      totalMembersOnline,
      guestsOnline,
      totalOnline,
      recordOnline: Math.max(142, totalOnline)
    });
  } catch (err) {
    console.error('Error fetching online stats:', err);
    res.status(500).json({ error: 'Не удалось загрузить данные онлайна.' });
  }
});

// GET All 20 Official Forum Awards
router.get('/awards/all', (req, res) => {
  res.json({ awards: AWARDS_LIST });
});

// GET User Profile by ID or Username
router.get('/:idOrName', (req, res) => {
  try {
    const { idOrName } = req.params;

    const user = db.prepare(`
      SELECT id, username, character_name, avatar, avatar_decoration, cover_banner, role, role_color, role_badge, status, 
             level, current_xp, reputation, fraction, server, bio, signature, discord_tag, telegram_tag, vk_link, created_at
      FROM users
      WHERE id = ? OR username = ?
    `).get(idOrName, idOrName);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден.' });
    }

    // Auto-check and grant any qualified awards
    checkAndGrantUserAwards(db, user.id);

    // Calculate level progression
    const levelProgress = getLevelProgress(user.current_xp || 0);

    // If level in DB doesn't match calculated level, sync it
    if (user.level !== levelProgress.level) {
      db.prepare('UPDATE users SET level = ? WHERE id = ?').run(levelProgress.level, user.id);
      user.level = levelProgress.level;
    }

    // Get user awards full status (all 20 with unlocked true/false)
    const awards = getUserAwardsFull(db, user.id);

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
        levelProgress,
        awards,
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

// POST Give or Change Reputation
router.post('/:id/reputation', requireAuth, (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { delta = 1, reason = '', post_id = null } = req.body;

    if (req.user.id === targetUserId) {
      return res.status(400).json({ error: 'Вы не можете изменять репутацию самому себе.' });
    }

    const targetUser = db.prepare('SELECT id, username, reputation FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Пользователь не найден.' });
    }

    const numDelta = parseInt(delta) >= 0 ? 1 : -1;
    const cleanReason = String(reason || '').trim().substring(0, 200) || (numDelta > 0 ? 'Благодарность от пользователя' : 'Понижение репутации');

    // Anti-spam: check cooldown (1 hour per target user)
    const recentVote = db.prepare(`
      SELECT created_at FROM reputation_logs 
      WHERE target_user_id = ? AND giver_user_id = ?
      ORDER BY created_at DESC LIMIT 1
    `).get(targetUserId, req.user.id);

    if (recentVote) {
      const diffMs = Date.now() - new Date(recentVote.created_at).getTime();
      const oneHour = 60 * 60 * 1000;
      if (diffMs < oneHour) {
        const minutesLeft = Math.ceil((oneHour - diffMs) / 60000);
        return res.status(429).json({ error: `Вы уже изменяли репутацию этому пользователю. Подождите ещё ${minutesLeft} мин.` });
      }
    }

    // Insert log
    const logId = 'replog_' + Date.now() + '_' + Math.round(Math.random() * 1000);
    db.prepare(`
      INSERT INTO reputation_logs (id, target_user_id, giver_user_id, delta, reason, post_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(logId, targetUserId, req.user.id, numDelta, cleanReason, post_id || null);

    // Update target user's reputation
    db.prepare('UPDATE users SET reputation = reputation + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(numDelta, targetUserId);

    // Notification to recipient
    const sign = numDelta > 0 ? '+' : '';
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, text, link, is_read, created_at)
      VALUES (?, ?, 'reaction', ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(
      'notif_' + Date.now() + '_' + Math.round(Math.random() * 1000),
      targetUserId,
      `Вам изменили репутацию (${sign}${numDelta})`,
      `${req.user.username} выставил вам ${sign}${numDelta} в репутацию: «${cleanReason}»`,
      `/forum/profile/${targetUser.username}`
    );

    // Check awards for target user (e.g. award_17 "ДРУГ СООБЩЕСТВА" for rep >= 15)
    checkAndGrantUserAwards(db, targetUserId);

    const updatedRep = db.prepare('SELECT reputation FROM users WHERE id = ?').get(targetUserId).reputation;

    res.json({
      message: `Репутация пользователя ${targetUser.username} успешно изменена на ${sign}${numDelta}!`,
      newReputation: updatedRep
    });
  } catch (err) {
    console.error('Error changing reputation:', err);
    res.status(500).json({ error: 'Ошибка при изменении репутации.' });
  }
});

// GET Reputation Logs
router.get('/:id/reputation/logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT rl.*, u.username as giver_username, u.avatar as giver_avatar, u.role_badge as giver_badge, u.role_color as giver_badge_color
      FROM reputation_logs rl
      JOIN users u ON rl.giver_user_id = u.id
      WHERE rl.target_user_id = ?
      ORDER BY rl.created_at DESC
      LIMIT 30
    `).all(req.params.id);

    res.json({ logs });
  } catch (err) {
    console.error('Error fetching reputation logs:', err);
    res.status(500).json({ error: 'Ошибка при загрузке истории репутации.' });
  }
});

export default router;

