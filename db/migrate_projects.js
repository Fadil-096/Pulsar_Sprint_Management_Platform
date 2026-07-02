const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'nokia_sprint.db');
const db = new Database(DB_PATH);

console.log('Running Projects migration...');

db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id     TEXT NOT NULL UNIQUE,
    title          TEXT NOT NULL,
    deadline       TEXT NOT NULL,
    description    TEXT DEFAULT '',
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
  )
`).run();
console.log('Created projects table.');

db.prepare(`
  CREATE TABLE IF NOT EXISTS project_tasks (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id        TEXT NOT NULL UNIQUE,
    project_id     TEXT NOT NULL,
    title          TEXT NOT NULL,
    priority       TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical','high','medium','low')),
    is_completed   INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
  )
`).run();
console.log('Created project_tasks table.');

console.log('Migration complete.');
