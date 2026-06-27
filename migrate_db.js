const fs = require('fs');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'database.sqlite');

try {
  const db = new Database(dbPath);

  // 1. Drop the columns using sqlite 3.35+ support for ALTER TABLE DROP COLUMN
  console.log("Altering tables...");
  
  try { db.exec('ALTER TABLE tasks DROP COLUMN spent_hours'); } catch (e) { console.log(e.message); }
  try { db.exec('ALTER TABLE subtasks DROP COLUMN spent_hours'); } catch (e) { console.log(e.message); }
  try { db.exec('ALTER TABLE sprint_members DROP COLUMN spent_hours'); } catch (e) { console.log(e.message); }
  
  // 2. Drop timer_sessions table
  console.log("Dropping timer_sessions...");
  try { db.exec('DROP TABLE IF EXISTS timer_sessions'); } catch (e) { console.log(e.message); }

  console.log("Database migration successful.");
  db.close();

} catch(err) {
  console.error("Migration error:", err);
}
