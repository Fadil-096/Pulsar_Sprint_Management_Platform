const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'db', 'nokia_sprint.db'));

const statuses = ['created', 'planner', 'active', 'review', 'completed'];
const sprintNames = [
  'Legacy API Migration',
  'Cloud Infrastructure Update',
  'Security Audit Remediations',
  'Payment Gateway Integration',
  'Customer Onboarding Revamp',
  'Machine Learning Pipeline v2',
  'Data Warehouse Scaling',
  'Frontend Performance Optimization',
  'Third-party Integrations',
  'Internal Admin Tools',
  'Mobile App Redesign',
  'Subscription Management',
  'GraphQL API Beta',
  'Automated Testing Overhaul',
  'Real-time Chat Feature'
];

let sprintIdCounter = 4327; // last one was 4326

for (let i = 0; i < 15; i++) {
  const sprintId = `S${sprintIdCounter++}`;
  const name = sprintNames[i];
  const status = statuses[i % statuses.length];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (15 * (15-i)));
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 14);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  console.log(`Inserting ${sprintId} - ${name} (${status})`);
  
  db.prepare(`
    INSERT INTO sprints (sprint_id, sprint_name, sprint_goal, description, priority, status, start_date, end_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(sprintId, name, `Goal for ${name}`, `Description for ${name}`, 'high', status, startStr, endStr, 1);

  // Add members
  for (let u = 1; u <= 10; u++) {
    db.prepare(`
      INSERT INTO sprint_members (sprint_id, user_id, estimated_hours, spent_hours)
      VALUES (?, ?, ?, ?)
    `).run(sprintId, u, Math.floor(Math.random() * 20) + 10, Math.floor(Math.random() * 15) + 5);
  }
}
console.log('Added 15 more synthetic sprints!');
db.close();
