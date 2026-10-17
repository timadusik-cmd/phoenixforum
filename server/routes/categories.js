import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all categories with live counts and last message stats
router.get('/', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*,
             (SELECT COUNT(*) FROM threads t WHERE t.category_id = c.id) AS threads_count,
             (SELECT COUNT(*) FROM posts p 
              JOIN threads t ON p.thread_id = t.id 
              WHERE t.category_id = c.id) AS posts_count
      FROM categories c
      ORDER BY c.display_order ASC
    `).all();

    // Attach last message for each category
    const getLastMsg = db.prepare(`
      SELECT p.id, p.created_at, p.content, t.id as thread_id, t.title as thread_title,
             u.id as author_id, u.username as author_name, u.avatar as author_avatar
      FROM posts p
      JOIN threads t ON p.thread_id = t.id
      JOIN users u ON p.author_id = u.id
      WHERE t.category_id = ?
      ORDER BY p.created_at DESC
      LIMIT 1
    `);

    const result = categories.map(cat => {
      const lastMsg = getLastMsg.get(cat.id);
      return {
        ...cat,
        lastMessage: lastMsg ? {
          threadId: lastMsg.thread_id,
          threadTitle: lastMsg.thread_title,
          authorId: lastMsg.author_id,
          authorName: lastMsg.author_name,
          authorAvatar: lastMsg.author_avatar,
          createdAt: lastMsg.created_at
        } : null
      };
    });

    res.json({ categories: result });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Не удалось загрузить разделы форума.' });
  }
});

// GET category by slug with thread list and filters
router.get('/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const { filter, page = 1, limit = 20 } = req.query;

    const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
    if (!category) {
      return res.status(404).json({ error: 'Раздел форума не найден.' });
    }

    let filterClause = '';
    if (filter === 'pinned') filterClause = 'AND t.is_pinned = 1';
    else if (filter === 'important') filterClause = 'AND t.is_important = 1';
    else if (filter === 'solved') filterClause = 'AND t.is_solved = 1';
    else if (filter === 'open') filterClause = 'AND t.is_locked = 0';

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const threads = db.prepare(`
      SELECT t.*,
             u.id as author_id, u.username as author_name, u.avatar as author_avatar, 
             u.role as author_role, u.role_badge as author_badge, u.role_color as author_color,
             (SELECT COUNT(*) FROM posts p WHERE p.thread_id = t.id) - 1 AS replies_count,
             (SELECT p2.created_at FROM posts p2 WHERE p2.thread_id = t.id ORDER BY p2.created_at DESC LIMIT 1) as last_reply_at,
             (SELECT u2.username FROM posts p3 JOIN users u2 ON p3.author_id = u2.id WHERE p3.thread_id = t.id ORDER BY p3.created_at DESC LIMIT 1) as last_reply_user
      FROM threads t
      JOIN users u ON t.author_id = u.id
      WHERE t.category_id = ? ${filterClause}
      ORDER BY t.is_pinned DESC, t.updated_at DESC
      LIMIT ? OFFSET ?
    `).all(category.id, parseInt(limit), offset);

    const totalThreads = db.prepare(`
      SELECT COUNT(*) as count FROM threads t WHERE t.category_id = ? ${filterClause}
    `).get(category.id).count;

    res.json({
      category,
      threads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalThreads,
        totalPages: Math.ceil(totalThreads / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching category by slug:', err);
    res.status(500).json({ error: 'Ошибка при загрузке раздела.' });
  }
});

export default router;
