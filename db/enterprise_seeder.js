const Database = require('better-sqlite3');
const path = require('path');

console.log('Starting Enterprise Data Generation...');
const dbPath = path.join(__dirname, 'nokia_sprint.db');
const db = new Database(dbPath);

// Clear existing data safely
const tables = ['timer_sessions', 'sprint_attachments', 'sprint_notes', 'leaves', 'notifications', 'queries', 'subtasks', 'tasks', 'sprint_members', 'sprint_reviews', 'sprints', 'employees'];
db.transaction(() => {
  tables.forEach(table => {
    try {
      db.prepare(`DELETE FROM ${table}`).run();
    } catch(e) {
      console.log(`Skipping table ${table}, might not exist.`);
    }
  });
})();
console.log('Database wiped for clean slate.');

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[randomInt(0, arr.length - 1)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const formatDate = (date) => date.toISOString().split('T')[0];
const formatDateTime = (date) => date.toISOString().replace('T', ' ').substring(0, 19);

// Data Pools
const firstNamesIndian = ['Hari', 'Aditya', 'Raghav', 'Karthik', 'Priya', 'Ananya', 'Rohan', 'Sneha', 'Vikram', 'Meera', 'Arjun', 'Rahul', 'Neha', 'Pooja', 'Karan'];
const lastNamesIndian = ['Krishnan', 'Menon', 'Sharma', 'Iyer', 'Nair', 'Patel', 'Singh', 'Deshmukh', 'Joshi', 'Kapoor'];
const firstNamesFinnish = ['Elena', 'Janne', 'Mikko', 'Kaisa', 'Minna', 'Lars', 'Sami', 'Anna', 'Olli', 'Pekka', 'Jari', 'Matti', 'Kari', 'Timo', 'Jukka'];
const lastNamesFinnish = ['Korhonen', 'Virtanen', 'Laine', 'Mäkinen', 'Nieminen', 'Hakala', 'Järvinen', 'Heikkinen', 'Koskinen', 'Lehtonen'];

const departments = ['Engineering', 'Design', 'Product', 'QA', 'DevOps'];
const teams = ['Core', 'Cloud', 'Mobile', 'Data', 'Security'];

// 1. Generate Managers (8 total)
const managers = [];
for (let i = 0; i < 8; i++) {
  const isIndian = Math.random() > 0.5;
  const fname = isIndian ? randomItem(firstNamesIndian) : randomItem(firstNamesFinnish);
  const lname = isIndian ? randomItem(lastNamesIndian) : randomItem(lastNamesFinnish);
  const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${i}@nokia.com`;
  managers.push({
    name: `${fname} ${lname}`,
    email,
    team: randomItem(teams),
    sub_team: 'Leadership',
    password: 'Nokia@123',
    role: 'manager',
    department: randomItem(departments),
    avatar_initials: `${fname[0]}${lname[0]}`,
    created_at: formatDateTime(new Date(2025, 6, 1))
  });
}

// Ensure at least one specific manager for login testing
managers[0].name = 'Lars Henrik';
managers[0].email = 'lars.henrik@nokia.com';
managers[0].avatar_initials = 'LH';

// 2. Generate Employees (60 total)
const employees = [];
for (let i = 0; i < 60; i++) {
  const isIndian = Math.random() > 0.5;
  const fname = isIndian ? randomItem(firstNamesIndian) : randomItem(firstNamesFinnish);
  const lname = isIndian ? randomItem(lastNamesIndian) : randomItem(lastNamesFinnish);
  const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${i}@nokia.com`; 
  employees.push({
    name: `${fname} ${lname}`,
    email,
    team: randomItem(teams),
    sub_team: 'Contributors',
    password: 'Nokia@123',
    role: 'employee',
    department: randomItem(departments),
    avatar_initials: `${fname[0]}${lname[0]}`,
    manager_id: 1, 
    created_at: formatDateTime(randomDate(new Date(2025, 6, 1), new Date(2025, 11, 31)))
  });
}

// Ensure specific employee for testing
employees[0].name = 'Sami Kapanen';
employees[0].email = 'sami.kapanen@nokia.com';
employees[0].avatar_initials = 'SK';

// Insert Users
const insertEmp = db.prepare('INSERT INTO employees (name, email, team, sub_team, password, role, department, avatar_initials, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const managerDbIds = [];
const employeeDbIds = [];

db.transaction(() => {
  for (const m of managers) {
    managerDbIds.push(insertEmp.run(m.name, m.email, m.team, m.sub_team, m.password, m.role, m.department, m.avatar_initials, m.created_at).lastInsertRowid);
  }
  for (const e of employees) {
    employeeDbIds.push(insertEmp.run(e.name, e.email, e.team, e.sub_team, e.password, e.role, e.department, e.avatar_initials, e.created_at).lastInsertRowid);
  }
})();

// 3. Sprints (49 total)
const sprintTitles = [
  'Platform Core Services', 'API Gateway Configuration', 'Cloud Migration Sprint',
  'Security Audit Remediation', 'Identity Access Modernization', 'Frontend Performance Optimization',
  'GraphQL API Beta', 'Container Security', 'Microservices Refactor', 'Payment Gateway Integration',
  'Mobile Push Notifications', 'Data Lake Implementation', 'Machine Learning Models V1', 'Dashboard Redesign',
  'Real-time Analytics', 'WebSocket Service', 'Caching Layer Setup', 'Authentication Service',
  'Billing Module Updates', 'Search Engine Optimization', 'User Profile Enhancements', 'Localization Sprint',
  'CI/CD Pipeline Upgrade', 'K8s Cluster Migration', 'Database Sharding', 'Rate Limiting Implementation',
  'Admin Panel V2', 'Third-party Integrations', 'Legacy Code Removal', 'Accessibility Improvements',
  'PDF Report Generator', 'Email Templates Revamp', 'Logging and Monitoring', 'Event Bus Architecture',
  'Disaster Recovery Testing', 'Serverless Functions', 'A/B Testing Framework', 'Feedback System',
  'Gamification Features', 'Onboarding Flow', 'Subscription Management', 'Audit Logs Implementation',
  'Data Export Tool', 'Support Chat Bot', 'Video Streaming Setup', 'Image Processing Pipeline',
  'Two-Factor Auth', 'OAuth Providers', 'Theme Support'
];

let sprintCount = 0;
const generateSprints = (count, status, startRangeStr, endRangeStr) => {
  const list = [];
  const startRange = new Date(startRangeStr);
  const endRange = new Date(endRangeStr);
  for (let i = 0; i < count; i++) {
    const sDate = randomDate(startRange, endRange);
    const eDate = new Date(sDate.getTime() + 14 * 24 * 60 * 60 * 1000); 
    list.push({
      sprint_id: `S${4000 + sprintCount}`,
      sprint_name: sprintTitles[sprintCount % sprintTitles.length],
      sprint_goal: `Complete ${sprintTitles[sprintCount % sprintTitles.length]} tasks.`,
      description: 'Enterprise level sprint for modernizing our tech stack.',
      priority: randomItem(['low', 'medium', 'high', 'critical']),
      status: status,
      start_date: formatDate(sDate),
      end_date: formatDate(eDate),
      created_by: randomItem(managerDbIds),
      created_at: formatDateTime(new Date(sDate.getTime() - 7 * 24 * 60 * 60 * 1000))
    });
    sprintCount++;
  }
  return list;
};

const allSprints = [
  ...generateSprints(25, 'completed', '2025-07-01', '2026-05-01'),
  ...generateSprints(5, 'completed', '2026-05-15', '2026-06-15'),
  ...generateSprints(8, 'active', '2026-06-20', '2026-07-02'),
  ...generateSprints(5, 'created', '2026-07-10', '2026-08-01'),
  ...generateSprints(6, 'planner', '2026-08-10', '2026-09-01')
];

const insertSprint = db.prepare('INSERT INTO sprints (sprint_id, sprint_name, sprint_goal, description, priority, status, start_date, end_date, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertReview = db.prepare('INSERT INTO sprint_reviews (sprint_id, dod_met, qa_passed, stakeholder_signoff, reviewer_notes) VALUES (?, ?, ?, ?, ?)');
const sprintDbRecords = [];

db.transaction(() => {
  for (const s of allSprints) {
    const id = insertSprint.run(s.sprint_id, s.sprint_name, s.sprint_goal, s.description, s.priority, s.status, s.start_date, s.end_date, s.created_by, s.created_at).lastInsertRowid;
    sprintDbRecords.push({ id, ...s });
    if (s.status === 'completed') {
      insertReview.run(s.sprint_id, 1, Math.random() > 0.1 ? 1 : 0, Math.random() > 0.1 ? 1 : 0, 'Standard sprint review notes.');
    }
  }
})();

// Sprint Members
const insertSprintMember = db.prepare('INSERT INTO sprint_members (sprint_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)');
db.transaction(() => {
  for (const s of sprintDbRecords) {
    const teamSize = randomInt(4, 10);
    const assignedEmps = [];
    while (assignedEmps.length < teamSize) {
      const emp = randomItem(employeeDbIds);
      if (!assignedEmps.includes(emp)) assignedEmps.push(emp);
    }
    for (const empId of assignedEmps) {
      const isCompleted = s.status === 'completed';
      insertSprintMember.run(s.sprint_id, empId, randomItem(['Frontend', 'Backend', 'QA', 'DevOps']), s.created_at);
    }
  }
})();

// 4. Tasks & 5. Subtasks (~900 tasks, ~3200 subtasks)
const getPriority = () => {
  const r = Math.random();
  if (r < 0.05) return 'critical';
  if (r < 0.25) return 'high';
  if (r < 0.75) return 'medium';
  return 'low';
};
const getTaskStatus = (sprintStatus) => {
  if (sprintStatus === 'completed') return 'done';
  if (sprintStatus === 'created' || sprintStatus === 'planner') return 'todo';
  const r = Math.random();
  if (r < 0.58) return 'done';
  if (r < 0.82) return 'inprogress';
  if (r < 0.88) return 'blocked';
  return 'todo';
};

const insertTask = db.prepare('INSERT INTO tasks (task_id, sprint_id, assigned_to, task_title, description, priority, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertSubtask = db.prepare('INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const insertQuery = db.prepare('INSERT INTO queries (query_id, task_id, raised_by, query_text, reply_text, replied_by, status, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

let taskIdCounter = 1000;
let subtaskIdCounter = 10000;
let queryIdCounter = 1;

db.transaction(() => {
  for (const s of sprintDbRecords) {
    const numTasks = randomInt(18, 22); 
    for (let i = 0; i < numTasks; i++) {
      const tid = `TSK-${taskIdCounter++}`;
      const status = getTaskStatus(s.status);
      insertTask.run(tid, s.sprint_id, randomItem(employeeDbIds), `Task related to ${s.sprint_name} ${i}`, 'Enterprise generated task description with details.', getPriority(), status, s.created_by, s.created_at);
      
      const numSubtasks = randomInt(2, 6);
      for (let j = 0; j < numSubtasks; j++) {
        const stid = `SUB-${subtaskIdCounter++}`;
        const stStatus = status === 'done' ? 'done' : (status === 'todo' ? 'todo' : randomItem(['todo', 'inprogress', 'done']));
        insertSubtask.run(stid, tid, s.created_by, `Subtask ${j} for ${tid}`, 'Subtask implementation details.', getPriority(), stStatus, s.created_at);
      }
      
      if (Math.random() < 0.15) {
        const qStatus = status === 'done' ? 'resolved' : randomItem(['open', 'resolved']);
        insertQuery.run(`QRY-${queryIdCounter++}`, tid, randomItem(employeeDbIds), 'Need clarification regarding API design.', qStatus === 'resolved' ? 'Here is the swagger doc.' : null, qStatus === 'resolved' ? randomItem(managerDbIds) : null, qStatus, s.created_at, qStatus === 'resolved' ? formatDateTime(new Date()) : null);
      }
    }
  }
})();

// 7. Leaves (~180)
const insertLeave = db.prepare('INSERT INTO leaves (employee_id, manager_id, leave_type, start_date, end_date, duration_days, reason, status, applied_at, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const leaveTypes = ['sick', 'casual', 'planned'];
const leaveReasons = ['Medical appointment', 'Family function', 'Food poisoning', 'Vacation', 'Marriage', 'Personal emergency'];

db.transaction(() => {
  for (let i = 0; i < 180; i++) {
    const empId = randomItem(employeeDbIds);
    const manId = randomItem(managerDbIds);
    const r = Math.random();
    const status = r < 0.7 ? 'approved' : (r < 0.8 ? 'rejected' : 'pending');
    const start = randomDate(new Date(2025, 11, 1), new Date(2026, 6, 1));
    const duration = randomInt(1, 5);
    const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);
    insertLeave.run(empId, manId, randomItem(leaveTypes), formatDate(start), formatDate(end), duration, randomItem(leaveReasons), status, formatDateTime(new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000)), status !== 'pending' ? formatDateTime(new Date(start.getTime() - 2 * 24 * 60 * 60 * 1000)) : null);
  }
})();

// 8. Notifications (~900)
const insertNotif = db.prepare('INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
const notifTypes = ['sprint', 'task', 'leave', 'query', 'subtask', 'blocked'];
db.transaction(() => {
  for (let i = 0; i < 900; i++) {
    const isRead = Math.random() < 0.82 ? 1 : 0;
    const recipient = randomItem([...managerDbIds, ...employeeDbIds]);
    const sender = randomItem([...managerDbIds, ...employeeDbIds]);
    insertNotif.run(recipient, sender, randomItem(notifTypes), 'System Notification', 'This is an auto-generated enterprise notification.', isRead, formatDateTime(randomDate(new Date(2026, 0, 1), new Date())));
  }
})();

console.log('Successfully injected massive enterprise dataset!');
