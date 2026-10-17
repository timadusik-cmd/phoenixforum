import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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

    -- 2. Categories Table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'forum',
      display_order INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      min_role_to_post TEXT DEFAULT 'player',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  `);

  // Safe migrations for existing databases
  try {
    db.prepare("ALTER TABLE users ADD COLUMN cover_banner TEXT DEFAULT '/assets/hero_banner.jpg'").run();
  } catch {
    // Column already exists
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
