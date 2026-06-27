const Database = require('better-sqlite3');
const db = new Database('./db/nokia_sprint.db');
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES employees(id),
      date         TEXT NOT NULL,
      check_in     TEXT DEFAULT NULL,
      check_out    TEXT DEFAULT NULL,
      total_hours  REAL DEFAULT 0,
      status       TEXT NOT NULL DEFAULT 'Present' CHECK(status IN ('Present','Absent','Half-Day','On Leave','Holiday','Late')),
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, date)
    );

    INSERT OR IGNORE INTO attendance (user_id, date, check_in, check_out, total_hours, status)
    VALUES (1, '2026-06-01', '09:00', '17:30', 8.5, 'Present'),
           (1, '2026-06-02', '08:45', '17:00', 8.25, 'Present'),
           (1, '2026-06-03', '09:15', '18:00', 8.75, 'Present'),
           (1, '2026-06-04', '09:00', '13:00', 4.0, 'Half-Day'),
           (1, '2026-06-05', '09:00', '17:30', 8.5, 'Present'),
           (1, '2026-06-08', '08:50', '17:10', 8.33, 'Present'),
           (1, '2026-06-09', '09:05', '17:30', 8.41, 'Present'),
           (2, '2026-06-01', '09:00', '17:00', 8.0, 'Present'),
           (2, '2026-06-02', '09:30', '17:30', 8.0, 'Present'),
           (2, '2026-06-03', '09:00', '17:00', 8.0, 'Present'),
           (2, '2026-06-04', NULL, NULL, 0, 'Absent'),
           (2, '2026-06-05', '09:00', '17:00', 8.0, 'Present'),
           (2, '2026-06-08', '09:00', '17:00', 8.0, 'Present'),
           (2, '2026-06-09', '09:10', '17:10', 8.0, 'Present');
  `);
  console.log('Migration successful');
} catch (e) {
  console.error(e);
}
db.close();
