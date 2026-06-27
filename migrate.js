const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'db', 'nokia_sprint.db'));
db.pragma('journal_mode = WAL');

console.log("Starting leaves table migration...");

db.transaction(() => {
  // 1. Create the new table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS leaves_new (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id  INTEGER NOT NULL REFERENCES employees(id),
      manager_id   INTEGER NOT NULL REFERENCES employees(id),
      sprint_id    TEXT DEFAULT NULL REFERENCES sprints(sprint_id),
      leave_type   TEXT NOT NULL DEFAULT 'casual' CHECK(leave_type IN ('sick','casual','planned','emergency')),
      start_date   TEXT NOT NULL,
      end_date     TEXT NOT NULL,
      duration_days INTEGER NOT NULL DEFAULT 1,
      reason       TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
      manager_remark TEXT DEFAULT NULL,
      applied_at   TEXT NOT NULL DEFAULT (datetime('now')),
      decided_at   TEXT DEFAULT NULL
    )
  `).run();

  // 2. Copy data over, mapping 'approved' to 'accepted'
  db.prepare(`
    INSERT INTO leaves_new (
      id, employee_id, manager_id, sprint_id, leave_type, start_date, end_date, 
      duration_days, reason, status, applied_at, decided_at
    )
    SELECT 
      id, employee_id, manager_id, sprint_id, leave_type, start_date, end_date, 
      duration_days, reason, 
      CASE WHEN status = 'approved' THEN 'accepted' ELSE status END,
      applied_at, decided_at
    FROM leaves
  `).run();

  // 3. Drop the old table and indexes (indexes are dropped automatically)
  db.prepare('DROP TABLE leaves').run();

  // 4. Rename the new table
  db.prepare('ALTER TABLE leaves_new RENAME TO leaves').run();

  // 5. Recreate indexes
  db.prepare('CREATE INDEX IF NOT EXISTS idx_leaves_employee ON leaves(employee_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_leaves_manager ON leaves(manager_id)').run();
})();

console.log("Migration complete!");
