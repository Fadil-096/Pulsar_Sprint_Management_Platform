const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db', 'nokia_sprint.db');
const db = new Database(DB_PATH);

try {
  // Add assignees_json column
  console.log('Adding assignees_json column to tasks table...');
  db.prepare('ALTER TABLE tasks ADD COLUMN assignees_json TEXT DEFAULT "[]"').run();
  console.log('Column added successfully.');
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log('Column assignees_json already exists.');
  } else {
    console.error('Error adding column:', err);
  }
}

// Migrate existing assigned_to values into assignees_json
try {
  console.log('Migrating existing assigned_to data...');
  const tasks = db.prepare('SELECT id, assigned_to FROM tasks WHERE assigned_to IS NOT NULL').all();
  let updated = 0;
  
  const updateStmt = db.prepare('UPDATE tasks SET assignees_json = ? WHERE id = ?');
  
  db.transaction(() => {
    for (const t of tasks) {
      const arr = JSON.stringify([t.assigned_to]);
      updateStmt.run(arr, t.id);
      updated++;
    }
  })();
  
  console.log(`Migrated ${updated} tasks.`);
} catch (err) {
  console.error('Error migrating data:', err);
}

db.close();
console.log('Migration complete.');
