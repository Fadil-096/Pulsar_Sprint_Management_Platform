const db = require('better-sqlite3')('./db/nokia_sprint.db');
try {
  db.prepare("UPDATE sprints SET status = 'review' WHERE id = 1").run();
  console.log('Success');
} catch(e) {
  console.error(e.message);
}
