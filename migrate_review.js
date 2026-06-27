const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'db', 'nokia_sprint.db'));

try {
  console.log('Starting migration...');
  
  db.pragma('foreign_keys = off');
  
  const txn = db.transaction(() => {
    // 1. Recreate sprints table with 'review' in CHECK constraint
    db.prepare(`
      CREATE TABLE sprints_new (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        sprint_id    TEXT NOT NULL UNIQUE,
        sprint_name  TEXT NOT NULL,
        sprint_goal  TEXT DEFAULT '',
        description  TEXT DEFAULT '',
        priority     TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical','high','medium','low')),
        status       TEXT NOT NULL DEFAULT 'created' CHECK(status IN ('created','planner','active','review','completed')),
        start_date   TEXT NOT NULL,
        end_date     TEXT NOT NULL,
        created_by   INTEGER REFERENCES employees(id),
        created_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();
    
    // Copy data
    db.prepare(`
      INSERT INTO sprints_new (id, sprint_id, sprint_name, sprint_goal, description, priority, status, start_date, end_date, created_by, created_at)
      SELECT id, sprint_id, sprint_name, sprint_goal, description, priority, status, start_date, end_date, created_by, created_at
      FROM sprints
    `).run();
    
    // Drop old and rename
    db.prepare('DROP TABLE sprints').run();
    db.prepare('ALTER TABLE sprints_new RENAME TO sprints').run();
    
    // 2. Create sprint_reviews table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS sprint_reviews (
        sprint_id TEXT PRIMARY KEY REFERENCES sprints(sprint_id),
        dod_met INTEGER DEFAULT 0,
        qa_passed INTEGER DEFAULT 0,
        stakeholder_signoff INTEGER DEFAULT 0,
        reviewer_notes TEXT DEFAULT '',
        return_reason TEXT DEFAULT '',
        moved_to_review_at TEXT,
        notes_updated_at TEXT
      )
    `).run();
  });
  
  txn();
  db.pragma('foreign_keys = on');
  
  console.log('Migration completed successfully!');
} catch (err) {
  console.error('Migration failed:', err);
}
