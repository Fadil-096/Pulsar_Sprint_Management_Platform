const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, 'nokia_sprint.db'));

const tableInfo = db.prepare('PRAGMA table_info(projects)').all();
console.log("Table info for projects:", tableInfo);

try {
    const projectId = 'PRJ-TEST1234';
    db.prepare(`
      INSERT INTO projects (project_id, title, start_date, end_date, description) 
      VALUES (?, ?, ?, ?, ?)
    `).run(projectId, 'Test Title', '2026-07-10', '2026-07-23', 'Test Description');
    console.log("Successfully inserted a test project.");
    
    db.prepare('DELETE FROM projects WHERE project_id = ?').run(projectId);
} catch(e) {
    console.error("DB Insert Error:", e);
}
