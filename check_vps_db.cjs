const Database = require('better-sqlite3');
const db = new Database('/var/www/phoenix/server/data/phoenix.db');

const rows = db.prepare("SELECT id, username, email, role, role_badge, level, reputation, name_style FROM users WHERE username IN ('Ivan_Petrov', 'KENZO') OR id = 'u_ivan_petrov'").all();
console.log('Found users:', rows);
db.close();
