import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// POST Create Report
router.post('/', requireAuth, (req, res) => {
  try {
    const { post_id, thread_id, reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Укажите причину жалобы.' });
    }

    const reportId = 'rep_' + Date.now();
    db.prepare(`
      INSERT INTO reports (id, reporter_id, post_id, thread_id, reason, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(reportId, req.user.id, post_id || null, thread_id || null, reason.trim());

    res.json({ message: 'Жалоба успешно отправлена администрации на рассмотрение.' });
  } catch (err) {
    console.error('Error submitting report:', err);
    res.status(500).json({ error: 'Ошибка при отправке жалобы.' });
  }
});

// GET Reports list (Moderator or Admin)
router.get('/', requireAuth, requireRole('moderator'), (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const reports = db.prepare(`
      SELECT r.*,
             u.username as reporter_name, u.avatar as reporter_avatar,
             p.content as post_content, p.author_id as reported_user_id,
             ru.username as reported_user_name,
             t.id as thread_id, t.title as thread_title
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      LEFT JOIN posts p ON r.post_id = p.id
      LEFT JOIN users ru ON p.author_id = ru.id
      LEFT JOIN threads t ON (r.thread_id = t.id OR p.thread_id = t.id)
      WHERE r.status = ?
      ORDER BY r.created_at DESC
    `).all(status);

    res.json({ reports });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Ошибка при загрузке жалоб.' });
  }
});

// PUT Resolve/Dismiss Report
router.put('/:id', requireAuth, requireRole('moderator'), (req, res) => {
  try {
    const { status, resolution_notes, delete_post, warn_user } = req.body;

    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!report) return res.status(404).json({ error: 'Жалоба не найдена.' });

    const resolveTx = db.transaction(() => {
      // 1. Update report
      db.prepare(`
        UPDATE reports 
        SET status = ?, resolution_notes = ?, resolved_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status || 'resolved', resolution_notes || 'Рассмотрено', req.user.id, report.id);

      // 2. Optionally delete offending post
      if (delete_post && report.post_id) {
        db.prepare('DELETE FROM posts WHERE id = ?').run(report.post_id);
      }

      // 3. Notify reporter
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, text, link, is_read, created_at)
        VALUES (?, ?, 'report_decision', 'Ваша жалоба рассмотрена', ?, ?, 0, CURRENT_TIMESTAMP)
      `).run(
        'notif_' + Date.now(),
        report.reporter_id,
        `Модератор ${req.user.username} рассмотрел вашу жалобу: ${resolution_notes || 'Приняты соответствующие меры.'}`,
        '/forum'
      );

      // 4. Audit log
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address)
        VALUES (?, ?, 'resolve_report', 'report', ?, ?, ?)
      `).run('log_' + Date.now(), req.user.id, report.id, `Решение по жалобе (${status}): ${resolution_notes}`, req.ip || '');
    });

    resolveTx();

    res.json({ message: 'Жалоба успешно обработана.' });
  } catch (err) {
    console.error('Error resolving report:', err);
    res.status(500).json({ error: 'Ошибка при обработке жалобы.' });
  }
});

export default router;
