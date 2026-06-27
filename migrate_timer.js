const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'db', 'nokia_sprint.db'));

console.log("Creating timer_sessions table...");

db.prepare(`
  CREATE TABLE IF NOT EXISTS timer_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subtask_id TEXT NOT NULL REFERENCES subtasks(subtask_id),
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    start_time TEXT NOT NULL DEFAULT (datetime('now')),
    end_time TEXT DEFAULT NULL,
    duration REAL DEFAULT NULL
  )
`).run();

db.prepare('CREATE INDEX IF NOT EXISTS idx_timer_sessions_employee ON timer_sessions(employee_id)').run();
db.prepare('CREATE INDEX IF NOT EXISTS idx_timer_sessions_subtask ON timer_sessions(subtask_id)').run();

console.log("Migration complete!");
