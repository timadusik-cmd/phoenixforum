import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET notifications
router.get('/', requireAuth, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(req.user.id);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(req.user.id).count;

    res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Ошибка при загрузке уведомлений.' });
  }
});

// Mark all as read
router.put('/read-all', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'Все уведомления прочитаны.' });
  } catch (err) {
    console.error('Error marking all as read:', err);
    res.status(500).json({ error: 'Ошибка при обновлении уведомлений.' });
  }
});

// Mark one as read
router.put('/:id/read', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    res.json({ message: 'Уведомление прочитано.' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Ошибка при обновлении.' });
  }
});

export default router;
