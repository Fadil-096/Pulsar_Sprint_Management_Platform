-- Nokia Sprint Management Platform — Complete Database Schema
-- SQLite compatible

CREATE TABLE IF NOT EXISTS employees (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  team         TEXT NOT NULL,
  sub_team     TEXT NOT NULL DEFAULT '',
  password     TEXT NOT NULL,
  role         TEXT NOT NULL CHECK(role IN ('manager', 'employee')),
  department   TEXT DEFAULT '',
  avatar_initials TEXT DEFAULT '',
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sprints (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  sprint_id    TEXT NOT NULL UNIQUE,
  sprint_name  TEXT NOT NULL,
  sprint_goal  TEXT DEFAULT '',
  description  TEXT DEFAULT '',
  priority     TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical','high','medium','low')),
  status       TEXT NOT NULL DEFAULT 'created' CHECK(status IN ('created','planner','active','completed')),
  start_date   TEXT NOT NULL,
  end_date     TEXT NOT NULL,
  created_by   INTEGER REFERENCES employees(id),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sprint_members (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sprint_id       TEXT NOT NULL REFERENCES sprints(sprint_id),
  user_id         INTEGER NOT NULL REFERENCES employees(id),
  role            TEXT DEFAULT '',
  estimated_hours REAL NOT NULL DEFAULT 0,
  spent_hours     REAL NOT NULL DEFAULT 0,
  joined_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id        TEXT NOT NULL UNIQUE,
  sprint_id      TEXT NOT NULL REFERENCES sprints(sprint_id),
  assigned_to    INTEGER NOT NULL REFERENCES employees(id),
  task_title     TEXT NOT NULL,
  description    TEXT DEFAULT '',
  priority       TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical','high','medium','low')),
  status         TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','inprogress','blocked','done')),
  estimated_hours REAL NOT NULL DEFAULT 0,
  spent_hours    REAL NOT NULL DEFAULT 0,
  created_by     INTEGER REFERENCES employees(id),
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subtasks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  subtask_id      TEXT NOT NULL UNIQUE,
  task_id         TEXT NOT NULL REFERENCES tasks(task_id),
  created_by      INTEGER REFERENCES employees(id),
  subtask_title   TEXT NOT NULL,
  description     TEXT DEFAULT '',
  priority        TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical','high','medium','low')),
  status          TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','inprogress','blocked','done')),
  estimated_hours REAL NOT NULL DEFAULT 0,
  spent_hours     REAL NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS queries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  query_id     TEXT NOT NULL UNIQUE,
  task_id      TEXT NOT NULL REFERENCES tasks(task_id),
  raised_by    INTEGER NOT NULL REFERENCES employees(id),
  query_text   TEXT NOT NULL,
  reply_text   TEXT DEFAULT NULL,
  replied_by   INTEGER DEFAULT NULL REFERENCES employees(id),
  status       TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at  TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS leaves (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id  INTEGER NOT NULL REFERENCES employees(id),
  manager_id   INTEGER NOT NULL REFERENCES employees(id),
  sprint_id    TEXT DEFAULT NULL REFERENCES sprints(sprint_id),
  leave_type   TEXT NOT NULL DEFAULT 'casual' CHECK(leave_type IN ('sick','casual','planned')),
  start_date   TEXT NOT NULL,
  end_date     TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 1,
  reason       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  applied_at   TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at   TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_id   INTEGER NOT NULL REFERENCES employees(id),
  sender_id      INTEGER DEFAULT NULL REFERENCES employees(id),
  type           TEXT NOT NULL CHECK(type IN ('sprint','task','leave','query','subtask','blocked')),
  title          TEXT NOT NULL,
  message        TEXT NOT NULL,
  is_read        INTEGER NOT NULL DEFAULT 0,
  reference_id   TEXT DEFAULT NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attendance (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES employees(id),
  date         TEXT NOT NULL,
  check_in     TEXT DEFAULT NULL,
  check_out    TEXT DEFAULT NULL,
  total_hours  REAL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'Present' CHECK(status IN ('Present','Absent','Half-Day','On Leave','Holiday','Late')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_queries_task ON queries(task_id);
CREATE INDEX IF NOT EXISTS idx_sprint_members_sprint ON sprint_members(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_members_user ON sprint_members(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_leaves_employee ON leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_manager ON leaves(manager_id);

CREATE TABLE IF NOT EXISTS sprint_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sprint_id TEXT NOT NULL REFERENCES sprints(sprint_id),
  title TEXT NOT NULL,
  content TEXT,
  created_by INTEGER REFERENCES employees(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sprint_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sprint_id TEXT NOT NULL REFERENCES sprints(sprint_id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  is_external INTEGER DEFAULT 0,
  uploaded_by INTEGER REFERENCES employees(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS timer_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subtask_id TEXT NOT NULL REFERENCES subtasks(subtask_id),
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  start_time TEXT NOT NULL DEFAULT (datetime('now')),
  end_time TEXT DEFAULT NULL,
  duration REAL DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_timer_sessions_employee ON timer_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_subtask ON timer_sessions(subtask_id);
