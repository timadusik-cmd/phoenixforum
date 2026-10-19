import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { seedAwards } from './utils/levelAwards.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'phoenix.db');
const db = new Database(dbPath);

// Enable Foreign Keys and WAL Mode for high concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- 1. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      character_name TEXT,
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT '/assets/avatar_ivan.jpg',
      avatar_decoration TEXT DEFAULT NULL,
      cover_banner TEXT DEFAULT '/assets/hero_banner.jpg',
      role TEXT DEFAULT 'player', -- 'player', 'helper', 'moderator', 'admin', 'superadmin'
      role_color TEXT DEFAULT '#FF8A00',
      role_badge TEXT DEFAULT 'Игрок',
      status TEXT DEFAULT 'online', -- 'online', 'offline'
      level INTEGER DEFAULT 1,
      current_xp INTEGER DEFAULT 0,
      reputation INTEGER DEFAULT 0,
      fraction TEXT DEFAULT 'Гражданский',
      server TEXT DEFAULT 'Phoenix RP #1 (Los Santos)',
      bio TEXT DEFAULT 'Игрок сервера Phoenix RP',
      signature TEXT DEFAULT '',
      discord_tag TEXT DEFAULT '',
      telegram_tag TEXT DEFAULT '',
      vk_link TEXT DEFAULT '',
      is_banned INTEGER DEFAULT 0,
      ban_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Forum Categories Table (Top-level groupings)
    CREATE TABLE IF NOT EXISTS forum_categories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'folder',
      color TEXT DEFAULT '#FF1F36',
      display_order INTEGER DEFAULT 0,
      is_collapsed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2.1 Sections / Categories Table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      forum_category_id TEXT,
      parent_id TEXT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'forum',
      icon_color TEXT DEFAULT '#FF1F36',
      icon_bg TEXT DEFAULT 'rgba(255, 31, 54, 0.12)',
      title_color TEXT DEFAULT '#FFFFFF',
      description_color TEXT DEFAULT '#8E95A5',
      badge_text TEXT,
      badge_color TEXT DEFAULT '#FF1F36',
      display_order INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      min_role_to_view TEXT DEFAULT 'all',
      min_role_to_post TEXT DEFAULT 'player',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (forum_category_id) REFERENCES forum_categories (id) ON DELETE SET NULL,
      FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE SET NULL
    );

    -- 3. Threads Table
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      title TEXT NOT NULL,
      tag TEXT DEFAULT 'Обсуждение',
      is_pinned INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      is_solved INTEGER DEFAULT 0,
      is_important INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      prefix_id TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- 4. Posts Table (First post of thread + replies)
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      content TEXT NOT NULL,
      quote_post_id TEXT,
      is_solution INTEGER DEFAULT 0,
      is_first_post INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (thread_id) REFERENCES threads (id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (quote_post_id) REFERENCES posts (id) ON DELETE SET NULL
    );

    -- 5. Reactions Table
    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reaction_type TEXT NOT NULL, -- 'like', 'heart', 'fire', 'trophy', 'dislike'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- 6. Subscriptions Table
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (thread_id, user_id),
      FOREIGN KEY (thread_id) REFERENCES threads (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- 7. Notifications Table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL, -- 'reply', 'reaction', 'mention', 'report_decision', 'system', 'warning'
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- 8. Reports Table
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      post_id TEXT,
      thread_id TEXT,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
      resolution_notes TEXT,
      resolved_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE SET NULL,
      FOREIGN KEY (thread_id) REFERENCES threads (id) ON DELETE SET NULL,
      FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL
    );

    -- 9. Warnings Table
    CREATE TABLE IF NOT EXISTS warnings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      points INTEGER DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (moderator_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- 10. Attachments Table
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      post_id TEXT,
      user_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- 11. Audit Logs Table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- 12. Conversations Table (Private Messages / Диалоги)
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user1_id TEXT NOT NULL,
      user2_id TEXT NOT NULL,
      last_message TEXT,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user1_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (user2_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE (user1_id, user2_id)
    );

    -- 13. Messages Table (Личные сообщения)
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      text TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- 14. Custom Badges Table
    CREATE TABLE IF NOT EXISTS custom_badges (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT 'Особый статус',
      color TEXT DEFAULT '#FF8A00',
      glow TEXT DEFAULT 'rgba(255, 138, 0, 0.40)',
      icon TEXT DEFAULT 'crown',
      level INTEGER DEFAULT 1,
      style TEXT DEFAULT 'classic',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
    );

    -- 15. User Badges Junction Table (Multi-badge support)
    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_key TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE (user_id, badge_key)
    );

    -- 16. Forum Awards Table (20 Awards Reference)
    CREATE TABLE IF NOT EXISTS awards (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_key TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      rarity TEXT DEFAULT 'rare',
      condition_desc TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 17. User Awards Junction Table
    CREATE TABLE IF NOT EXISTS user_awards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      award_id TEXT NOT NULL,
      assigned_by TEXT DEFAULT 'system',
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (award_id) REFERENCES awards (id) ON DELETE CASCADE,
      UNIQUE (user_id, award_id)
    );

    -- 18. Reputation Logs Table
    CREATE TABLE IF NOT EXISTS reputation_logs (
      id TEXT PRIMARY KEY,
      target_user_id TEXT NOT NULL,
      giver_user_id TEXT NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT,
      post_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (target_user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (giver_user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- 19. Topic Prefixes Table
    CREATE TABLE IF NOT EXISTS prefixes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      text_color TEXT DEFAULT '#FFFFFF',
      bg_color TEXT DEFAULT '#10B981',
      border_color TEXT DEFAULT 'rgba(16, 185, 129, 0.40)',
      css_style TEXT DEFAULT 'glow', -- 'solid', 'glow', 'outline', 'gradient'
      icon TEXT DEFAULT '',
      min_role TEXT DEFAULT 'player', -- 'player', 'moderator', 'admin', 'superadmin'
      display_order INTEGER DEFAULT 0,
      apply_all INTEGER DEFAULT 0, -- 1 = all sections, 0 = specific sections in prefix_categories
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 20. Prefix Categories Junction Table
    CREATE TABLE IF NOT EXISTS prefix_categories (
      id TEXT PRIMARY KEY,
      prefix_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (prefix_id) REFERENCES prefixes (id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
      UNIQUE (prefix_id, category_id)
    );

    -- Indices for high performance
    CREATE INDEX IF NOT EXISTS idx_threads_category ON threads (category_id, is_pinned DESC, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_thread ON posts (thread_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions (post_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conv_user1 ON conversations (user1_id, last_message_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conv_user2 ON conversations (user2_id, last_message_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages (conversation_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges (user_id, is_primary DESC, display_order ASC);
    CREATE INDEX IF NOT EXISTS idx_custom_badges_key ON custom_badges (key);
    CREATE INDEX IF NOT EXISTS idx_user_awards_user ON user_awards (user_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_rep_logs_target ON reputation_logs (target_user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_prefix_cat_prefix ON prefix_categories (prefix_id);
    CREATE INDEX IF NOT EXISTS idx_prefix_cat_category ON prefix_categories (category_id);
  `);

  // Seed the 20 official awards
  seedAwards(db);

  // Safe migrations for existing databases
  try { db.prepare("ALTER TABLE users ADD COLUMN cover_banner TEXT DEFAULT '/assets/hero_banner.jpg'").run(); } catch {}

  // Safe migrations for Forum Categories & Sections customization
  try { db.prepare("ALTER TABLE categories ADD COLUMN forum_category_id TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE categories ADD COLUMN parent_id TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE categories ADD COLUMN icon_color TEXT DEFAULT '#FF1F36'").run(); } catch {}
  try { db.prepare("ALTER TABLE categories ADD COLUMN icon_bg TEXT DEFAULT 'rgba(255, 31, 54, 0.12)'").run(); } catch {}
  try { db.prepare("ALTER TABLE categories ADD COLUMN title_color TEXT DEFAULT '#FFFFFF'").run(); } catch {}
  try { db.prepare("ALTER TABLE categories ADD COLUMN description_color TEXT DEFAULT '#8E95A5'").run(); } catch {}
  try { db.prepare("ALTER TABLE categories ADD COLUMN badge_text TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE categories ADD COLUMN badge_color TEXT DEFAULT '#FF1F36'").run(); } catch {}
  try { db.prepare("ALTER TABLE categories ADD COLUMN min_role_to_view TEXT DEFAULT 'all'").run(); } catch {}
  try { db.prepare("ALTER TABLE users ADD COLUMN avatar_decoration TEXT DEFAULT NULL").run(); } catch {}
  try { db.prepare("ALTER TABLE users ADD COLUMN last_seen_at DATETIME DEFAULT NULL").run(); } catch {}
  try { db.prepare("ALTER TABLE threads ADD COLUMN prefix_id TEXT DEFAULT NULL").run(); } catch {}
  try { db.prepare("CREATE INDEX IF NOT EXISTS idx_threads_prefix ON threads (prefix_id)").run(); } catch {}

  // Initialize standard forum categories if empty and link default sections
  try {
    const countForumCats = db.prepare('SELECT COUNT(*) as count FROM forum_categories').get().count;
    if (countForumCats === 0) {
      const insertFCat = db.prepare(`
        INSERT INTO forum_categories (id, title, description, icon, color, display_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertFCat.run('fcat_main', 'Основной раздел', 'Официальные новости, регламент проекта и техническая поддержка', 'flame', '#FF1F36', 1);
      insertFCat.run('fcat_server', 'Игровой процесс & Сервер Los Santos', 'RolePlay раздел, жалобы и торговая площадка', 'shield', '#0091FF', 2);
      insertFCat.run('fcat_community', 'Общение и курилка', 'Свободные разговоры, знакомства, медиа и юмор', 'message-square', '#10B981', 3);

      // Link default sections to categories and set custom colors & badges
      db.prepare(`UPDATE categories SET forum_category_id = 'fcat_main', icon_color = '#FF1F36', icon_bg = 'rgba(255, 31, 54, 0.15)', badge_text = 'ВАЖНО', badge_color = '#FF1F36' WHERE id = 'cat_news'`).run();
      db.prepare(`UPDATE categories SET forum_category_id = 'fcat_main', icon_color = '#0091FF', icon_bg = 'rgba(0, 145, 255, 0.15)', badge_text = 'РЕГЛАМЕНТ', badge_color = '#0091FF' WHERE id = 'cat_rules'`).run();
      db.prepare(`UPDATE categories SET forum_category_id = 'fcat_main', icon_color = '#FF9800', icon_bg = 'rgba(255, 152, 0, 0.15)' WHERE id = 'cat_tech'`).run();
      db.prepare(`UPDATE categories SET forum_category_id = 'fcat_server', icon_color = '#A855F7', icon_bg = 'rgba(168, 85, 247, 0.15)' WHERE id = 'cat_rp'`).run();
      db.prepare(`UPDATE categories SET forum_category_id = 'fcat_server', icon_color = '#EF4444', icon_bg = 'rgba(239, 68, 68, 0.15)' WHERE id = 'cat_reports'`).run();
      db.prepare(`UPDATE categories SET forum_category_id = 'fcat_server', icon_color = '#10B981', icon_bg = 'rgba(16, 185, 129, 0.15)', badge_text = 'РЫНОК', badge_color = '#10B981' WHERE id = 'cat_market'`).run();
      db.prepare(`UPDATE categories SET forum_category_id = 'fcat_community', icon_color = '#06B6D4', icon_bg = 'rgba(6, 182, 212, 0.15)' WHERE id = 'cat_general'`).run();

      // Ensure any other unlinked categories belong to fcat_main
      db.prepare(`UPDATE categories SET forum_category_id = 'fcat_main' WHERE forum_category_id IS NULL`).run();
    }
  } catch (err) {
    console.error('[Database Migration] Error initializing forum categories:', err);
  }

  // Seed default Topic Prefixes if none exist
  try {
    const countPrefixes = db.prepare('SELECT COUNT(*) as count FROM prefixes').get().count;
    if (countPrefixes === 0) {
      const insertPfx = db.prepare(`
        INSERT INTO prefixes (id, title, text_color, bg_color, border_color, css_style, icon, min_role, display_order, apply_all)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertPfx.run('pfx_approved', 'Одобрено', '#FFFFFF', '#10B981', 'rgba(16, 185, 129, 0.45)', 'glow', 'check', 'moderator', 1, 1);
      insertPfx.run('pfx_rejected', 'Отказано', '#FFFFFF', '#EF4444', 'rgba(239, 68, 68, 0.45)', 'glow', 'x', 'moderator', 2, 1);
      insertPfx.run('pfx_pending', 'На рассмотрении', '#FFFFFF', '#F59E0B', 'rgba(245, 158, 11, 0.45)', 'outline', 'clock', 'moderator', 3, 1);
      insertPfx.run('pfx_important', 'Важно', '#FFFFFF', '#FF1F36', 'rgba(255, 31, 54, 0.50)', 'solid', 'alert-circle', 'moderator', 4, 1);
      insertPfx.run('pfx_info', 'Информация', '#FFFFFF', '#0091FF', 'rgba(0, 145, 255, 0.45)', 'solid', 'info', 'moderator', 5, 1);
      insertPfx.run('pfx_closed', 'Закрыто', '#94A3B8', '#1E293B', 'rgba(148, 163, 184, 0.35)', 'solid', 'lock', 'moderator', 6, 1);
      insertPfx.run('pfx_bio', 'RP Биография', '#FFFFFF', '#8B5CF6', 'rgba(139, 92, 246, 0.45)', 'gradient', 'star', 'player', 7, 1);
      insertPfx.run('pfx_question', 'Вопрос', '#FFFFFF', '#06B6D4', 'rgba(6, 182, 212, 0.45)', 'solid', 'help-circle', 'player', 8, 1);
      insertPfx.run('pfx_bug', 'Баг', '#FFFFFF', '#F97316', 'rgba(249, 115, 22, 0.45)', 'outline', 'flame', 'player', 9, 1);
      console.log('[Database] Seeded 9 default Topic Prefixes successfully.');
    }
  } catch (err) {
    console.error('[Database Migration] Error seeding prefixes:', err);
  }

  // Ensure default custom badges and admin badges are present
  try {
    const adminUser = db.prepare("SELECT id FROM users WHERE username = 'Ivan_Petrov'").get();
    if (adminUser) {
      const hasAdminBadge = db.prepare("SELECT COUNT(*) as count FROM user_badges WHERE user_id = ? AND badge_key = 'superadmin'").get(adminUser.id).count;
      if (hasAdminBadge === 0) {
        db.prepare(`
          INSERT OR IGNORE INTO user_badges (id, user_id, badge_key, is_primary, display_order)
          VALUES ('ub_init_superadmin', ?, 'superadmin', 1, 0)
        `).run(adminUser.id);
      }
    }
  } catch (err) {
    console.error('[Database Migration] Error ensuring admin badge:', err);
  }

  console.log('[Database] SQLite tables, indices and migrations initialized successfully.');
}

export default db;
