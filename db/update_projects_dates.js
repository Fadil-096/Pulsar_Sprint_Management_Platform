const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'nokia_sprint.db');
const db = new Database(DB_PATH);

console.log('Running projects table update...');

try {
  db.prepare('ALTER TABLE projects RENAME COLUMN deadline TO end_date').run();
  db.prepare('ALTER TABLE projects ADD COLUMN start_date TEXT').run();
  console.log('Successfully updated projects table.');
} catch (e) {
  console.error('Migration error:', e.message);
}
