import jwt from 'jsonwebtoken';
import db from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'phoenix_secret_super_key_2026';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`
      SELECT id, email, username, character_name, avatar, role, role_color, role_badge, status, 
             level, current_xp, reputation, fraction, server, bio, signature, is_banned, ban_reason, created_at
      FROM users WHERE id = ?
    `).get(decoded.id);

    if (user && !user.is_banned) {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация для выполнения этого действия.' });
    }
    if (req.user.is_banned) {
      return res.status(403).json({ error: `Ваш аккаунт заблокирован. Причина: ${req.user.ban_reason || 'Нарушение правил'}` });
    }
    next();
  });
}
