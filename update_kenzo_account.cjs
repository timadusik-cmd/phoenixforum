const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = '/var/www/phoenix/server/data/phoenix.db';
const db = new Database(dbPath);

console.log('=== UPDATING FOUNDER ACCOUNT TO KENZO ===');

// 1. Add name_style column if not exists
try {
  db.exec("ALTER TABLE users ADD COLUMN name_style TEXT DEFAULT 'default'");
  console.log('Added name_style column to users table.');
} catch (e) {
  console.log('name_style column already exists or:', e.message);
}

// 2. Hash new password: 9559473tima
const newPassword = '9559473tima';
const passwordHash = bcrypt.hashSync(newPassword, 10);

// 3. Update Ivan_Petrov account to KENZO
const res = db.prepare(`
  UPDATE users 
  SET username = 'KENZO', 
      character_name = 'KENZO',
      password_hash = ?,
      role = 'superadmin',
      role_badge = 'ГЛАВНЫЙ АДМИНИСТРАТОР',
      name_style = 'phoenix_fire',
      updated_at = CURRENT_TIMESTAMP
  WHERE id = 'u_ivan_petrov' OR username = 'Ivan_Petrov'
`).run(passwordHash);

console.log(`Updated user rows: ${res.changes}`);

// 4. Update threads and posts authored by Ivan_Petrov
const thRes = db.prepare(`UPDATE threads SET author_name = 'KENZO' WHERE author_id = 'u_ivan_petrov' OR author_name = 'Ivan_Petrov'`).run();
console.log(`Updated threads author_name: ${thRes.changes}`);

const poRes = db.prepare(`UPDATE posts SET author_name = 'KENZO' WHERE author_id = 'u_ivan_petrov' OR author_name = 'Ivan_Petrov'`).run();
console.log(`Updated posts author_name: ${poRes.changes}`);

// 5. Verify KENZO in database
const kenzo = db.prepare("SELECT id, username, email, role, role_badge, level, reputation, name_style FROM users WHERE username = 'KENZO'").get();
console.log('Verified KENZO account:', kenzo);

// 6. Test password verification
const passMatch = bcrypt.compareSync(newPassword, db.prepare("SELECT password_hash FROM users WHERE username = 'KENZO'").get().password_hash);
console.log('Password check (9559473tima):', passMatch ? 'SUCCESS (MATCH)' : 'FAILED');

db.close();
console.log('=== UPDATE COMPLETE ===');
