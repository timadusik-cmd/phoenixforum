import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all categories with live counts, forum categories hierarchy, and last message stats
router.get('/', (req, res) => {
  try {
    const forumCategories = db.prepare(`
      SELECT * FROM forum_categories
      ORDER BY display_order ASC, created_at ASC
    `).all();

    const sections = db.prepare(`
      SELECT c.*,
             fc.title AS forum_category_title,
             fc.color AS forum_category_color,
             (SELECT COUNT(*) FROM threads t WHERE t.category_id = c.id) AS threads_count,
             (SELECT COUNT(*) FROM posts p 
              JOIN threads t ON p.thread_id = t.id 
              WHERE t.category_id = c.id) AS posts_count
      FROM categories c
      LEFT JOIN forum_categories fc ON c.forum_category_id = fc.id
      ORDER BY c.display_order ASC, c.created_at ASC
    `).all();

    // Attach last message for each section
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

    const sectionsWithLastMsg = sections.map(cat => {
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

    // Build hierarchy: Group sub-sections into parent sections
    const subSectionsByParent = {};
    const topLevelSections = [];

    sectionsWithLastMsg.forEach(sec => {
      if (sec.parent_id) {
        if (!subSectionsByParent[sec.parent_id]) {
          subSectionsByParent[sec.parent_id] = [];
        }
        subSectionsByParent[sec.parent_id].push(sec);
      } else {
        topLevelSections.push(sec);
      }
    });

    // Aggregate thread counts, post counts, and latest message for parent sections from all their subsections
    topLevelSections.forEach(sec => {
      const subs = subSectionsByParent[sec.id] || [];
      sec.subSections = subs;

      let aggThreads = sec.threads_count || 0;
      let aggPosts = sec.posts_count || 0;
      let newestMsg = sec.lastMessage;

      subs.forEach(sub => {
        aggThreads += (sub.threads_count || 0);
        aggPosts += (sub.posts_count || 0);
        if (sub.lastMessage) {
          if (!newestMsg || new Date(sub.lastMessage.createdAt) > new Date(newestMsg.createdAt)) {
            newestMsg = sub.lastMessage;
          }
        }
      });

      sec.threads_count = aggThreads;
      sec.posts_count = aggPosts;
      sec.lastMessage = newestMsg;
    });

    // Group top-level sections into forum categories
    const sectionsByFCat = {};
    topLevelSections.forEach(sec => {
      const fCatId = sec.forum_category_id || 'fcat_main';
      if (!sectionsByFCat[fCatId]) {
        sectionsByFCat[fCatId] = [];
      }
      sectionsByFCat[fCatId].push(sec);
    });

    // If there are top-level forum categories
    const groupedForumCategories = forumCategories.map(fc => ({
      ...fc,
      sections: sectionsByFCat[fc.id] || []
    }));

    // If there are orphaned sections that don't match any category, add to a fallback category
    const knownCatIds = new Set(forumCategories.map(fc => fc.id));
    const orphaned = topLevelSections.filter(sec => !sec.forum_category_id || !knownCatIds.has(sec.forum_category_id));
    if (orphaned.length > 0) {
      if (groupedForumCategories.length > 0) {
        groupedForumCategories[0].sections.push(...orphaned);
      } else {
        groupedForumCategories.push({
          id: 'fcat_default',
          title: 'Основной раздел',
          description: 'Разделы форума',
          icon: 'folder',
          color: '#FF1F36',
          display_order: 1,
          sections: orphaned
        });
      }
    }

    res.json({
      categories: sectionsWithLastMsg,
      forumCategories: groupedForumCategories
    });
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

    let category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
    if (!category) {
      category = db.prepare('SELECT * FROM categories WHERE id = ? OR LOWER(slug) = LOWER(?)').get(slug, slug);
    }
    if (!category) {
      // Alias fallbacks for transliterated / legacy slugs
      if (slug === 'novosti_servera1' || slug === 'novosti_servera' || slug === 'novosti-servera1') {
        category = db.prepare('SELECT * FROM categories WHERE slug = ? OR id = ? OR slug = ?').get('news1', 'cat_1792238928392', 'novosti_servera1');
      } else if (slug === 'news1') {
        category = db.prepare('SELECT * FROM categories WHERE slug = ? OR id = ?').get('novosti_servera1', 'cat_1792238928392');
      }
    }
    if (!category) {
      // Fallback: check clean slug (ignoring hyphens/underscores)
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      const allCats = db.prepare('SELECT * FROM categories').all();
      category = allCats.find(c => {
        const cClean = c.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cClean === cleanSlug;
      });
    }

    if (!category) {
      return res.status(404).json({ error: 'Раздел форума не найден.' });
    }

    let filterClause = '';
    if (filter === 'pinned') filterClause = 'AND t.is_pinned = 1';
    else if (filter === 'important') filterClause = 'AND t.is_important = 1';
    else if (filter === 'solved') filterClause = 'AND t.is_solved = 1';
    else if (filter === 'open') filterClause = 'AND t.is_locked = 0';

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    // Threads in this category or if parent section, threads in this category and its direct subsections
    const threads = db.prepare(`
      SELECT t.*,
             c.title as category_title, c.slug as category_slug,
             u.id as author_id, u.username as author_name, u.avatar as author_avatar, 
             u.role as author_role, u.role_badge as author_badge, u.role_color as author_color,
             (SELECT COUNT(*) FROM posts p WHERE p.thread_id = t.id) - 1 AS replies_count,
             (SELECT p2.created_at FROM posts p2 WHERE p2.thread_id = t.id ORDER BY p2.created_at DESC LIMIT 1) as last_reply_at,
             (SELECT u2.username FROM posts p3 JOIN users u2 ON p3.author_id = u2.id WHERE p3.thread_id = t.id ORDER BY p3.created_at DESC LIMIT 1) as last_reply_user
      FROM threads t
      JOIN users u ON t.author_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE (t.category_id = ? OR t.category_id IN (SELECT id FROM categories WHERE parent_id = ?)) ${filterClause}
      ORDER BY t.is_pinned DESC, t.updated_at DESC
      LIMIT ? OFFSET ?
    `).all(category.id, category.id, parseInt(limit), offset);

    const countRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM threads t 
      WHERE (t.category_id = ? OR t.category_id IN (SELECT id FROM categories WHERE parent_id = ?)) ${filterClause}
    `).get(category.id, category.id);
    const totalThreads = countRow ? countRow.count : 0;

    const subSections = db.prepare(`
      SELECT c.*,
             (SELECT COUNT(*) FROM threads t WHERE t.category_id = c.id) AS threads_count,
             (SELECT COUNT(*) FROM posts p JOIN threads t ON p.thread_id = t.id WHERE t.category_id = c.id) AS posts_count
      FROM categories c
      WHERE c.parent_id = ?
      ORDER BY c.display_order ASC
    `).all(category.id);

    let parentCategory = null;
    if (category.parent_id) {
      parentCategory = db.prepare('SELECT id, title, slug, icon, icon_color, icon_bg FROM categories WHERE id = ?').get(category.parent_id);
    }

    res.json({
      category,
      parentCategory,
      subSections,
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
