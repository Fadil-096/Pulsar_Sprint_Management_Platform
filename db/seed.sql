-- Nokia Sprint Platform — Seed Data
-- Matches PDF spec: 1 Manager + 6 Employees, 1 Active Sprint S4321

-- =====================================================
-- 1. EMPLOYEES
-- =====================================================

-- Manager
INSERT INTO employees (id, name, email, team, sub_team, password, role, department, avatar_initials)
VALUES (1, 'Kaisa Laine', 'kaisa.laine@nokia.com', 'Core', 'Strategy', 'Nokia@123', 'manager', 'Engineering', 'KL');

-- Employees
INSERT INTO employees (id, name, email, team, sub_team, password, role, department, avatar_initials)
VALUES (2, 'Mikko Virtanen', 'mikko.virtanen@nokia.com', 'Core', 'Backend', 'Nokia@123', 'employee', 'Engineering', 'MV');

INSERT INTO employees (id, name, email, team, sub_team, password, role, department, avatar_initials)
VALUES (3, 'Aditya Patel', 'aditya.patel@nokia.com', 'Core', 'Backend', 'Nokia@123', 'employee', 'Engineering', 'AP');

INSERT INTO employees (id, name, email, team, sub_team, password, role, department, avatar_initials)
VALUES (4, 'Elena Petrova', 'elena.petrova@nokia.com', 'Core', 'Frontend', 'Nokia@123', 'employee', 'Engineering', 'EP');

INSERT INTO employees (id, name, email, team, sub_team, password, role, department, avatar_initials)
VALUES (5, 'Minna Laine', 'minna.laine@nokia.com', 'Core', 'Frontend', 'Nokia@123', 'employee', 'Engineering', 'ML');

INSERT INTO employees (id, name, email, team, sub_team, password, role, department, avatar_initials)
VALUES (6, 'Aravind Swamy', 'aravind.swamy@nokia.com', 'Core', 'Backend', 'Nokia@123', 'employee', 'Engineering', 'AS');

INSERT INTO employees (id, name, email, team, sub_team, password, role, department, avatar_initials)
VALUES (7, 'Charlotte Petit', 'charlotte.petit@nokia.com', 'Core', 'Frontend', 'Nokia@123', 'employee', 'Engineering', 'CP');

-- =====================================================
-- 2. SPRINTS
-- =====================================================

INSERT INTO sprints (id, sprint_id, sprint_name, sprint_goal, description, priority, status, start_date, end_date, created_by)
VALUES (1, 'S4321', 'Machinary Automation', 'Complete automation module for machinery control systems', 'Sprint focused on building the core automation pipeline for Nokia machinery control systems including UI, backend APIs, and testing.', 'high', 'active', '2026-06-08', '2026-06-13', 1);

INSERT INTO sprints (id, sprint_id, sprint_name, sprint_goal, description, priority, status, start_date, end_date, created_by)
VALUES (2, 'S4320', 'Dashboard UI Overhaul', 'Redesign the monitoring dashboard', 'Complete redesign of the network monitoring dashboard with real-time data visualization.', 'medium', 'completed', '2026-05-25', '2026-06-07', 1);

INSERT INTO sprints (id, sprint_id, sprint_name, sprint_goal, description, priority, status, start_date, end_date, created_by)
VALUES (3, 'S4319', 'Payment Flow Integration', 'Integrate payment processing module', 'Build and test the payment processing flow for enterprise licensing.', 'high', 'completed', '2026-05-11', '2026-05-24', 1);

INSERT INTO sprints (id, sprint_id, sprint_name, sprint_goal, description, priority, status, start_date, end_date, created_by)
VALUES (4, 'S4318', 'Profile Page Revamp', 'Modernize user profile pages', 'Update profile management UI with new design system.', 'low', 'completed', '2026-04-27', '2026-05-10', 1);

-- =====================================================
-- 3. SPRINT MEMBERS (S4321 — active sprint)
-- =====================================================

INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
VALUES ('S4321', 2, 'Backend Developer', 16, 12);

INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
VALUES ('S4321', 3, 'Backend Developer', 16, 10);

INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
VALUES ('S4321', 4, 'Frontend Developer', 16, 14);

INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
VALUES ('S4321', 5, 'Frontend Developer', 16, 8);

INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
VALUES ('S4321', 6, 'Backend Developer', 16, 11);

INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
VALUES ('S4321', 7, 'Frontend Developer', 16, 9);

-- Sprint members for S4320
INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
VALUES ('S4320', 2, 'Backend Developer', 20, 18);
INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
VALUES ('S4320', 4, 'Frontend Developer', 20, 22);
INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
VALUES ('S4320', 5, 'Frontend Developer', 16, 16);
INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
VALUES ('S4320', 7, 'Frontend Developer', 16, 15);

-- Sprint members for S4319
INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
VALUES ('S4319', 3, 'Backend Developer', 24, 22);
INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
VALUES ('S4319', 6, 'Backend Developer', 20, 19);
INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours, spent_hours)
VALUES ('S4319', 4, 'Frontend Developer', 16, 14);

-- =====================================================
-- 4. TASKS for S4321 (Active Sprint)
-- =====================================================

INSERT INTO tasks (id, task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by)
VALUES (1, 'TSK-001', 'S4321', 2, 'Login Page', 'Build the authentication login page with Nokia branding', 'high', 'inprogress', 8, 6, 1);

INSERT INTO tasks (id, task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by)
VALUES (2, 'TSK-002', 'S4321', 3, 'Dashboard UI', 'Create the main dashboard with charts and metrics', 'high', 'blocked', 8, 5, 1);

INSERT INTO tasks (id, task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by)
VALUES (3, 'TSK-003', 'S4321', 4, 'Payment Flow', 'Implement payment processing frontend', 'high', 'done', 8, 9, 1);

INSERT INTO tasks (id, task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by)
VALUES (4, 'TSK-004', 'S4321', 5, 'API Integration', 'Connect frontend to backend REST APIs', 'medium', 'todo', 8, 0, 1);

INSERT INTO tasks (id, task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by)
VALUES (5, 'TSK-005', 'S4321', 6, 'Database Schema', 'Design and implement database models', 'high', 'inprogress', 8, 7, 1);

INSERT INTO tasks (id, task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by)
VALUES (6, 'TSK-006', 'S4321', 7, 'Testing Suite', 'Write unit and integration tests', 'medium', 'todo', 8, 0, 1);

-- Tasks for S4320 (Completed Sprint)
INSERT INTO tasks (id, task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by)
VALUES (7, 'TSK-007', 'S4320', 2, 'Dashboard UI', 'Redesign monitoring dashboard components', 'high', 'done', 10, 9, 1);

INSERT INTO tasks (id, task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by)
VALUES (8, 'TSK-008', 'S4320', 4, 'Chart Components', 'Build reusable chart components', 'medium', 'done', 10, 12, 1);

INSERT INTO tasks (id, task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by)
VALUES (9, 'TSK-009', 'S4320', 5, 'Data Tables', 'Implement sortable data tables', 'medium', 'done', 8, 8, 1);

INSERT INTO tasks (id, task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by)
VALUES (10, 'TSK-010', 'S4320', 7, 'Theme System', 'Build CSS theme and design tokens', 'low', 'done', 8, 7, 1);

-- Tasks for S4319
INSERT INTO tasks (id, task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by)
VALUES (11, 'TSK-011', 'S4319', 3, 'Payment API', 'Build payment processing REST endpoints', 'critical', 'done', 12, 11, 1);

INSERT INTO tasks (id, task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by)
VALUES (12, 'TSK-012', 'S4319', 6, 'Payment Validation', 'Implement input validation for payments', 'high', 'done', 10, 10, 1);

INSERT INTO tasks (id, task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, spent_hours, created_by)
VALUES (13, 'TSK-013', 'S4319', 4, 'Payment UI', 'Build payment form frontend', 'high', 'done', 8, 7, 1);

-- =====================================================
-- 5. SUBTASKS for S4321 Tasks
-- =====================================================

-- Subtasks for TSK-001 (Login Page — Mikko)
INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-001', 'TSK-001', 2, 'Basic page setup', 'Set up the login page layout and structure', 'high', 'done', 2, 1.5);

INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-002', 'TSK-001', 2, 'Forgot password feature', 'Implement forgot password flow', 'medium', 'done', 1, 1);

INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-003', 'TSK-001', 2, 'Nokia logo + tagline', 'Add Nokia branding and tagline', 'low', 'done', 1, 0.5);

INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-004', 'TSK-001', 2, 'Role selection buttons', 'Build manager/employee toggle buttons', 'high', 'todo', 2, 0);

-- Subtasks for TSK-002 (Dashboard UI — Aditya)
INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-005', 'TSK-002', 3, 'Metric cards layout', 'Build the 4 metric cards component', 'high', 'done', 2, 2);

INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-006', 'TSK-002', 3, 'Chart integration', 'Integrate Chart.js for burndown and donut', 'high', 'blocked', 3, 2);

INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-007', 'TSK-002', 3, 'Data fetching layer', 'Connect dashboard to API endpoints', 'medium', 'todo', 2, 0);

-- Subtasks for TSK-003 (Payment Flow — Elena)
INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-008', 'TSK-003', 4, 'Payment form UI', 'Build the payment input form', 'high', 'done', 3, 3.5);

INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-009', 'TSK-003', 4, 'Payment validation', 'Add client-side validation', 'medium', 'done', 2, 2);

INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-010', 'TSK-003', 4, 'Success/error states', 'Handle payment result screens', 'medium', 'done', 2, 2.5);

INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-011', 'TSK-003', 4, 'Receipt generation', 'Generate payment receipt', 'low', 'done', 1, 1);

-- Subtasks for TSK-005 (Database Schema — Aravind)
INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-012', 'TSK-005', 6, 'Schema design', 'Design the complete database schema', 'high', 'done', 3, 3);

INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-013', 'TSK-005', 6, 'Migration scripts', 'Write SQL migration scripts', 'high', 'inprogress', 2, 2);

INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-014', 'TSK-005', 6, 'Seed data', 'Create sample seed data', 'medium', 'inprogress', 2, 1.5);

INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, status, estimated_hours, spent_hours)
VALUES ('SUB-015', 'TSK-005', 6, 'Index optimization', 'Add performance indexes', 'low', 'todo', 1, 0);

-- =====================================================
-- 6. QUERIES
-- =====================================================

INSERT INTO queries (query_id, task_id, raised_by, query_text, reply_text, replied_by, status, created_at, resolved_at)
VALUES ('QRY-001', 'TSK-002', 3, 'Which chart library should I use for the burndown chart? Chart.js or D3?', 'Use Chart.js — it is simpler and already included in our dependencies.', 1, 'resolved', '2026-06-09 10:00:00', '2026-06-09 11:30:00');

INSERT INTO queries (query_id, task_id, raised_by, query_text, status, created_at)
VALUES ('QRY-002', 'TSK-001', 2, 'Should the login page support SSO or only email/password?', 'open', '2026-06-10 14:00:00');

-- =====================================================
-- 7. LEAVES
-- =====================================================

INSERT INTO leaves (employee_id, manager_id, sprint_id, leave_type, start_date, end_date, duration_days, reason, status, applied_at)
VALUES (2, 1, 'S4321', 'sick', '2026-06-15', '2026-06-16', 2, 'Medical appointment', 'pending', '2026-06-11 09:00:00');

INSERT INTO leaves (employee_id, manager_id, leave_type, start_date, end_date, duration_days, reason, status, applied_at, decided_at)
VALUES (4, 1, 'casual', '2026-06-05', '2026-06-05', 1, 'Personal work', 'rejected', '2026-06-03 10:00:00', '2026-06-03 14:00:00');

INSERT INTO leaves (employee_id, manager_id, leave_type, start_date, end_date, duration_days, reason, status, applied_at, decided_at)
VALUES (5, 1, 'planned', '2026-05-20', '2026-05-22', 3, 'Family vacation', 'approved', '2026-05-15 08:00:00', '2026-05-15 12:00:00');

INSERT INTO leaves (employee_id, manager_id, leave_type, start_date, end_date, duration_days, reason, status, applied_at, decided_at)
VALUES (3, 1, 'sick', '2026-05-28', '2026-05-28', 1, 'Not feeling well', 'approved', '2026-05-28 07:30:00', '2026-05-28 08:00:00');

-- =====================================================
-- 8. NOTIFICATIONS
-- =====================================================

-- Manager notifications
INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (1, 2, 'leave', 'Leave Request', 'Mikko Virtanen applied for leave Jun 15-16', 0, NULL, '2026-06-11 09:00:00');

INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (1, 3, 'blocked', 'Task Blocked', 'Aditya Patel flagged Dashboard UI as Blocked', 0, 'TSK-002', '2026-06-11 08:30:00');

INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (1, NULL, 'sprint', 'Sprint Active', 'Sprint S4321 moved to Active Mode', 1, 'S4321', '2026-06-08 09:00:00');

INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (1, 4, 'task', 'Task Completed', 'Elena Petrova completed Payment Flow', 1, 'TSK-003', '2026-06-10 16:00:00');

INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (1, 2, 'query', 'Query Raised', 'Mikko Virtanen raised a query on Login Page', 1, 'QRY-002', '2026-06-10 14:00:00');

-- Employee notifications (Mikko)
INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (2, NULL, 'sprint', 'Sprint Started', 'Sprint S4321 "Machinary Automation" is now LIVE. Timer has started.', 1, 'S4321', '2026-06-08 09:00:00');

INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (2, 1, 'task', 'Task Assigned', 'You have been assigned to Login Page in Sprint S4321.', 1, 'TSK-001', '2026-06-08 09:05:00');

-- Employee notifications (Aditya)
INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (3, NULL, 'sprint', 'Sprint Started', 'Sprint S4321 "Machinary Automation" is now LIVE. Timer has started.', 1, 'S4321', '2026-06-08 09:00:00');

INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (3, 1, 'query', 'Query Replied', 'Kaisa Laine replied to your query on Dashboard UI: Use Chart.js.', 0, 'QRY-001', '2026-06-09 11:30:00');

-- Employee notifications (Elena)
INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (4, NULL, 'sprint', 'Sprint Started', 'Sprint S4321 "Machinary Automation" is now LIVE. Timer has started.', 1, 'S4321', '2026-06-08 09:00:00');

INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (4, 1, 'leave', 'Leave Rejected', 'Your leave request for Jun 5 has been rejected.', 1, NULL, '2026-06-03 14:00:00');

-- Notifications for all employees about sprint
INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (5, NULL, 'sprint', 'Sprint Started', 'Sprint S4321 "Machinary Automation" is now LIVE. Timer has started.', 1, 'S4321', '2026-06-08 09:00:00');

INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (6, NULL, 'sprint', 'Sprint Started', 'Sprint S4321 "Machinary Automation" is now LIVE. Timer has started.', 1, 'S4321', '2026-06-08 09:00:00');

INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read, reference_id, created_at)
VALUES (7, NULL, 'sprint', 'Sprint Started', 'Sprint S4321 "Machinary Automation" is now LIVE. Timer has started.', 1, 'S4321', '2026-06-08 09:00:00');

-- =====================================================
-- 9. ATTENDANCE
-- =====================================================

-- Manager Kaisa (1)
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (1, '2026-06-01', '09:00', '17:30', 8.5, 'Present');
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (1, '2026-06-02', '08:45', '17:00', 8.25, 'Present');
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (1, '2026-06-03', '09:15', '18:00', 8.75, 'Present');
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (1, '2026-06-04', '09:00', '13:00', 4.0, 'Half-Day');
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (1, '2026-06-05', '09:00', '17:30', 8.5, 'Present');
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (1, '2026-06-08', '08:50', '17:10', 8.33, 'Present');
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (1, '2026-06-09', '09:05', '17:30', 8.41, 'Present');

-- Employee Mikko (2)
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (2, '2026-06-01', '09:00', '17:00', 8.0, 'Present');
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (2, '2026-06-02', '09:30', '17:30', 8.0, 'Present');
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (2, '2026-06-03', '09:00', '17:00', 8.0, 'Present');
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (2, '2026-06-04', NULL, NULL, 0, 'Absent');
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (2, '2026-06-05', '09:00', '17:00', 8.0, 'Present');
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (2, '2026-06-08', '09:00', '17:00', 8.0, 'Present');
INSERT INTO attendance (user_id, date, check_in, check_out, total_hours, status)
VALUES (2, '2026-06-09', '09:10', '17:10', 8.0, 'Present');
