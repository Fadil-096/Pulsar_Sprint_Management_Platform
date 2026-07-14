const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'nokia_sprint.db');
const db = new Database(DB_PATH);

console.log('Seeding real users...');

const users = [
  { name: 'Fadil', email: 'fadil@arc.com', role: 'manager', team: 'Administration' },
  { name: 'Shane', email: 'shane@arc.com', role: 'manager', team: 'Development' },
  { name: 'Shivansh', email: 'shivansh@arc.com', role: 'manager', team: 'Development' },
  { name: 'Medha', email: 'medha@arc.com', role: 'employee', team: 'Development' },
  { name: 'Jakkula', email: 'jakkula@arc.com', role: 'employee', team: 'Development' },
  { name: 'Divi', email: 'divi@arc.com', role: 'employee', team: 'Development' },
  { name: 'Parangi', email: 'parangi@arc.com', role: 'employee', team: 'Development' },
  { name: 'Vaish', email: 'vaish@arc.com', role: 'employee', team: 'Development' },
  { name: 'Ruchitanshi', email: 'ruchitanshi@arc.com', role: 'employee', team: 'Development' },
];

const insert = db.prepare(`
  INSERT INTO employees (name, email, team, password, role, department, avatar_initials)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  for (const u of users) {
    const initials = u.name.substring(0, 2).toUpperCase();
    insert.run(u.name, u.email, u.team, 'arc@123', u.role, 'Engineering', initials);
  }
})();

console.log('Successfully seeded real users.');
