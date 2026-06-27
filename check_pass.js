const sqlite3 = require('better-sqlite3');
const path = require('path');
const db = new sqlite3(path.join(__dirname, 'db', 'nokia_sprint.db'));

const managers = db.prepare('SELECT email, password FROM employees WHERE role = "manager"').all();
console.log(managers);
