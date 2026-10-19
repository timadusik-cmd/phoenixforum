const fs = require('fs');
const Database = require('better-sqlite3');

console.log('--- Inspecting backups ---');
const dataDir = '/var/www/phoenix/server/data';
const files = fs.readdirSync(dataDir);
console.log('Files in data dir:', files);

for (const f of files) {
  if (f.endsWith('.db')) {
    const fullPath = `${dataDir}/${f}`;
    const stat = fs.statSync(fullPath);
    console.log(`\nTesting file ${f} (size: ${stat.size} bytes):`);
    try {
      const db = new Database(fullPath, { readonly: true });
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
      console.log('  Tables:', tables.join(', '));
      if (tables.includes('threads')) {
        const tCount = db.prepare("SELECT count(*) as c FROM threads").get().c;
        const pCount = db.prepare("SELECT count(*) as c FROM posts").get().c;
        const uCount = db.prepare("SELECT count(*) as c FROM users").get().c;
        console.log(`  Threads: ${tCount}, Posts: ${pCount}, Users: ${uCount}`);
      }
      db.close();
    } catch (e) {
      console.log('  Error reading db:', e.message);
    }
  }
}
