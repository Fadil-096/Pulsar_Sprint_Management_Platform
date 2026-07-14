const db = require('better-sqlite3')('./db/nokia_sprint.db');
const tables = db.prepare('SELECT name FROM sqlite_master WHERE type="table"').all();
console.log(tables);
