const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'nokia_sprint.db');
const db = new Database(DB_PATH);

try {
  console.log('Migrating attendance table...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance_new (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES employees(id),
      date         TEXT NOT NULL,
      check_in     TEXT DEFAULT NULL,
      check_out    TEXT DEFAULT NULL,
      total_hours  REAL DEFAULT 0,
      status       TEXT NOT NULL DEFAULT 'Present' CHECK(status IN ('Present','Absent','Half-Day','On Leave','Holiday','Late','Pending','No action')),
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, date)
    );
  `);

  db.exec(`INSERT INTO attendance_new SELECT * FROM attendance;`);
  db.exec(`DROP TABLE attendance;`);
  db.exec(`ALTER TABLE attendance_new RENAME TO attendance;`);

  console.log('Migration completed successfully.');
} catch (err) {
  console.error('Migration failed:', err.message);
} finally {
  db.close();
}
