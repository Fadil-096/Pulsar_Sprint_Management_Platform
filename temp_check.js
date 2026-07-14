const db = require('better-sqlite3')('./db/nokia_sprint.db');
const sprint = db.prepare("SELECT sprint_id FROM sprints WHERE sprint_name LIKE '%Support Chat Bot%'").get();
console.log(db.prepare('SELECT id, task_id, task_title, assigned_to FROM tasks WHERE sprint_id = ?').all(sprint.sprint_id));
