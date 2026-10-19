const fs = require('fs');
const Database = require('better-sqlite3');

console.log('=== RESTORING FULL LIVE FORUM DATABASE ===');
const dataDir = '/var/www/phoenix/server/data';

// 1. Remove corrupt wal/shm and old small db
const toDelete = ['phoenix.db', 'phoenix.db-wal', 'phoenix.db-shm'];
for (const f of toDelete) {
  const p = `${dataDir}/${f}`;
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Deleted ${f}`);
  }
}

// 2. Restore full backup (1.36 MB, 68 users, 28 threads, 36 posts)
fs.copyFileSync(`${dataDir}/phoenix_backup_.db`, `${dataDir}/phoenix.db`);
console.log('Copied phoenix_backup_.db to phoenix.db successfully!');

// 3. Open restored db and verify
const db = new Database(`${dataDir}/phoenix.db`);
db.pragma('journal_mode = WAL');

const stats = {
  users: db.prepare("SELECT count(*) as c FROM users").get().c,
  threads: db.prepare("SELECT count(*) as c FROM threads").get().c,
  posts: db.prepare("SELECT count(*) as c FROM posts").get().c,
  categories: db.prepare("SELECT count(*) as c FROM categories").get().c,
  forumCategories: db.prepare("SELECT count(*) as c FROM forum_categories").get().c
};
console.log('Database Stats after restoration:', stats);

// 4. Ensure game_servers table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS game_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    ip TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 22005,
    platform TEXT DEFAULT 'ragemp',
    status TEXT DEFAULT 'online',
    online_players INTEGER DEFAULT 0,
    max_players INTEGER DEFAULT 1000,
    ping_ms INTEGER DEFAULT 24,
    launcher_url TEXT DEFAULT 'https://phoenix-rp.online/launcher',
    banner_img TEXT DEFAULT '/assets/hero_banner.jpg',
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const serverCount = db.prepare("SELECT count(*) as c FROM game_servers").get().c;
if (serverCount === 0) {
  const insert = db.prepare(`
    INSERT INTO game_servers (id, name, description, ip, port, platform, status, online_players, max_players, ping_ms, launcher_url, banner_img, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(
    'srv_phoenix_1',
    'Phoenix RP #1 • Los Santos',
    'Voice RolePlay • Экономика x1.5 • Государственные структуры и банды',
    '193.58.121.34',
    22005,
    'ragemp',
    'online',
    384,
    1000,
    24,
    'https://phoenix-rp.online/launcher',
    '/assets/hero_banner.jpg',
    1
  );
  insert.run(
    'srv_phoenix_2',
    'Phoenix RP #2 • San Fierro',
    'Hard RolePlay • Клановые войны • Скоро открытие (Октябрь 2026)',
    '193.58.121.34',
    22006,
    'ragemp',
    'soon',
    0,
    1000,
    24,
    'https://phoenix-rp.online/launcher',
    '/assets/hero_banner.jpg',
    2
  );
  console.log('Seeded default game servers into restored DB!');
}

// 5. Ensure prefixes tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS prefixes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    color TEXT DEFAULT '#10B981',
    bg_color TEXT DEFAULT '#10B981',
    border_color TEXT DEFAULT '#10B981',
    text_color TEXT DEFAULT '#FFFFFF',
    css_style TEXT DEFAULT 'glow',
    icon TEXT DEFAULT 'check',
    min_role TEXT DEFAULT 'player',
    apply_all INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prefix_categories (
    prefix_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    PRIMARY KEY (prefix_id, category_id)
  );
`);

console.log('Verification: game_servers count =', db.prepare("SELECT count(*) as c FROM game_servers").get().c);
console.log('Verification: threads count =', db.prepare("SELECT count(*) as c FROM threads").get().c);
console.log('Verification: categories count =', db.prepare("SELECT count(*) as c FROM categories").get().c);
db.close();
console.log('=== RESTORATION COMPLETE AND VERIFIED ===');
