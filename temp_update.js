const db = require('better-sqlite3')('./db/nokia_sprint.db');

try {
  const sprintId = 'S4043';
  const taskId = 'TSK-1857';
  const assignees = [197];
  const primaryAssignedTo = assignees.length > 0 ? assignees[0] : 1;
  const assigneesJson = JSON.stringify(assignees);
  
  const stmt = db.prepare(`
    UPDATE tasks 
    SET assigned_to = ?, assignees_json = ? 
    WHERE task_id = ? AND sprint_id = ?
  `);
  const info = stmt.run(primaryAssignedTo, assigneesJson, taskId, sprintId);
  console.log('Update info:', info);
} catch(err) {
  console.error('Error:', err);
}
