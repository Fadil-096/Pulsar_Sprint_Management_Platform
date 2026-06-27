const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'nokia_sprint.db');
const db = new Database(DB_PATH);

try {
  const user_id = 2; // Aditya Patel
  const today = '2026-06-26';
  const nowTime = '09:14:00';
  
  db.prepare(`
    INSERT INTO attendance (user_id, date, check_in, status)
    VALUES (?, ?, ?, 'Pending')
  `).run(user_id, today, nowTime);
  console.log("Success!");
} catch (err) {
  console.error("Error inserting:", err);
}
