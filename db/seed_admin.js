const Database = require('better-sqlite3');
const path = require('path');


const dbPath = path.join(__dirname, 'nokia_sprint.db');
const db = new Database(dbPath);

try {
  console.log('Checking for default admin account...');
  const adminExists = db.prepare("SELECT * FROM employees WHERE role = 'administrator'").get();
  if (!adminExists) {
    db.prepare(`
      INSERT INTO employees (name, email, team, password, role, department, avatar_initials) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('System Administrator', 'admin@nokia.com', 'Leadership', 'admin123', 'administrator', 'Management', 'SA');
    console.log('Default admin account created: admin@nokia.com / admin123');
  } else {
    console.log('Admin account already exists.');
  }
} catch (err) {
  console.error('Error seeding admin:', err);
}

db.close();
