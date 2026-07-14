const db = require('better-sqlite3')('database.sqlite');
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'").get());
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='subtasks'").get());
