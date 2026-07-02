const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'nokia_sprint.db');
const db = new Database(DB_PATH);

console.log('Running Backlog migration...');

db.prepare(`
  CREATE TABLE IF NOT EXISTS backlog_items (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    backlog_id     TEXT NOT NULL UNIQUE,
    feature_id     TEXT DEFAULT '',
    title          TEXT NOT NULL,
    description    TEXT DEFAULT '',
    category       TEXT DEFAULT '',
    priority       TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical','high','medium','low')),
    story_points   INTEGER DEFAULT 0,
    estimated_effort INTEGER DEFAULT 0,
    business_value INTEGER DEFAULT 0,
    labels         TEXT DEFAULT '',
    dependencies   TEXT DEFAULT '',
    acceptance_criteria TEXT DEFAULT '',
    status         TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','ready','refinement','approved','deferred','planned')),
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
  )
`).run();
console.log('Created backlog_items table.');

try {
  db.prepare('ALTER TABLE tasks ADD COLUMN backlog_item_id TEXT DEFAULT NULL').run();
  console.log('Added backlog_item_id column to tasks.');
} catch (err) {
  console.log('Column backlog_item_id already exists in tasks or error:', err.message);
}

console.log('Migration complete.');
