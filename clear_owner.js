const db = require('better-sqlite3')('./db/nokia_sprint.db');
db.prepare("UPDATE sprints SET owner_id = NULL WHERE sprint_id = 'S4043'").run();
console.log('Done');
