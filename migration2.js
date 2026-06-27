const Database = require('better-sqlite3');
const db = new Database('./db/nokia_sprint.db');

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sprint_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sprint_id TEXT NOT NULL REFERENCES sprints(sprint_id),
      title TEXT NOT NULL,
      content TEXT,
      created_by INTEGER REFERENCES employees(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sprint_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sprint_id TEXT NOT NULL REFERENCES sprints(sprint_id),
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      is_external INTEGER DEFAULT 0,
      uploaded_by INTEGER REFERENCES employees(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('Migration successful');
} catch (e) {
  console.error(e);
}
db.close();
