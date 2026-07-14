const db = require('better-sqlite3')('./db/nokia_sprint.db');
db.prepare("UPDATE tasks SET assignees_json = '[]' WHERE sprint_id = 'S4043'").run();
console.log('Done');
