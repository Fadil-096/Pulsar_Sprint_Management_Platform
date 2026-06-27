/**
 * seed_synthetic_data.js
 * Nokia Sprint Management Platform — Production-Quality Synthetic Data Generator
 * 
 * Purges all transactional data and populates the database with a realistic,
 * structurally sound dataset for 10 team members across 5 sprints.
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db', 'nokia_sprint.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF'); // Temporarily disable for purge

// ── Date Helpers ────────────────────────────────────────────────────────
const NOW = new Date();
const TODAY = NOW.toISOString().split('T')[0]; // e.g. 2026-06-16

function daysAgo(n) {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function daysFromNow(n) {
  const d = new Date(NOW);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function isoTimestamp(dateStr, hours, minutes) {
  return `${dateStr}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00Z`;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isWeekday(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const day = d.getUTCDay();
  return day !== 0 && day !== 6;
}

function getWorkingDays(startDate, endDate) {
  const days = [];
  let d = new Date(startDate + 'T12:00:00Z');
  const end = new Date(endDate + 'T12:00:00Z');
  while (d <= end) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) {
      days.push(d.toISOString().split('T')[0]);
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// ══════════════════════════════════════════════════════════════════════════
// PHASE 1: PURGE ALL TRANSACTIONAL DATA
// ══════════════════════════════════════════════════════════════════════════
console.log('\n🗑️  PHASE 1: Purging all transactional data...');

const PURGE_TABLES = [
  'timer_sessions', 'subtasks', 'tasks', 'queries',
  'sprint_members', 'sprint_notes', 'sprint_attachments', 'sprints',
  'leaves', 'attendance', 'notifications', 'user_settings'
];

for (const table of PURGE_TABLES) {
  db.prepare(`DELETE FROM ${table}`).run();
  console.log(`  ✓ Purged ${table}`);
}

// Reset auto-increment sequences
for (const table of PURGE_TABLES) {
  try {
    db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
  } catch (e) { /* ignore */ }
}

// Purge all employees (we'll recreate them)
db.prepare('DELETE FROM employees').run();
try { db.prepare("DELETE FROM sqlite_sequence WHERE name = 'employees'").run(); } catch(e) {}
console.log('  ✓ Purged employees');

console.log('  ✅ Purge complete.\n');


// ══════════════════════════════════════════════════════════════════════════
// PHASE 2: CREATE TEAM ROSTER (10 Employees)
// ══════════════════════════════════════════════════════════════════════════
console.log('👥 PHASE 2: Creating team roster...');

const employees = [
  { name: 'Hari Krishnan',    email: 'hari.krishnan@nokia.com',    role: 'manager',  team: 'Core Platform', sub_team: 'Strategy',    dept: 'Engineering', initials: 'HK', password: 'nokia@123' },
  { name: 'Aditya Patel',     email: 'aditya.patel@nokia.com',     role: 'employee', team: 'Core Platform', sub_team: 'Backend',     dept: 'Engineering', initials: 'AP', password: 'nokia@123' },
  { name: 'Mikko Virtanen',   email: 'mikko.virtanen@nokia.com',   role: 'employee', team: 'Core Platform', sub_team: 'Backend',     dept: 'Engineering', initials: 'MV', password: 'nokia@123' },
  { name: 'Elena Korhonen',   email: 'elena.korhonen@nokia.com',   role: 'employee', team: 'Core Platform', sub_team: 'Backend',     dept: 'Engineering', initials: 'EK', password: 'nokia@123' },
  { name: 'Ravi Chandran',    email: 'ravi.chandran@nokia.com',    role: 'employee', team: 'Core Platform', sub_team: 'Frontend',    dept: 'Engineering', initials: 'RC', password: 'nokia@123' },
  { name: 'Annika Salminen',  email: 'annika.salminen@nokia.com',  role: 'employee', team: 'Core Platform', sub_team: 'Frontend',    dept: 'Engineering', initials: 'AS', password: 'nokia@123' },
  { name: 'Priya Nair',       email: 'priya.nair@nokia.com',       role: 'employee', team: 'Core Platform', sub_team: 'Frontend',    dept: 'Engineering', initials: 'PN', password: 'nokia@123' },
  { name: 'Kaisa Laine',      email: 'kaisa.laine@nokia.com',      role: 'employee', team: 'Core Platform', sub_team: 'QA',          dept: 'Engineering', initials: 'KL', password: 'nokia@123' },
  { name: 'Janne Ahonen',     email: 'janne.ahonen@nokia.com',     role: 'employee', team: 'Core Platform', sub_team: 'QA',          dept: 'Engineering', initials: 'JA', password: 'nokia@123' },
  { name: 'Kaisa Niemi',      email: 'kaisa.niemi@nokia.com',      role: 'employee', team: 'Core Platform', sub_team: 'UI/UX',       dept: 'Engineering', initials: 'KN', password: 'nokia@123' },
];

const insertEmployee = db.prepare(`
  INSERT INTO employees (name, email, role, team, sub_team, password, department, avatar_initials)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const empIds = {};
for (const emp of employees) {
  const info = insertEmployee.run(emp.name, emp.email, emp.role, emp.team, emp.sub_team, emp.password, emp.dept, emp.initials);
  empIds[emp.name] = info.lastInsertRowid;
  console.log(`  ✓ ${emp.name} (ID: ${info.lastInsertRowid}, ${emp.role}, ${emp.sub_team})`);
}

const MANAGER_ID = empIds['Hari Krishnan'];

// Feature assignments
const FEATURES = {
  'Aditya Patel':    'FEAT-101',  // Authentication & Security
  'Mikko Virtanen':  'FEAT-102',  // API Gateway & Integrations
  'Elena Korhonen':  'FEAT-103',  // Data Pipeline & Analytics
  'Ravi Chandran':   'FEAT-104',  // Core UI Components
  'Annika Salminen': 'FEAT-105',  // Dashboard & Reporting
  'Priya Nair':      'FEAT-106',  // Mobile Responsive Views
  'Kaisa Laine':     'FEAT-107',  // QA Automation Framework
  'Janne Ahonen':    'FEAT-108',  // Performance & Load Testing
  'Kaisa Niemi':     'FEAT-109',  // Design System & Branding
};

console.log('  ✅ Team roster created.\n');


// ══════════════════════════════════════════════════════════════════════════
// PHASE 3: CREATE SPRINTS (5 Total)
// ══════════════════════════════════════════════════════════════════════════
console.log('🏃 PHASE 3: Creating sprints...');

const insertSprint = db.prepare(`
  INSERT INTO sprints (sprint_id, sprint_name, sprint_goal, description, priority, status, start_date, end_date, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const sprintsData = [
  {
    id: 'S4322', name: 'Authentication Hardening',
    goal: 'Strengthen platform security with MFA, session management, and OAuth2 integration',
    desc: 'Security-focused sprint to harden the authentication layer, implement multi-factor authentication, and integrate Nokia SSO with OAuth2 providers.',
    priority: 'high', status: 'completed',
    start: daysAgo(56), end: daysAgo(43) // ~8 weeks ago, 2 week sprint - HEALTHY
  },
  {
    id: 'S4323', name: 'Analytics Dashboard MVP',
    goal: 'Build the first version of the real-time analytics dashboard with KPI tracking',
    desc: 'Deliver the first iteration of the analytics dashboard including real-time charts, data export functionality, and automated daily report generation.',
    priority: 'high', status: 'completed',
    start: daysAgo(42), end: daysAgo(29) // ~6 weeks ago - AT RISK (slightly over budget)
  },
  {
    id: 'S4324', name: 'Mobile Responsive Overhaul',
    goal: 'Make all critical user flows fully responsive for tablet and mobile viewports',
    desc: 'Comprehensive responsive redesign of all primary user interfaces, including navigation, data tables, forms, and dashboard components.',
    priority: 'medium', status: 'completed',
    start: daysAgo(28), end: daysAgo(15) // ~4 weeks ago - DELAYED
  },
  {
    id: 'S4325', name: 'Platform Core Services',
    goal: 'Deliver core microservices architecture with API gateway, caching layer, and service mesh',
    desc: 'Build the foundational microservices layer including API gateway configuration, Redis caching integration, gRPC service communication, and health check monitoring endpoints.',
    priority: 'high', status: 'active',
    start: daysAgo(4), end: daysFromNow(10) // ACTIVE — current sprint
  },
  {
    id: 'S4326', name: 'AI Testing Framework',
    goal: 'Implement AI-driven test generation and automated regression testing pipeline',
    desc: 'Design and scaffold the AI-powered testing framework including test case generation from user stories, visual regression detection, and integration with the CI/CD pipeline.',
    priority: 'medium', status: 'planner',
    start: daysFromNow(11), end: daysFromNow(25) // FUTURE — planner mode
  },
];

for (const s of sprintsData) {
  insertSprint.run(s.id, s.name, s.goal, s.desc, s.priority, s.status, s.start, s.end, MANAGER_ID);
  console.log(`  ✓ ${s.id} — ${s.name} [${s.status.toUpperCase()}] (${s.start} → ${s.end})`);
}

console.log('  ✅ Sprints created.\n');


// ══════════════════════════════════════════════════════════════════════════
// PHASE 4: SPRINT MEMBERS
// ══════════════════════════════════════════════════════════════════════════
console.log('🔗 PHASE 4: Assigning sprint members...');

const insertMember = db.prepare(`
  INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
  VALUES (?, ?, ?, ?, ?)
`);

const memberRoles = {
  'Hari Krishnan':    'Scrum Master',
  'Aditya Patel':     'Senior Backend Developer',
  'Mikko Virtanen':   'Backend Developer',
  'Elena Korhonen':   'Data Engineer',
  'Ravi Chandran':    'Senior Frontend Developer',
  'Annika Salminen':  'Frontend Developer',
  'Priya Nair':       'Frontend Developer',
  'Kaisa Laine':      'QA Lead',
  'Janne Ahonen':     'QA Engineer',
  'Kaisa Niemi':      'UI/UX Designer',
};

// All members participate in all sprints
for (const s of sprintsData) {
  for (const emp of employees) {
    const estHours = emp.role === 'manager' ? 20 : randomBetween(30, 50);
    let spentHours = 0;
    if (s.status === 'completed') spentHours = estHours + randomBetween(-5, 8);
    else if (s.status === 'active') spentHours = Math.round(estHours * 0.3);
    
    insertMember.run(s.id, empIds[emp.name], memberRoles[emp.name], estHours, spentHours);
  }
  console.log(`  ✓ ${s.id}: All 10 members assigned`);
}

console.log('  ✅ Sprint members assigned.\n');


// ══════════════════════════════════════════════════════════════════════════
// PHASE 5: TASKS & SUBTASKS — Deep Hierarchies
// ══════════════════════════════════════════════════════════════════════════
console.log('📋 PHASE 5: Creating tasks and subtasks...');

const insertTask = db.prepare(`
  INSERT INTO tasks (task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by, feature_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertSubtask = db.prepare(`
  INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let taskCounter = 1;
let subtaskCounter = 1;

function makeTaskId() { return 'TSK-' + String(taskCounter++).padStart(3, '0'); }
function makeSubtaskId() { return 'SUB-' + String(subtaskCounter++).padStart(3, '0'); }

// ── S4322 (Completed — HEALTHY) ──
const s4322Tasks = [
  { assignee: 'Aditya Patel', title: 'Implement Multi-Factor Authentication', desc: 'Add TOTP-based MFA using authenticator apps with QR code enrollment flow', priority: 'high', est: 16, spent: 15, feature: 'FEAT-101', subtasks: [
    { title: 'Design MFA enrollment database schema', est: 2, spent: 2 },
    { title: 'Build TOTP secret generation and QR code endpoint', est: 4, spent: 3.5 },
    { title: 'Create MFA verification middleware', est: 4, spent: 4 },
    { title: 'Add backup recovery codes generation', est: 3, spent: 2.5 },
    { title: 'Write unit tests for MFA flow', est: 3, spent: 3 },
  ]},
  { assignee: 'Aditya Patel', title: 'OAuth2 SSO Integration', desc: 'Integrate Nokia SSO provider using OAuth2 authorization code flow with PKCE', priority: 'high', est: 14, spent: 13, feature: 'FEAT-101', subtasks: [
    { title: 'Configure OAuth2 client credentials and redirect URIs', est: 2, spent: 2 },
    { title: 'Implement authorization code exchange endpoint', est: 4, spent: 4 },
    { title: 'Build token refresh and session management', est: 4, spent: 3.5 },
    { title: 'Create SSO login button component', est: 2, spent: 1.5 },
    { title: 'End-to-end integration testing with Nokia IdP', est: 2, spent: 2 },
  ]},
  { assignee: 'Mikko Virtanen', title: 'Session Management Hardening', desc: 'Implement secure session handling with Redis-backed token store and automatic expiration', priority: 'high', est: 12, spent: 11, feature: 'FEAT-102', subtasks: [
    { title: 'Set up Redis connection pool for sessions', est: 3, spent: 3 },
    { title: 'Implement sliding window session expiration', est: 3, spent: 2.5 },
    { title: 'Add concurrent session detection and limiting', est: 3, spent: 3 },
    { title: 'Build session audit logging middleware', est: 3, spent: 2.5 },
  ]},
  { assignee: 'Elena Korhonen', title: 'Security Audit Data Pipeline', desc: 'Build data pipeline to aggregate and analyze authentication events for anomaly detection', priority: 'medium', est: 10, spent: 10.5, feature: 'FEAT-103', subtasks: [
    { title: 'Define authentication event schema', est: 2, spent: 2 },
    { title: 'Build event ingestion queue processor', est: 3, spent: 3.5 },
    { title: 'Create anomaly detection rule engine', est: 3, spent: 3 },
    { title: 'Generate weekly security summary reports', est: 2, spent: 2 },
  ]},
  { assignee: 'Ravi Chandran', title: 'Login Page Redesign', desc: 'Complete redesign of the login page with Nokia branding, MFA support, and SSO buttons', priority: 'medium', est: 8, spent: 7, feature: 'FEAT-104', subtasks: [
    { title: 'Create responsive login form layout', est: 2, spent: 2 },
    { title: 'Integrate Nokia brand logo and color scheme', est: 2, spent: 1.5 },
    { title: 'Add MFA code input step', est: 2, spent: 2 },
    { title: 'Implement SSO provider selection buttons', est: 2, spent: 1.5 },
  ]},
  { assignee: 'Annika Salminen', title: 'Password Reset Flow', desc: 'Build secure password reset flow with email verification and strength validation', priority: 'medium', est: 8, spent: 7.5, feature: 'FEAT-105', subtasks: [
    { title: 'Create forgot password request form', est: 2, spent: 2 },
    { title: 'Build email verification token system', est: 3, spent: 2.5 },
    { title: 'Implement password strength validator component', est: 3, spent: 3 },
  ]},
  { assignee: 'Kaisa Laine', title: 'Authentication Test Suite', desc: 'Comprehensive automated test coverage for all authentication flows', priority: 'high', est: 10, spent: 9.5, feature: 'FEAT-107', subtasks: [
    { title: 'Write login/logout integration tests', est: 3, spent: 3 },
    { title: 'Create MFA enrollment and verification tests', est: 3, spent: 2.5 },
    { title: 'Build OAuth2 SSO flow end-to-end tests', est: 2, spent: 2 },
    { title: 'Add negative testing for brute force protection', est: 2, spent: 2 },
  ]},
  { assignee: 'Janne Ahonen', title: 'Load Testing Authentication Endpoints', desc: 'Performance baseline testing for login, MFA, and session validation endpoints', priority: 'medium', est: 8, spent: 7, feature: 'FEAT-108', subtasks: [
    { title: 'Set up k6 load testing scripts', est: 2, spent: 2 },
    { title: 'Run baseline login throughput tests', est: 2, spent: 1.5 },
    { title: 'Stress test concurrent session management', est: 2, spent: 2 },
    { title: 'Document performance benchmarks report', est: 2, spent: 1.5 },
  ]},
  { assignee: 'Kaisa Niemi', title: 'Security UX Audit', desc: 'Review and improve user experience across all authentication-related screens', priority: 'low', est: 6, spent: 5.5, feature: 'FEAT-109', subtasks: [
    { title: 'Audit error message clarity and consistency', est: 2, spent: 2 },
    { title: 'Redesign MFA setup wizard illustrations', est: 2, spent: 1.5 },
    { title: 'Create accessibility compliance checklist', est: 2, spent: 2 },
  ]},
  { assignee: 'Priya Nair', title: 'Mobile Auth Views', desc: 'Ensure all authentication screens are fully responsive on mobile devices', priority: 'medium', est: 6, spent: 6, feature: 'FEAT-106', subtasks: [
    { title: 'Responsive login form for small screens', est: 2, spent: 2 },
    { title: 'Mobile-optimized MFA code input', est: 2, spent: 2 },
    { title: 'Touch-friendly SSO provider buttons', est: 2, spent: 2 },
  ]},
];

// ── S4323 (Completed — AT RISK, over budget) ──
const s4323Tasks = [
  { assignee: 'Elena Korhonen', title: 'Real-Time Analytics Engine', desc: 'Build the core analytics aggregation engine with WebSocket push for live dashboard updates', priority: 'high', est: 14, spent: 19, feature: 'FEAT-103', subtasks: [
    { title: 'Design time-series data schema', est: 3, spent: 4.5 },
    { title: 'Build aggregation pipeline for KPI metrics', est: 4, spent: 5.5 },
    { title: 'Implement WebSocket broadcast for live updates', est: 4, spent: 5 },
    { title: 'Create data retention and archival strategy', est: 3, spent: 4 },
  ]},
  { assignee: 'Aditya Patel', title: 'Analytics API Layer', desc: 'Create REST API endpoints for querying historical and real-time analytics data', priority: 'high', est: 12, spent: 11, feature: 'FEAT-101', subtasks: [
    { title: 'Design analytics query parameter schema', est: 2, spent: 2 },
    { title: 'Build date range and granularity filter endpoints', est: 4, spent: 3.5 },
    { title: 'Implement query caching with Redis', est: 3, spent: 3 },
    { title: 'Add rate limiting and pagination', est: 3, spent: 2.5 },
  ]},
  { assignee: 'Mikko Virtanen', title: 'Data Export Service', desc: 'Build CSV and PDF export functionality for analytics reports', priority: 'medium', est: 10, spent: 13, feature: 'FEAT-102', subtasks: [
    { title: 'Implement CSV export with column customization', est: 3, spent: 4 },
    { title: 'Build PDF report template engine', est: 4, spent: 5.5 },
    { title: 'Add scheduled report email delivery', est: 3, spent: 3.5 },
  ]},
  { assignee: 'Ravi Chandran', title: 'Dashboard Chart Components', desc: 'Build reusable charting components using Recharts for the analytics dashboard', priority: 'high', est: 12, spent: 11, feature: 'FEAT-104', subtasks: [
    { title: 'Create line chart component for trend data', est: 3, spent: 2.5 },
    { title: 'Build bar chart component for comparisons', est: 3, spent: 3 },
    { title: 'Implement pie chart for distribution views', est: 3, spent: 2.5 },
    { title: 'Add chart tooltip and legend customization', est: 3, spent: 3 },
  ]},
  { assignee: 'Annika Salminen', title: 'KPI Dashboard Layout', desc: 'Design and implement the main analytics dashboard grid layout with drag-and-drop widget arrangement', priority: 'high', est: 10, spent: 12, feature: 'FEAT-105', subtasks: [
    { title: 'Create responsive dashboard grid system', est: 3, spent: 4 },
    { title: 'Build KPI summary card components', est: 3, spent: 3.5 },
    { title: 'Implement date range picker with presets', est: 2, spent: 2.5 },
    { title: 'Add dashboard state persistence', est: 2, spent: 2 },
  ]},
  { assignee: 'Priya Nair', title: 'Mobile Analytics Views', desc: 'Create mobile-optimized versions of all analytics dashboard components', priority: 'medium', est: 8, spent: 9, feature: 'FEAT-106', subtasks: [
    { title: 'Responsive chart containers for small screens', est: 3, spent: 3.5 },
    { title: 'Swipeable KPI card carousel', est: 3, spent: 3.5 },
    { title: 'Mobile-optimized data table with horizontal scroll', est: 2, spent: 2 },
  ]},
  { assignee: 'Kaisa Laine', title: 'Analytics Integration Tests', desc: 'End-to-end testing of analytics data pipeline accuracy and dashboard rendering', priority: 'high', est: 10, spent: 9, feature: 'FEAT-107', subtasks: [
    { title: 'Validate KPI calculation accuracy against raw data', est: 3, spent: 2.5 },
    { title: 'Test WebSocket connection stability', est: 3, spent: 3 },
    { title: 'Cross-browser chart rendering verification', est: 2, spent: 2 },
    { title: 'Export format validation tests', est: 2, spent: 1.5 },
  ]},
  { assignee: 'Janne Ahonen', title: 'Analytics Performance Testing', desc: 'Load test the analytics engine with high-volume data streams', priority: 'medium', est: 8, spent: 10, feature: 'FEAT-108', subtasks: [
    { title: 'Simulate 10K concurrent WebSocket connections', est: 3, spent: 4 },
    { title: 'Benchmark aggregation query response times', est: 3, spent: 3.5 },
    { title: 'Memory leak detection under sustained load', est: 2, spent: 2.5 },
  ]},
  { assignee: 'Kaisa Niemi', title: 'Analytics Dashboard Design System', desc: 'Create design tokens and component library for the analytics UI', priority: 'medium', est: 6, spent: 7, feature: 'FEAT-109', subtasks: [
    { title: 'Define chart color palette and typography', est: 2, spent: 2.5 },
    { title: 'Create data visualization guidelines document', est: 2, spent: 2 },
    { title: 'Build Figma component library for charts', est: 2, spent: 2.5 },
  ]},
];

// ── S4324 (Completed — DELAYED) ──
const s4324Tasks = [
  { assignee: 'Ravi Chandran', title: 'Responsive Navigation System', desc: 'Rebuild the entire navigation to support mobile hamburger menu, tablet sidebar, and desktop full nav', priority: 'high', est: 12, spent: 16, feature: 'FEAT-104', subtasks: [
    { title: 'Create collapsible sidebar component', est: 3, spent: 4.5 },
    { title: 'Build mobile hamburger menu with slide-in drawer', est: 3, spent: 4 },
    { title: 'Implement breadcrumb navigation for deep pages', est: 3, spent: 3.5 },
    { title: 'Add keyboard navigation and focus management', est: 3, spent: 4 },
  ]},
  { assignee: 'Annika Salminen', title: 'Responsive Data Tables', desc: 'Rebuild all data tables to be fully responsive with card view on mobile', priority: 'high', est: 10, spent: 14, feature: 'FEAT-105', subtasks: [
    { title: 'Create responsive table wrapper with horizontal scroll', est: 3, spent: 4 },
    { title: 'Build card view alternative for mobile', est: 3, spent: 4.5 },
    { title: 'Implement column visibility toggle for tablets', est: 2, spent: 3 },
    { title: 'Add touch-friendly sort and filter controls', est: 2, spent: 2.5 },
  ]},
  { assignee: 'Priya Nair', title: 'Form Responsive Overhaul', desc: 'Make all platform forms responsive including multi-step wizards and file uploads', priority: 'high', est: 10, spent: 13, feature: 'FEAT-106', subtasks: [
    { title: 'Responsive form grid layout system', est: 3, spent: 4 },
    { title: 'Touch-optimized input components', est: 3, spent: 3.5 },
    { title: 'Mobile-friendly file upload with drag and drop', est: 2, spent: 3 },
    { title: 'Responsive multi-step form wizard', est: 2, spent: 2.5 },
  ]},
  { assignee: 'Aditya Patel', title: 'API Response Optimization', desc: 'Optimize API responses for mobile clients with field selection and compression', priority: 'medium', est: 8, spent: 7, feature: 'FEAT-101', subtasks: [
    { title: 'Implement sparse fieldset query parameters', est: 3, spent: 2.5 },
    { title: 'Add gzip compression middleware', est: 2, spent: 2 },
    { title: 'Create mobile-specific API response transformers', est: 3, spent: 2.5 },
  ]},
  { assignee: 'Mikko Virtanen', title: 'Image Optimization Pipeline', desc: 'Build automatic image resizing and WebP conversion for responsive image delivery', priority: 'medium', est: 8, spent: 9, feature: 'FEAT-102', subtasks: [
    { title: 'Set up Sharp image processing pipeline', est: 3, spent: 3.5 },
    { title: 'Implement responsive srcset generation', est: 3, spent: 3 },
    { title: 'Add lazy loading for below-fold images', est: 2, spent: 2.5 },
  ]},
  { assignee: 'Elena Korhonen', title: 'Mobile Performance Monitoring', desc: 'Add client-side performance tracking specific to mobile device metrics', priority: 'medium', est: 8, spent: 9, feature: 'FEAT-103', subtasks: [
    { title: 'Implement Core Web Vitals tracking', est: 3, spent: 3.5 },
    { title: 'Build device-specific performance dashboard', est: 3, spent: 3 },
    { title: 'Create automated Lighthouse CI checks', est: 2, spent: 2.5 },
  ]},
  { assignee: 'Kaisa Laine', title: 'Cross-Device Test Automation', desc: 'Set up automated cross-device testing using BrowserStack', priority: 'high', est: 10, spent: 11, feature: 'FEAT-107', subtasks: [
    { title: 'Configure BrowserStack test matrix', est: 2, spent: 2.5 },
    { title: 'Write viewport-specific visual regression tests', est: 3, spent: 3.5 },
    { title: 'Create touch interaction test helpers', est: 3, spent: 3 },
    { title: 'Build responsive screenshot comparison pipeline', est: 2, spent: 2 },
  ]},
  { assignee: 'Janne Ahonen', title: 'Mobile Network Simulation Tests', desc: 'Test platform behavior under various network conditions (3G, 4G, offline)', priority: 'medium', est: 6, spent: 7, feature: 'FEAT-108', subtasks: [
    { title: 'Set up network throttling test profiles', est: 2, spent: 2.5 },
    { title: 'Test critical flows under 3G conditions', est: 2, spent: 2.5 },
    { title: 'Verify offline fallback behavior', est: 2, spent: 2 },
  ]},
  { assignee: 'Kaisa Niemi', title: 'Responsive Design Tokens', desc: 'Create adaptive design tokens that adjust spacing, typography, and sizing across breakpoints', priority: 'medium', est: 6, spent: 5, feature: 'FEAT-109', subtasks: [
    { title: 'Define breakpoint-specific spacing scale', est: 2, spent: 1.5 },
    { title: 'Create fluid typography system', est: 2, spent: 2 },
    { title: 'Build responsive icon size mappings', est: 2, spent: 1.5 },
  ]},
];

// ── S4325 (ACTIVE — 40% Done, 30% In Progress, 10% Blocked, 20% To Do) ──
const s4325Tasks = [
  // DONE (4 tasks = 40%)
  { assignee: 'Aditya Patel', title: 'API Gateway Configuration', desc: 'Configure Kong API gateway with rate limiting, authentication, and routing rules', priority: 'high', est: 12, spent: 11, status: 'done', feature: 'FEAT-101', subtasks: [
    { title: 'Install and configure Kong gateway', est: 2, spent: 2, status: 'done' },
    { title: 'Define API routing rules and upstream services', est: 3, spent: 3, status: 'done' },
    { title: 'Configure rate limiting and throttling plugins', est: 4, spent: 3.5, status: 'done' },
    { title: 'Set up SSL termination and certificate management', est: 3, spent: 2.5, status: 'done' },
  ]},
  { assignee: 'Mikko Virtanen', title: 'Service Discovery Implementation', desc: 'Implement service registry with Consul for automatic service discovery and health monitoring', priority: 'high', est: 10, spent: 9, status: 'done', feature: 'FEAT-102', subtasks: [
    { title: 'Deploy Consul cluster configuration', est: 3, spent: 2.5, status: 'done' },
    { title: 'Implement service registration middleware', est: 3, spent: 3, status: 'done' },
    { title: 'Build health check endpoint standard', est: 2, spent: 2, status: 'done' },
    { title: 'Create service mesh routing rules', est: 2, spent: 1.5, status: 'done' },
  ]},
  { assignee: 'Kaisa Niemi', title: 'Microservices Architecture Diagrams', desc: 'Create comprehensive architecture documentation and service interaction diagrams', priority: 'medium', est: 6, spent: 5.5, status: 'done', feature: 'FEAT-109', subtasks: [
    { title: 'Draw service topology diagram in Mermaid', est: 2, spent: 2, status: 'done' },
    { title: 'Document API contract specifications', est: 2, spent: 2, status: 'done' },
    { title: 'Create data flow diagrams for critical paths', est: 2, spent: 1.5, status: 'done' },
  ]},
  { assignee: 'Ravi Chandran', title: 'Service Health Dashboard UI', desc: 'Build real-time service health monitoring dashboard with status indicators', priority: 'medium', est: 8, spent: 7, status: 'done', feature: 'FEAT-104', subtasks: [
    { title: 'Create service status card components', est: 2, spent: 2, status: 'done' },
    { title: 'Build real-time health indicator with WebSocket', est: 3, spent: 2.5, status: 'done' },
    { title: 'Implement incident timeline view', est: 3, spent: 2.5, status: 'done' },
  ]},
  // IN PROGRESS (3 tasks = 30%)
  { assignee: 'Elena Korhonen', title: 'Redis Caching Layer', desc: 'Implement distributed caching with Redis for API response optimization and session storage', priority: 'high', est: 14, spent: 18, status: 'inprogress', feature: 'FEAT-103', subtasks: [
    { title: 'Set up Redis cluster with sentinel failover', est: 3, spent: 4, status: 'done' },
    { title: 'Implement cache-aside pattern for API responses', est: 4, spent: 5.5, status: 'inprogress' },
    { title: 'Build cache invalidation event system', est: 4, spent: 5, status: 'inprogress' },
    { title: 'Create cache warming strategy for critical data', est: 3, spent: 3.5, status: 'todo' },
  ]},
  { assignee: 'Annika Salminen', title: 'Service Monitoring Dashboard', desc: 'Build comprehensive monitoring dashboard with Grafana-style metrics visualization', priority: 'high', est: 10, spent: 5, status: 'inprogress', feature: 'FEAT-105', subtasks: [
    { title: 'Create metrics collection middleware', est: 3, spent: 3, status: 'done' },
    { title: 'Build real-time metrics chart components', est: 4, spent: 2, status: 'inprogress' },
    { title: 'Implement alerting threshold configuration', est: 3, spent: 0, status: 'todo' },
  ]},
  { assignee: 'Priya Nair', title: 'gRPC Client Components', desc: 'Create frontend components for interacting with gRPC microservices through the API gateway', priority: 'medium', est: 8, spent: 3, status: 'inprogress', feature: 'FEAT-106', subtasks: [
    { title: 'Build gRPC-Web client wrapper', est: 3, spent: 2, status: 'inprogress' },
    { title: 'Create streaming data display components', est: 3, spent: 1, status: 'inprogress' },
    { title: 'Implement error boundary for service failures', est: 2, spent: 0, status: 'todo' },
  ]},
  // BLOCKED (1 task = 10%)
  { assignee: 'Janne Ahonen', title: 'Service Mesh Performance Baseline', desc: 'Establish performance baselines for inter-service communication latency and throughput', priority: 'high', est: 8, spent: 2, status: 'blocked', feature: 'FEAT-108', subtasks: [
    { title: 'Set up distributed tracing with Jaeger', est: 3, spent: 2, status: 'done' },
    { title: 'Run latency benchmarks across service pairs', est: 3, spent: 0, status: 'blocked' },
    { title: 'Document SLA targets for each service', est: 2, spent: 0, status: 'todo' },
  ]},
  // TO DO (2 tasks = 20%)
  { assignee: 'Kaisa Laine', title: 'Integration Test Suite for Services', desc: 'Build comprehensive integration test suite covering all service-to-service interactions', priority: 'high', est: 10, spent: 0, status: 'todo', feature: 'FEAT-107', subtasks: [
    { title: 'Set up test containers for service dependencies', est: 3, spent: 0, status: 'todo' },
    { title: 'Write API gateway routing integration tests', est: 3, spent: 0, status: 'todo' },
    { title: 'Create service discovery failover tests', est: 2, spent: 0, status: 'todo' },
    { title: 'Build cache consistency verification tests', est: 2, spent: 0, status: 'todo' },
  ]},
  { assignee: 'Mikko Virtanen', title: 'Circuit Breaker Pattern', desc: 'Implement circuit breaker pattern for resilient inter-service communication', priority: 'medium', est: 8, spent: 0, status: 'todo', feature: 'FEAT-102', subtasks: [
    { title: 'Build circuit breaker state machine', est: 3, spent: 0, status: 'todo' },
    { title: 'Implement fallback response strategies', est: 3, spent: 0, status: 'todo' },
    { title: 'Create circuit breaker monitoring dashboard', est: 2, spent: 0, status: 'todo' },
  ]},
];

// ── S4326 (PLANNER — future, no progress) ──
const s4326Tasks = [
  { assignee: 'Kaisa Laine', title: 'AI Test Case Generator', desc: 'Build AI-powered engine to generate test cases from user story acceptance criteria', priority: 'high', est: 16, spent: 0, status: 'todo', feature: 'FEAT-107', subtasks: [
    { title: 'Parse user story format into structured test inputs', est: 4, spent: 0, status: 'todo' },
    { title: 'Integrate with Gemini API for test generation', est: 4, spent: 0, status: 'todo' },
    { title: 'Build test case review and approval workflow', est: 4, spent: 0, status: 'todo' },
    { title: 'Create test coverage gap analysis report', est: 4, spent: 0, status: 'todo' },
  ]},
  { assignee: 'Janne Ahonen', title: 'Visual Regression Detection', desc: 'Implement pixel-by-pixel visual regression testing with AI-assisted diff analysis', priority: 'high', est: 14, spent: 0, status: 'todo', feature: 'FEAT-108', subtasks: [
    { title: 'Set up Playwright screenshot capture pipeline', est: 3, spent: 0, status: 'todo' },
    { title: 'Build image comparison engine with perceptual hashing', est: 4, spent: 0, status: 'todo' },
    { title: 'Create visual diff review interface', est: 4, spent: 0, status: 'todo' },
    { title: 'Implement baseline management system', est: 3, spent: 0, status: 'todo' },
  ]},
  { assignee: 'Aditya Patel', title: 'CI/CD Pipeline Integration', desc: 'Integrate AI testing framework into existing CI/CD pipeline for automated regression runs', priority: 'high', est: 10, spent: 0, status: 'todo', feature: 'FEAT-101', subtasks: [
    { title: 'Configure GitHub Actions workflow for AI tests', est: 3, spent: 0, status: 'todo' },
    { title: 'Build test result aggregation and reporting', est: 4, spent: 0, status: 'todo' },
    { title: 'Create merge gate rules based on test coverage', est: 3, spent: 0, status: 'todo' },
  ]},
  { assignee: 'Elena Korhonen', title: 'Test Analytics Dashboard', desc: 'Build analytics dashboard for tracking test execution trends and failure patterns', priority: 'medium', est: 10, spent: 0, status: 'todo', feature: 'FEAT-103', subtasks: [
    { title: 'Design test metrics data model', est: 3, spent: 0, status: 'todo' },
    { title: 'Build failure pattern detection algorithm', est: 4, spent: 0, status: 'todo' },
    { title: 'Create flaky test identification and tracking', est: 3, spent: 0, status: 'todo' },
  ]},
  { assignee: 'Kaisa Niemi', title: 'AI Testing UX Design', desc: 'Design the user interface for the AI testing framework configuration and results display', priority: 'medium', est: 8, spent: 0, status: 'todo', feature: 'FEAT-109', subtasks: [
    { title: 'Design test configuration wizard mockups', est: 3, spent: 0, status: 'todo' },
    { title: 'Create visual diff review screen prototypes', est: 3, spent: 0, status: 'todo' },
    { title: 'Build test result summary card designs', est: 2, spent: 0, status: 'todo' },
  ]},
];

// Insert all tasks and subtasks
function insertTasksForSprint(sprintId, tasksArr, allDone = false) {
  let count = 0;
  for (const t of tasksArr) {
    const taskId = makeTaskId();
    const status = allDone ? 'done' : (t.status || 'done');
    const featureId = t.feature || FEATURES[t.assignee] || '';
    
    insertTask.run(
      taskId, sprintId, empIds[t.assignee], t.title, t.desc,
      t.priority, status, t.est, t.spent, MANAGER_ID, featureId
    );

    for (const sub of t.subtasks) {
      const subId = makeSubtaskId();
      const subStatus = allDone ? 'done' : (sub.status || 'done');
      insertSubtask.run(
        subId, taskId, empIds[t.assignee], sub.title, '',
        t.priority, subStatus, sub.est, sub.spent
      );
    }
    count++;
  }
  return count;
}

let totalTasks = 0;
totalTasks += insertTasksForSprint('S4322', s4322Tasks, true);
console.log(`  ✓ S4322: ${s4322Tasks.length} tasks created (all done — healthy sprint)`);
totalTasks += insertTasksForSprint('S4323', s4323Tasks, true);
console.log(`  ✓ S4323: ${s4323Tasks.length} tasks created (all done — over budget)`);
totalTasks += insertTasksForSprint('S4324', s4324Tasks, true);
console.log(`  ✓ S4324: ${s4324Tasks.length} tasks created (all done — delayed)`);
totalTasks += insertTasksForSprint('S4325', s4325Tasks, false);
console.log(`  ✓ S4325: ${s4325Tasks.length} tasks created (mixed statuses — active sprint)`);
totalTasks += insertTasksForSprint('S4326', s4326Tasks, false);
console.log(`  ✓ S4326: ${s4326Tasks.length} tasks created (all todo — planner mode)`);

console.log(`  ✅ ${totalTasks} total tasks, ${subtaskCounter - 1} total subtasks created.\n`);


// ══════════════════════════════════════════════════════════════════════════
// PHASE 6: TIMER SESSIONS (for completed and in-progress subtasks)
// ══════════════════════════════════════════════════════════════════════════
console.log('⏱️  PHASE 6: Creating timer session logs...');

const insertTimer = db.prepare(`
  INSERT INTO timer_sessions (subtask_id, employee_id, start_time, end_time, duration)
  VALUES (?, ?, ?, ?, ?)
`);

// Get all subtasks that have spent hours > 0
const subtasksWithHours = db.prepare(`
  SELECT s.subtask_id, s.task_id, s.spent_hours, t.assigned_to, t.sprint_id
  FROM subtasks s
  JOIN tasks t ON s.task_id = t.task_id
  WHERE s.spent_hours > 0
`).all();

let timerCount = 0;
for (const sub of subtasksWithHours) {
  const sprint = sprintsData.find(s => s.id === sub.sprint_id);
  if (!sprint) continue;

  const workDays = getWorkingDays(sprint.start, sprint.end);
  if (workDays.length === 0) continue;

  // Split spent hours into 1-3 sessions
  let remaining = sub.spent_hours;
  let sessionIdx = 0;
  while (remaining > 0 && sessionIdx < 3) {
    const sessionHours = sessionIdx === 2 ? remaining : Math.min(remaining, randomBetween(1, 4));
    const dayIndex = Math.min(sessionIdx + randomBetween(0, Math.floor(workDays.length / 2)), workDays.length - 1);
    const day = workDays[dayIndex];
    const startHour = randomBetween(9, 14);
    const startMin = randomBetween(0, 59);
    const endMin = startMin + Math.round(sessionHours * 60);
    const endHour = startHour + Math.floor(endMin / 60);
    const endMinFinal = endMin % 60;

    const startTime = isoTimestamp(day, startHour, startMin);
    const endTime = isoTimestamp(day, Math.min(endHour, 18), endMinFinal);
    
    insertTimer.run(sub.subtask_id, sub.assigned_to, startTime, endTime, sessionHours);
    timerCount++;
    remaining -= sessionHours;
    sessionIdx++;
  }
}

console.log(`  ✓ ${timerCount} timer sessions created`);
console.log('  ✅ Timer sessions complete.\n');


// ══════════════════════════════════════════════════════════════════════════
// PHASE 7: ATTENDANCE DATA (current calendar month)
// ══════════════════════════════════════════════════════════════════════════
console.log('📅 PHASE 7: Generating attendance logs...');

const insertAttendance = db.prepare(`
  INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Get first day of current month through today
const monthStart = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}-01`;
const workingDaysThisMonth = getWorkingDays(monthStart, TODAY);

let attendanceCount = 0;
for (const emp of employees) {
  const eid = empIds[emp.name];
  for (const day of workingDaysThisMonth) {
    // 90% chance of being present
    if (Math.random() < 0.1) continue;
    
    const checkInH = randomBetween(8, 9);
    const checkInM = randomBetween(0, 45);
    const checkOutH = randomBetween(17, 18);
    const checkOutM = randomBetween(0, 45);
    
    const totalHours = ((checkOutH * 60 + checkOutM) - (checkInH * 60 + checkInM)) / 60;
    
    const checkIn = isoTimestamp(day, checkInH, checkInM);
    const checkOut = isoTimestamp(day, checkOutH, checkOutM);
    
    insertAttendance.run(eid, day, checkIn, checkOut, Math.round(totalHours * 10) / 10, 'Present');
    attendanceCount++;
  }
}

console.log(`  ✓ ${attendanceCount} attendance records created`);
console.log('  ✅ Attendance complete.\n');


// ══════════════════════════════════════════════════════════════════════════
// PHASE 8: LEAVE REQUESTS
// ══════════════════════════════════════════════════════════════════════════
console.log('🏖️  PHASE 8: Creating leave requests...');

const insertLeave = db.prepare(`
  INSERT INTO leaves (employee_id, manager_id, sprint_id, leave_type, start_date, end_date, duration_days, reason, status, manager_remark, decided_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// 3 Approved, 1 Rejected, 1 Pending
const leaveData = [
  {
    emp: 'Mikko Virtanen', type: 'planned', start: daysAgo(20), end: daysAgo(18), days: 3,
    reason: 'Pre-planned family vacation to Lapland. All critical tasks completed before departure and handover documentation provided to Aditya.',
    status: 'accepted', remark: 'Approved. Handover confirmed with Aditya. No sprint impact expected.', decided: daysAgo(22)
  },
  {
    emp: 'Kaisa Niemi', type: 'sick', start: daysAgo(10), end: daysAgo(9), days: 2,
    reason: 'Unwell with seasonal flu. Will be available via Slack for any urgent design review questions.',
    status: 'accepted', remark: 'Approved. Get well soon. Design reviews postponed to next week.', decided: daysAgo(10)
  },
  {
    emp: 'Ravi Chandran', type: 'casual', start: daysAgo(5), end: daysAgo(5), days: 1,
    reason: 'Personal errand — vehicle registration renewal at RTO office. Half-day may suffice but applying full day as buffer.',
    status: 'accepted', remark: 'Approved. Please ensure the service health dashboard PR is merged before EOD tomorrow.', decided: daysAgo(6)
  },
  {
    emp: 'Annika Salminen', type: 'planned', start: daysAgo(3), end: daysAgo(2), days: 2,
    reason: 'Attending a 2-day React Finland conference in Helsinki. Will share learnings with the frontend team afterward.',
    status: 'rejected', remark: 'Cannot approve due to critical milestone alignment on FEAT-105. The monitoring dashboard deliverable is at risk. Please reschedule after sprint completion.', decided: daysAgo(4)
  },
  {
    emp: 'Elena Korhonen', type: 'emergency', start: daysFromNow(2), end: daysFromNow(4), days: 3,
    reason: 'Family emergency — need to travel to Tampere for urgent personal matters. Will coordinate with Mikko for Redis caching task handover.',
    status: 'pending', remark: null, decided: null
  },
];

for (const l of leaveData) {
  const sprint = l.status === 'pending' ? 'S4325' : null;
  insertLeave.run(
    empIds[l.emp], MANAGER_ID, sprint, l.type, l.start, l.end, l.days,
    l.reason, l.status, l.remark, l.decided
  );
  console.log(`  ✓ ${l.emp}: ${l.type} leave (${l.status}) — ${l.start} to ${l.end}`);
}

console.log('  ✅ Leave requests created.\n');


// ══════════════════════════════════════════════════════════════════════════
// PHASE 9: QUERIES
// ══════════════════════════════════════════════════════════════════════════
console.log('❓ PHASE 9: Creating queries...');

const insertQuery = db.prepare(`
  INSERT INTO queries (query_id, task_id, raised_by, query_text, reply_text, replied_by, status, resolved_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

insertQuery.run('QRY-001', 'TSK-035', empIds['Elena Korhonen'],
  'The Redis cluster configuration requires a minimum of 3 nodes for sentinel failover. Should we provision 3 or 5 nodes for the staging environment? 5 nodes would add approximately 40 EUR/month but provides better fault tolerance.',
  'Go with 5 nodes for staging. We need production-parity testing and the cost is justified given the data pipeline criticality. Create a Terraform module so we can replicate the setup easily.',
  MANAGER_ID, 'resolved', daysAgo(2)
);

insertQuery.run('QRY-002', 'TSK-038', empIds['Janne Ahonen'],
  'The service mesh performance baseline tests are blocked — Jaeger distributed tracing is deployed but the service-to-service test environment is not provisioned yet. I need the DevOps team to set up the isolated test cluster before I can run latency benchmarks. Can you escalate this?',
  null, null, 'open', null
);

console.log('  ✓ 2 queries created (1 resolved, 1 open/blocking)');
console.log('  ✅ Queries complete.\n');


// ══════════════════════════════════════════════════════════════════════════
// PHASE 10: SPRINT NOTES & ATTACHMENTS (for planner sprint)
// ══════════════════════════════════════════════════════════════════════════
console.log('📝 PHASE 10: Creating sprint notes and attachments...');

const insertNote = db.prepare(`
  INSERT INTO sprint_notes (sprint_id, title, content, created_by)
  VALUES (?, ?, ?, ?)
`);

const insertAttachment = db.prepare(`
  INSERT INTO sprint_attachments (sprint_id, file_name, file_url, is_external, uploaded_by)
  VALUES (?, ?, ?, ?, ?)
`);

insertNote.run('S4326', 'AI Testing Framework — Architecture Decision Record',
  'After evaluating multiple approaches, we have decided to use Gemini 2.5 Flash for test case generation due to its speed and cost-effectiveness for structured output. The framework will operate in two modes:\n\n1. **Deterministic Mode**: Pattern-based test generation from user story templates\n2. **AI-Assisted Mode**: LLM-powered test generation for complex acceptance criteria\n\nKey constraint: All generated tests must pass human review before being added to the CI pipeline.',
  MANAGER_ID
);

insertNote.run('S4326', 'Sprint Planning Notes — Resource Allocation',
  'Team capacity for S4326:\n- Kaisa L. will lead the test generator core engine (FEAT-107)\n- Janne A. handles visual regression and performance testing (FEAT-108)\n- Aditya P. owns the CI/CD integration pipeline (FEAT-101)\n\nRisk: Elena K. may have reduced availability due to pending leave request. Backup plan: Mikko V. to support data analytics tasks if needed.',
  MANAGER_ID
);

insertNote.run('S4325', 'Active Sprint Standup Notes — Day 3',
  'Key updates from today\'s standup:\n\n- **Aditya**: API Gateway configuration completed and deployed to staging. Moving to review phase.\n- **Elena**: Redis caching layer taking longer than expected — cache invalidation logic is complex. May need an additional 2 days.\n- **Janne**: BLOCKED on service mesh performance testing — waiting for DevOps to provision test cluster (QRY-002 raised).\n- **Kaisa L.**: Integration test suite work begins tomorrow, dependent on gateway config stability.',
  MANAGER_ID
);

insertAttachment.run('S4326', 'AI_Testing_Framework_PRD.pdf', 'https://nokia-docs.internal/ai-testing-prd-v2.pdf', 1, MANAGER_ID);
insertAttachment.run('S4326', 'test_generation_architecture.png', 'https://nokia-docs.internal/ai-test-arch-diagram.png', 1, empIds['Kaisa Laine']);
insertAttachment.run('S4325', 'service_mesh_topology.pdf', 'https://nokia-docs.internal/service-mesh-topology-v1.pdf', 1, MANAGER_ID);

console.log('  ✓ 3 sprint notes created');
console.log('  ✓ 3 sprint attachments created');
console.log('  ✅ Notes & attachments complete.\n');


// ══════════════════════════════════════════════════════════════════════════
// PHASE 11: NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════
console.log('🔔 PHASE 11: Creating notifications...');

const insertNotification = db.prepare(`
  INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// Generate some realistic notifications
const notifData = [
  { to: 'Hari Krishnan', from: 'Elena Korhonen', type: 'leave', title: 'Emergency Leave Request', msg: 'Elena Korhonen has submitted an emergency leave request for 3 days (Jun 18-20). This overlaps with the active sprint S4325.', read: 0, ref: 'S4325' },
  { to: 'Hari Krishnan', from: 'Janne Ahonen', type: 'query', title: 'New Query on TSK-038', msg: 'Janne Ahonen raised a blocking query about service mesh test environment provisioning. Escalation required.', read: 0, ref: 'QRY-002' },
  { to: 'Elena Korhonen', from: 'Hari Krishnan', type: 'sprint', title: 'Sprint S4325 Started', msg: 'Sprint "Platform Core Services" has been activated. Your assigned tasks are ready for work.', read: 1, ref: 'S4325' },
  { to: 'Aditya Patel', from: 'Hari Krishnan', type: 'task', title: 'Task Completed', msg: 'Your task "API Gateway Configuration" has been marked as done. Great work on the SSL termination setup!', read: 1, ref: 'TSK-031' },
  { to: 'Mikko Virtanen', from: 'Hari Krishnan', type: 'task', title: 'Task Completed', msg: 'Your task "Service Discovery Implementation" has been marked as done. Consul deployment looks solid.', read: 1, ref: 'TSK-032' },
  { to: 'Annika Salminen', from: 'Hari Krishnan', type: 'leave', title: 'Leave Request Rejected', msg: 'Your planned leave request has been rejected. Reason: Critical milestone alignment on FEAT-105.', read: 0, ref: null },
  { to: 'Kaisa Laine', from: 'Hari Krishnan', type: 'sprint', title: 'Sprint S4326 Planning', msg: 'Sprint "AI Testing Framework" has entered Planner mode. Please review your assigned tasks and provide effort estimates.', read: 0, ref: 'S4326' },
  { to: 'Janne Ahonen', from: 'Hari Krishnan', type: 'task', title: 'Task Blocked', msg: 'Your task "Service Mesh Performance Baseline" is marked as blocked. The team is working on getting the test environment provisioned.', read: 1, ref: 'TSK-038' },
  { to: 'Priya Nair', from: 'Hari Krishnan', type: 'sprint', title: 'Sprint S4325 Started', msg: 'Sprint "Platform Core Services" has been activated. You have been assigned "gRPC Client Components".', read: 1, ref: 'S4325' },
  { to: 'Ravi Chandran', from: 'Hari Krishnan', type: 'leave', title: 'Leave Approved', msg: 'Your casual leave request for vehicle registration has been approved.', read: 1, ref: null },
];

for (const n of notifData) {
  insertNotification.run(empIds[n.to], empIds[n.from], n.type, n.title, n.msg, n.read, n.ref);
}

console.log(`  ✓ ${notifData.length} notifications created`);
console.log('  ✅ Notifications complete.\n');


// ══════════════════════════════════════════════════════════════════════════
// PHASE 12: USER SETTINGS
// ══════════════════════════════════════════════════════════════════════════
console.log('⚙️  PHASE 12: Creating user settings...');

const insertSettings = db.prepare(`
  INSERT INTO user_settings (user_id, notify_queries, notify_leaves, notify_sprints, notify_system, delivery_inapp, delivery_email)
  VALUES (?, 1, 1, 1, 1, 1, 0)
`);

for (const emp of employees) {
  insertSettings.run(empIds[emp.name]);
}
console.log('  ✓ Default settings created for all 10 users');
console.log('  ✅ User settings complete.\n');


// ══════════════════════════════════════════════════════════════════════════
// FINAL SUMMARY
// ══════════════════════════════════════════════════════════════════════════
console.log('═══════════════════════════════════════════════════════');
console.log('  ✅ SYNTHETIC DATA GENERATION COMPLETE');
console.log('═══════════════════════════════════════════════════════');

const finalCounts = {};
const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence' ORDER BY name").all();
for (const t of allTables) {
  finalCounts[t.name] = db.prepare(`SELECT COUNT(*) as cnt FROM ${t.name}`).get().cnt;
}

console.log('\n  📊 Final Row Counts:');
for (const [table, count] of Object.entries(finalCounts)) {
  console.log(`     ${table}: ${count}`);
}

console.log('\n  🔑 Login Credentials (all passwords: nokia@123):');
console.log('     Manager: hari.krishnan@nokia.com');
console.log('     Employee: aditya.patel@nokia.com (or any employee email)');
console.log('\n  🏃 Active Sprint: S4325 "Platform Core Services"');
console.log(`     Start: ${daysAgo(4)} | End: ${daysFromNow(10)}`);
console.log('\n  ⚠️  NOKI Test Points:');
console.log('     - Elena Korhonen is OVERLOADED (18h spent on 14h estimated)');
console.log('     - Janne Ahonen has a BLOCKED task (TSK-038)');
console.log('     - Elena has PENDING emergency leave overlapping active sprint');

db.pragma('foreign_keys = ON');
db.close();

console.log('\n  🎉 Done! Restart the backend server to pick up the new data.\n');
