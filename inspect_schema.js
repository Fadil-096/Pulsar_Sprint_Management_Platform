const Database = require('better-sqlite3');
const db = new Database('./db/nokia_sprint.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => {
  console.log('\n=== ' + t.name + ' ===');
  const cols = db.prepare('PRAGMA table_info(' + t.name + ')').all();
  cols.forEach(c => console.log('  ' + c.name + ' (' + c.type + ')' + (c.pk ? ' PK' : '') + (c.notnull ? ' NOT NULL' : '') + (c.dflt_value ? ' DEFAULT ' + c.dflt_value : '')));
});

// Also check existing row counts
console.log('\n\n=== ROW COUNTS ===');
tables.forEach(t => {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM ' + t.name).get();
  console.log('  ' + t.name + ': ' + count.cnt);
});

// Check existing employees
console.log('\n\n=== EXISTING EMPLOYEES ===');
const emps = db.prepare('SELECT id, name, email, role, team, sub_team, department FROM employees').all();
emps.forEach(e => console.log('  ', JSON.stringify(e)));

// Check existing sprints
console.log('\n\n=== EXISTING SPRINTS ===');
const sprints = db.prepare('SELECT sprint_id, sprint_name, status, start_date, end_date FROM sprints').all();
sprints.forEach(s => console.log('  ', JSON.stringify(s)));

db.close();
