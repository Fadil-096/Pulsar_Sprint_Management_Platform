/**
 * db/init.js — Initialize the Nokia Sprint Platform database
 * Creates all tables and seeds with demo data
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'nokia_sprint.db');

// Remove existing database if it exists
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('  Removed existing database.');
}

const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('\n  Nokia Sprint Platform — Database Initialization');
console.log('  ================================================\n');

try {
  // 1. Run schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
  console.log('  ✓ Schema created (8 tables + indexes)');

  // 2. Run seed data
  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
  db.exec(seed);
  console.log('  ✓ Seed data inserted');

  // 3. Verify
  const counts = {
    employees: db.prepare('SELECT COUNT(*) as c FROM employees').get().c,
    sprints: db.prepare('SELECT COUNT(*) as c FROM sprints').get().c,
    sprint_members: db.prepare('SELECT COUNT(*) as c FROM sprint_members').get().c,
    tasks: db.prepare('SELECT COUNT(*) as c FROM tasks').get().c,
    subtasks: db.prepare('SELECT COUNT(*) as c FROM subtasks').get().c,
    queries: db.prepare('SELECT COUNT(*) as c FROM queries').get().c,
    leaves: db.prepare('SELECT COUNT(*) as c FROM leaves').get().c,
    notifications: db.prepare('SELECT COUNT(*) as c FROM notifications').get().c,
  };

  console.log('\n  Database Summary:');
  console.log('  ─────────────────');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(20)} ${count} rows`);
  }

  // Show login credentials
  const users = db.prepare('SELECT name, email, password, role FROM employees ORDER BY role DESC, id ASC').all();
  console.log('\n  Login Credentials:');
  console.log('  ──────────────────');
  for (const u of users) {
    const badge = u.role === 'manager' ? '👔 MANAGER' : '👤 EMPLOYEE';
    console.log(`  ${badge}  ${u.name.padEnd(20)} ${u.email.padEnd(30)} ${u.password}`);
  }

  console.log('\n  ✓ Database initialized successfully!\n');
} catch (err) {
  console.error('  ✗ Error:', err.message);
  process.exit(1);
} finally {
  db.close();
}
