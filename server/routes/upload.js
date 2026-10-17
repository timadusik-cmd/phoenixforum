import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import db from '../db.js';

const router = Router();

// POST Image Attachment
router.post('/', requireAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен.' });
    }

    const fileUrl = '/uploads/' + req.file.filename;

    const attachmentId = 'att_' + Date.now();
    db.prepare(`
      INSERT INTO attachments (id, user_id, file_path, file_name, file_size, mime_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(attachmentId, req.user.id, fileUrl, req.file.originalname, req.file.size, req.file.mimetype);

    res.json({
      url: fileUrl,
      fileName: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Ошибка при загрузке файла.' });
  }
});

export default router;
