import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET Multi-criteria search
router.get('/', (req, res) => {
  try {
    const { q, author, category, sort = 'date', page = 1, limit = 20 } = req.query;

    const conditions = [];
    const params = [];

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(`(t.title LIKE ? OR EXISTS (SELECT 1 FROM posts p_sub WHERE p_sub.thread_id = t.id AND p_sub.content LIKE ?))`);
      params.push(term, term);
    }

    if (author && author.trim()) {
      conditions.push(`u.username LIKE ?`);
      params.push(`%${author.trim()}%`);
    }

    if (category && category.trim()) {
      conditions.push(`(c.slug = ? OR c.id = ?)`);
      params.push(category.trim(), category.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'ORDER BY t.created_at DESC';
    if (sort === 'views') orderBy = 'ORDER BY t.views_count DESC';
    else if (sort === 'replies') orderBy = 'ORDER BY replies_count DESC';

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const query = `
      SELECT t.*,
             c.title as category_title, c.slug as category_slug,
             u.id as author_id, u.username as author_name, u.avatar as author_avatar,
             u.role_color as author_color, u.role_badge as author_badge,
             pfx.id as prefix_id, pfx.title as prefix_title, pfx.text_color as prefix_text_color,
             pfx.bg_color as prefix_bg_color, pfx.border_color as prefix_border_color,
             pfx.css_style as prefix_css_style, pfx.icon as prefix_icon,
             (SELECT COUNT(*) FROM posts p WHERE p.thread_id = t.id) - 1 as replies_count,
             (SELECT p2.content FROM posts p2 WHERE p2.thread_id = t.id AND p2.is_first_post = 1 LIMIT 1) as snippet
      FROM threads t
      JOIN categories c ON t.category_id = c.id
      JOIN users u ON t.author_id = u.id
      LEFT JOIN prefixes pfx ON t.prefix_id = pfx.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const threads = db.prepare(query).all(...params, parseInt(limit), offset);

    const countQuery = `
      SELECT COUNT(*) as count
      FROM threads t
      JOIN categories c ON t.category_id = c.id
      JOIN users u ON t.author_id = u.id
      ${whereClause}
    `;

    const total = db.prepare(countQuery).get(...params).count;

    res.json({
      threads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Ошибка при выполнении поиска.' });
  }
});

export default router;
