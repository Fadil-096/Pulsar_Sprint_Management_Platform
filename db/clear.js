/**
 * db/clear.js — Clear and reinitialize the Nokia Sprint Platform database
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'nokia_sprint.db');

console.log('\n  Nokia Sprint Platform — Database Clear');
console.log('  =======================================\n');

if (!fs.existsSync(DB_PATH)) {
  console.log('  No database found. Run `npm run init-db` first.\n');
  process.exit(0);
}

const db = new Database(DB_PATH);
db.pragma('foreign_keys = OFF');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  
  for (const { name } of tables) {
    db.exec(`DROP TABLE IF EXISTS "${name}"`);
    console.log(`  ✓ Dropped table: ${name}`);
  }

  console.log(`\n  ✓ All ${tables.length} tables dropped successfully!\n`);
  console.log('  Run `npm run init-db` to reinitialize.\n');
} catch (err) {
  console.error('  ✗ Error:', err.message);
  process.exit(1);
} finally {
  db.close();
}
