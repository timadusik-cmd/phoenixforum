import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken, requireAuth, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { getUserBadges } from '../utils/userBadges.js';
import { getLevelProgress } from '../utils/levelAwards.js';

const router = Router();

// 1. Register User
router.post('/register', (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Заполните все обязательные поля.' });
    }

    const emailClean = email.trim().toLowerCase();
    const userClean = username.trim();
    const passClean = password.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailClean)) {
      return res.status(400).json({ error: 'Укажите корректный адрес электронной почты.' });
    }

    if (userClean.length < 3 || userClean.length > 24) {
      return res.status(400).json({ error: 'Логин должен содержать от 3 до 24 символов.' });
    }

    if (passClean.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов.' });
    }

    // Check unique email and username
    const existing = db.prepare('SELECT id, email, username FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?')
      .get(emailClean, userClean.toLowerCase());

    if (existing) {
      if (existing.email.toLowerCase() === emailClean) {
        return res.status(400).json({ error: 'Пользователь с такой почтой уже зарегистрирован.' });
      }
      return res.status(400).json({ error: 'Данный логин уже занят. Выберите другой.' });
    }

    const passwordHash = bcrypt.hashSync(passClean, 10);
    const userId = 'u_' + Date.now() + '_' + Math.round(Math.random() * 1000);

    db.prepare(`
      INSERT INTO users (
        id, email, username, character_name, password_hash, avatar, role, role_color, role_badge,
        status, level, current_xp, reputation, fraction, server, bio, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, '/assets/avatar_ivan.jpg', 'player', '#FF8A00', 'Игрок',
        'online', 1, 0, 0, 'Гражданский', 'Phoenix RP #1 (Los Santos)', 'Новый игрок форума Phoenix RP', CURRENT_TIMESTAMP
      )
    `).run(userId, emailClean, userClean, userClean.replace(/_/g, ' '), passwordHash);

    const newUser = db.prepare(`
      SELECT id, email, username, character_name, avatar, role, role_color, role_badge, status, 
             level, current_xp, reputation, fraction, server, bio, signature, created_at
      FROM users WHERE id = ?
    `).get(userId);

    const token = generateToken(newUser);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, 'user_register', 'user', ?, 'Новая регистрация аккаунта', ?)
    `).run('log_' + Date.now(), userId, userId, req.ip || '');

    return res.json({
      user: newUser,
      token,
      message: 'Регистрация успешно завершена! Добро пожаловать.'
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера при регистрации.' });
  }
});

// 2. Login User
router.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Введите логин/почту и пароль.' });
    }

    const cleanId = identifier.trim().toLowerCase();

    const user = db.prepare(`
      SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?
    `).get(cleanId, cleanId);

    if (!user) {
      return res.status(400).json({ error: 'Неверный логин или пароль.' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: `Ваш аккаунт заблокирован. Причина: ${user.ban_reason || 'Нарушение правил проекта'}` });
    }

    const isMatch = bcrypt.compareSync(password.trim(), user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверный логин или пароль.' });
    }

    // Set online status
    db.prepare("UPDATE users SET status = 'online', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);

    const token = generateToken(user);

    // Safe user object without password_hash
    const safeUser = { ...user };
    delete safeUser.password_hash;
    safeUser.badges = getUserBadges(user.id, user);

    return res.json({
      user: safeUser,
      token,
      message: `С возвращением, ${user.username}!`
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера при входе.' });
  }
});

// 3. Get Current Authenticated User (Me)
router.get('/me', requireAuth, (req, res) => {
  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
    .get(req.user.id).count;

  const topicsCount = db.prepare('SELECT COUNT(*) as count FROM threads WHERE author_id = ?').get(req.user.id).count;
  const postsCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE author_id = ?').get(req.user.id).count;

  const levelProgress = getLevelProgress(req.user.current_xp || 0);
  if (req.user.level !== levelProgress.level) {
    db.prepare('UPDATE users SET level = ? WHERE id = ?').run(levelProgress.level, req.user.id);
  }

  res.json({
    user: {
      ...req.user,
      level: levelProgress.level,
      levelProgress,
      badges: getUserBadges(req.user.id, req.user),
      topicsCount,
      postsCount,
      unreadNotifications: unreadCount
    }
  });
});

// 4. Update Profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { character_name, bio, signature, discord_tag, telegram_tag, vk_link, fraction } = req.body;

    db.prepare(`
      UPDATE users 
      SET character_name = COALESCE(?, character_name),
          bio = COALESCE(?, bio),
          signature = COALESCE(?, signature),
          discord_tag = COALESCE(?, discord_tag),
          telegram_tag = COALESCE(?, telegram_tag),
          vk_link = COALESCE(?, vk_link),
          fraction = COALESCE(?, fraction),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(character_name, bio, signature, discord_tag, telegram_tag, vk_link, fraction, req.user.id);

    const updatedUser = db.prepare(`
      SELECT id, email, username, character_name, avatar, cover_banner, role, role_color, role_badge, status, 
             level, current_xp, reputation, fraction, server, bio, signature, discord_tag, telegram_tag, vk_link, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    res.json({ user: updatedUser, message: 'Профиль успешно обновлён.' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Не удалось обновить профиль.' });
  }
});

// 5. Update Avatar (File upload or direct URL)
router.post('/avatar', requireAuth, upload.single('avatarFile'), (req, res) => {
  try {
    let avatarPath = null;

    if (req.file) {
      avatarPath = '/uploads/' + req.file.filename;
    } else if (req.body && req.body.avatarUrl) {
      const url = req.body.avatarUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
        return res.status(400).json({ error: 'Ссылка на изображение должна начинаться с https:// или http://' });
      }
      avatarPath = url;
    }

    if (!avatarPath) {
      return res.status(400).json({ error: 'Файл или ссылка на изображение не предоставлены.' });
    }

    db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(avatarPath, req.user.id);

    res.json({ avatar: avatarPath, message: 'Аватар профиля успешно обновлён!' });
  } catch (err) {
    console.error('Avatar update error:', err);
    res.status(500).json({ error: err.message || 'Ошибка при обновлении аватара.' });
  }
});

// 5.1 Update Cover Banner (File upload or direct URL)
router.post('/cover', requireAuth, upload.single('coverFile'), (req, res) => {
  try {
    let coverPath = null;

    if (req.file) {
      coverPath = '/uploads/' + req.file.filename;
    } else if (req.body && req.body.coverUrl) {
      const url = req.body.coverUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
        return res.status(400).json({ error: 'Ссылка на обложку должна начинаться с https:// или http://' });
      }
      coverPath = url;
    }

    if (!coverPath) {
      return res.status(400).json({ error: 'Файл или ссылка на изображение обложки не предоставлены.' });
    }

    db.prepare('UPDATE users SET cover_banner = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(coverPath, req.user.id);

    res.json({ cover_banner: coverPath, message: 'Обложка профиля успешно обновлена!' });
  } catch (err) {
    console.error('Cover update error:', err);
    res.status(500).json({ error: err.message || 'Ошибка при обновлении обложки.' });
  }
});

// 6. Change Password
router.post('/change-password', requireAuth, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Укажите старый и новый пароль.' });
    }

    if (newPassword.trim().length < 6) {
      return res.status(400).json({ error: 'Новый пароль должен содержать от 6 символов.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    const isMatch = bcrypt.compareSync(oldPassword.trim(), user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверно указан текущий пароль.' });
    }

    const newHash = bcrypt.hashSync(newPassword.trim(), 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newHash, req.user.id);

    res.json({ message: 'Пароль успешно изменён.' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Ошибка при смене пароля.' });
  }
});

// 7. Logout (set user offline immediately)
router.post('/logout', optionalAuth, (req, res) => {
  try {
    if (req.user) {
      db.prepare("UPDATE users SET status = 'offline', last_seen_at = datetime('now', '-1 day') WHERE id = ?").run(req.user.id);
    }
    res.json({ message: 'Вы успешно вышли из системы.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Ошибка при выходе.' });
  }
});

export default router;
