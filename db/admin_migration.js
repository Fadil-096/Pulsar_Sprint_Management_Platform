const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'nokia_sprint.db');
const db = new Database(dbPath);

console.log('Starting migration for Administrator role...');

try {
  db.exec('PRAGMA foreign_keys=OFF;');
  db.exec('BEGIN TRANSACTION;');

  // 1. Update employees table constraint
  console.log('Updating employees table constraint...');
  
  // Create temp table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees_new (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      email        TEXT NOT NULL UNIQUE,
      team         TEXT NOT NULL,
      sub_team     TEXT NOT NULL DEFAULT '',
      password     TEXT NOT NULL,
      role         TEXT NOT NULL CHECK(role IN ('administrator', 'manager', 'employee')),
      department   TEXT DEFAULT '',
      avatar_initials TEXT DEFAULT '',
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  
  // Copy data
  db.exec(`INSERT INTO employees_new SELECT * FROM employees;`);
  
  // Drop old and rename
  db.exec(`DROP TABLE employees;`);
  db.exec(`ALTER TABLE employees_new RENAME TO employees;`);
  
  // 2. Create new tables
  console.log('Creating new tables...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      performed_by INTEGER REFERENCES employees(id),
      affected_user INTEGER REFERENCES employees(id),
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      details TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      description TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL CHECK(role IN ('administrator', 'manager', 'employee')),
      module TEXT NOT NULL,
      can_read INTEGER DEFAULT 0,
      can_write INTEGER DEFAULT 0,
      can_delete INTEGER DEFAULT 0,
      UNIQUE(role, module)
    );
  `);

  db.exec('COMMIT;');
  db.exec('PRAGMA foreign_keys=ON;');
  console.log('Migration completed successfully!');

  // Seed default admin account
  console.log('Checking for default admin account...');
  const bcrypt = require('bcrypt');
  const adminExists = db.prepare("SELECT * FROM employees WHERE role = 'administrator'").get();
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO employees (name, email, team, password, role, department, avatar_initials) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('System Administrator', 'admin@nokia.com', 'Leadership', hash, 'administrator', 'Management', 'SA');
    console.log('Default admin account created: admin@nokia.com / admin123');
  }

} catch (err) {
  db.exec('ROLLBACK;');
  console.error('Migration failed:', err);
}

db.close();
