/**
 * server.js — Nokia Sprint Management Platform
 * Express.js Backend with SQLite + Complete REST API
 */

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Database Setup ──────────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, 'db', 'nokia_sprint.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Add feature_id column to tasks if it doesn't exist
try {
  db.prepare('ALTER TABLE tasks ADD COLUMN feature_id TEXT DEFAULT ""').run();
} catch (err) {
  // Ignore error if column already exists
}

// Ensure user_settings table exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES employees(id),
    notify_queries INTEGER DEFAULT 1,
    notify_leaves INTEGER DEFAULT 1,
    notify_sprints INTEGER DEFAULT 1,
    notify_system INTEGER DEFAULT 1,
    delivery_inapp INTEGER DEFAULT 1,
    delivery_email INTEGER DEFAULT 0
  )
`).run();

// ── Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Simple Token Auth ───────────────────────────────────────────────────
// Using a simple token map (in-memory) for demo purposes
const tokenStore = new Map();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  const user = tokenStore.get(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = user;
  req.token = token;
  next();
}

function managerOnly(req, res, next) {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
}

// ── Helper Functions ────────────────────────────────────────────────────

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function generateSprintId() {
  const last = db.prepare("SELECT sprint_id FROM sprints ORDER BY sprint_id DESC LIMIT 1").get();
  if (!last) return 'S4321';
  const num = parseInt(last.sprint_id.replace('S', '')) + 1;
  return 'S' + num;
}

function generateTaskId() {
  const last = db.prepare("SELECT task_id FROM tasks ORDER BY task_id DESC LIMIT 1").get();
  if (!last) return 'TSK-001';
  const num = parseInt(last.task_id.replace('TSK-', '')) + 1;
  return 'TSK-' + String(num).padStart(3, '0');
}

function generateSubtaskId() {
  const last = db.prepare("SELECT subtask_id FROM subtasks ORDER BY subtask_id DESC LIMIT 1").get();
  if (!last) return 'SUB-001';
  const num = parseInt(last.subtask_id.replace('SUB-', '')) + 1;
  return 'SUB-' + String(num).padStart(3, '0');
}

function generateQueryId() {
  const last = db.prepare("SELECT query_id FROM queries ORDER BY query_id DESC LIMIT 1").get();
  if (!last) return 'QRY-001';
  const num = parseInt(last.query_id.replace('QRY-', '')) + 1;
  return 'QRY-' + String(num).padStart(3, '0');
}

function createNotification({ recipientId, senderId, type, title, message, referenceId }) {
  db.prepare(`
    INSERT INTO notifications (recipient_id, sender_id, type, title, message, reference_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(recipientId, senderId || null, type, title, message, referenceId || null);
}

function notifySprintMembers(sprintId, senderId, type, title, message) {
  const members = db.prepare('SELECT user_id FROM sprint_members WHERE sprint_id = ?').all(sprintId);
  for (const m of members) {
    createNotification({ recipientId: m.user_id, senderId, type, title, message, referenceId: sprintId });
  }
}

// ══════════════════════════════════════════════════════════════════════════
// AUTH ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    const user = db.prepare('SELECT * FROM employees WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.role !== role) {
      return res.status(403).json({ error: `You are not authorized to access as ${role.charAt(0).toUpperCase() + role.slice(1)}.` });
    }

    const token = generateToken();
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
      subTeam: user.sub_team,
      department: user.department,
      initials: user.avatar_initials || getInitials(user.name)
    };
    tokenStore.set(token, userData);

    res.json({ success: true, token, user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  tokenStore.delete(req.token);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ══════════════════════════════════════════════════════════════════════════
// USER ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/users — All users
app.get('/api/users', authMiddleware, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, team, sub_team as subTeam, role, department, avatar_initials as initials
      FROM employees ORDER BY role DESC, name ASC
    `).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/employees — Only employees
app.get('/api/users/employees', authMiddleware, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, team, sub_team as subTeam, role, department, avatar_initials as initials
      FROM employees WHERE role = 'employee' ORDER BY name ASC
    `).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id — Single user
app.get('/api/users/:id', authMiddleware, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, team, sub_team as subTeam, role, department, avatar_initials as initials
      FROM employees WHERE id = ?
    `).get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// SPRINT ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/sprints
app.get('/api/sprints', authMiddleware, (req, res) => {
  try {
    const sprints = db.prepare(`
      SELECT s.*, e.name as creatorName,
        (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.sprint_id) as taskCount,
        (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.sprint_id AND status = 'done') as doneCount,
        (SELECT COUNT(*) FROM sprint_members WHERE sprint_id = s.sprint_id) as memberCount
      FROM sprints s
      LEFT JOIN employees e ON s.created_by = e.id
      ORDER BY s.start_date DESC
    `).all();

    const result = sprints.map(s => ({
      id: s.id,
      sprintId: s.sprint_id,
      sprintName: s.sprint_name,
      sprintGoal: s.sprint_goal,
      description: s.description,
      priority: s.priority,
      status: s.status,
      startDate: s.start_date,
      endDate: s.end_date,
      createdBy: s.created_by,
      creatorName: s.creatorName,
      taskCount: s.taskCount,
      doneCount: s.doneCount,
      memberCount: s.memberCount,
      velocity: s.taskCount > 0 ? Math.round((s.doneCount / s.taskCount) * 100) : 0
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sprints/:sprintId
app.get('/api/sprints/:sprintId', authMiddleware, (req, res) => {
  try {
    const sprint = db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(req.params.sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const members = db.prepare(`
      SELECT sm.*, e.name, e.email, e.team, e.sub_team as subTeam, e.avatar_initials as initials
      FROM sprint_members sm
      JOIN employees e ON sm.user_id = e.id
      WHERE sm.sprint_id = ?
    `).all(req.params.sprintId);

    const tasks = db.prepare(`
      SELECT t.*, e.name as assigneeName, e.avatar_initials as assigneeInitials
      FROM tasks t
      JOIN employees e ON t.assigned_to = e.id
      WHERE t.sprint_id = ?
      ORDER BY t.id ASC
    `).all(req.params.sprintId);

    res.json({
      ...sprint,
      sprintId: sprint.sprint_id,
      sprintName: sprint.sprint_name,
      sprintGoal: sprint.sprint_goal,
      startDate: sprint.start_date,
      endDate: sprint.end_date,
      createdBy: sprint.created_by,
      members: members.map(m => ({
        id: m.id,
        userId: m.user_id,
        name: m.name,
        email: m.email,
        team: m.team,
        subTeam: m.subTeam,
        initials: m.initials,
        role: m.role,
        estimatedHours: m.estimated_hours,
        spentHours: m.spent_hours
      })),
      tasks: tasks.map(t => ({
        id: t.id,
        taskId: t.task_id,
        title: t.task_title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        estimatedHours: t.estimated_hours,
        spentHours: t.spent_hours,
        assignedTo: t.assigned_to,
        assigneeName: t.assigneeName,
        assigneeInitials: t.assigneeInitials
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sprints/:sprintId/stats
app.get('/api/sprints/:sprintId/stats', authMiddleware, (req, res) => {
  try {
    const sprintId = req.params.sprintId;
    const sprint = db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const tasks = db.prepare('SELECT * FROM tasks WHERE sprint_id = ?').all(sprintId);
    const subtasks = db.prepare(`
      SELECT s.* FROM subtasks s
      JOIN tasks t ON s.task_id = t.task_id
      WHERE t.sprint_id = ?
    `).all(sprintId);

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;

    const totalEst = tasks.reduce((s, t) => s + t.estimated_hours, 0);
    const totalSpent = tasks.reduce((s, t) => s + t.spent_hours, 0);

    const velocity = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const variance = totalEst > 0 ? Math.round(((totalSpent - totalEst) / totalEst) * 100) : 0;

    // Burndown data
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const burndown = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dayLabel = 'D' + (i + 1);
      const idealRemaining = totalTasks - (totalTasks / (totalDays - 1)) * i;
      // Simulate actual burndown based on done tasks
      const progress = Math.min(i / (totalDays - 1), 1);
      const actualRemaining = Math.max(totalTasks - Math.floor(doneTasks * progress * 1.2), totalTasks - doneTasks);
      burndown.push({
        day: dayLabel,
        date: d.toISOString().slice(0, 10),
        ideal: Math.max(Math.round(idealRemaining * 10) / 10, 0),
        actual: Math.max(Math.round(actualRemaining * 10) / 10, 0)
      });
    }

    // Team workload data (hours per member per day)
    const members = db.prepare(`
      SELECT sm.user_id, e.name, sm.estimated_hours, sm.spent_hours
      FROM sprint_members sm
      JOIN employees e ON sm.user_id = e.id
      WHERE sm.sprint_id = ?
    `).all(sprintId);

    const teamWorkload = members.map(m => {
      // Distribute spent hours across weekdays
      const dailyAvg = totalDays > 0 ? m.spent_hours / Math.min(totalDays, 5) : 0;
      return {
        name: m.name,
        userId: m.user_id,
        estimatedHours: m.estimated_hours,
        spentHours: m.spent_hours,
        dailyHours: [
          Math.round((dailyAvg * (0.8 + Math.random() * 0.4)) * 10) / 10,
          Math.round((dailyAvg * (0.8 + Math.random() * 0.4)) * 10) / 10,
          Math.round((dailyAvg * (0.8 + Math.random() * 0.4)) * 10) / 10,
          Math.round((dailyAvg * (0.8 + Math.random() * 0.4)) * 10) / 10,
          Math.round((dailyAvg * (0.8 + Math.random() * 0.4)) * 10) / 10
        ]
      };
    });

    res.json({
      sprintId,
      velocity,
      totalTasks,
      doneTasks,
      inProgressTasks,
      blockedTasks,
      todoTasks,
      totalEstimatedHours: totalEst,
      totalSpentHours: totalSpent,
      effortVariance: variance,
      burndown,
      taskStatusBreakdown: { done: doneTasks, inprogress: inProgressTasks, blocked: blockedTasks, todo: todoTasks },
      teamWorkload,
      subtaskStats: {
        total: subtasks.length,
        done: subtasks.filter(s => s.status === 'done').length,
        inprogress: subtasks.filter(s => s.status === 'inprogress').length,
        blocked: subtasks.filter(s => s.status === 'blocked').length,
        todo: subtasks.filter(s => s.status === 'todo').length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sprints/:sprintId/report
app.get('/api/sprints/:sprintId/report', authMiddleware, (req, res) => {
  try {
    const sprintId = req.params.sprintId;
    const sprint = db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const members = db.prepare(`
      SELECT sm.*, e.name, e.email 
      FROM sprint_members sm 
      JOIN employees e ON sm.user_id = e.id 
      WHERE sm.sprint_id = ?
    `).all(sprintId);

    const tasks = db.prepare(`
      SELECT t.*, e.name as assigneeName 
      FROM tasks t 
      JOIN employees e ON t.assigned_to = e.id 
      WHERE t.sprint_id = ?
    `).all(sprintId);

    const subtasks = db.prepare(`
      SELECT s.* FROM subtasks s 
      JOIN tasks t ON s.task_id = t.task_id 
      WHERE t.sprint_id = ?
    `).all(sprintId);

    const queries = db.prepare(`
      SELECT q.*, r.name as raiserName 
      FROM queries q 
      JOIN tasks t ON q.task_id = t.task_id 
      JOIN employees r ON q.raised_by = r.id
      WHERE t.sprint_id = ? AND q.status = 'open'
    `).all(sprintId);

    res.json({
      sprint,
      members: members.map(m => {
        const memberTasks = tasks.filter(t => t.assigned_to === m.user_id);
        const taskIds = memberTasks.map(t => t.task_id);
        const memberSubtasks = subtasks.filter(s => taskIds.includes(s.task_id));
        
        return {
          id: m.id,
          name: m.name,
          role: m.role,
          tasks: memberTasks,
          estimatedHours: memberTasks.reduce((sum, t) => sum + t.estimated_hours, 0),
          spentHours: memberTasks.reduce((sum, t) => sum + t.spent_hours, 0),
          subtaskCount: memberSubtasks.length,
          subtaskDoneCount: memberSubtasks.filter(s => s.status === 'done').length
        };
      }),
      unresolvedQueries: queries
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sprints
app.post('/api/sprints', authMiddleware, managerOnly, (req, res) => {
  try {
    const { sprintName, sprintGoal, description, priority, startDate, endDate, members } = req.body;
    if (!sprintName || !startDate || !endDate) {
      return res.status(400).json({ error: 'Sprint name, start date, and end date are required.' });
    }

    const sprintId = generateSprintId();

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO sprints (sprint_id, sprint_name, sprint_goal, description, priority, status, start_date, end_date, created_by)
        VALUES (?, ?, ?, ?, ?, 'created', ?, ?, ?)
      `).run(sprintId, sprintName, sprintGoal || '', description || '', priority || 'medium', startDate, endDate, req.user.id);

      // Add members with their tasks
      if (members && Array.isArray(members)) {
        for (const m of members) {
          if (!m.userId) continue;

          db.prepare(`
            INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours)
            VALUES (?, ?, ?, ?)
          `).run(sprintId, m.userId, m.role || '', m.estimatedHours || 0);

          // Create task for this member if provided
          if (m.taskTitle) {
            const taskId = generateTaskId();
            db.prepare(`
              INSERT INTO tasks (task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, created_by, feature_id)
              VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?, ?)
            `).run(taskId, sprintId, m.userId, m.taskTitle, m.taskDescription || '', m.taskPriority || 'medium', m.estimatedHours || 0, req.user.id, m.featureId || '');
          }

          // Notify member
          createNotification({
            recipientId: m.userId,
            senderId: req.user.id,
            type: 'sprint',
            title: 'Added to Sprint',
            message: `You have been added to Sprint ${sprintId} "${sprintName}". Sprint starts ${startDate}.`,
            referenceId: sprintId
          });
        }
      }
    });

    transaction();
    res.status(201).json({ sprintId, message: 'Sprint created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sprints/:sprintId
app.put('/api/sprints/:sprintId', authMiddleware, managerOnly, (req, res) => {
  try {
    const sprint = db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(req.params.sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    if (sprint.status === 'completed') {
      return res.status(400).json({ error: 'Completed sprints cannot be edited.' });
    }

    const { sprintName, sprintGoal, description, priority, startDate, endDate, members } = req.body;
    const updates = [];
    const values = [];

    if (sprintName !== undefined) { updates.push('sprint_name = ?'); values.push(sprintName); }
    if (sprintGoal !== undefined) { updates.push('sprint_goal = ?'); values.push(sprintGoal); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }

    // Only allow date changes in created status
    if (sprint.status === 'created' || sprint.status === 'planner') {
      if (startDate !== undefined) { updates.push('start_date = ?'); values.push(startDate); }
      if (endDate !== undefined) { updates.push('end_date = ?'); values.push(endDate); }
    }

    const transaction = db.transaction(() => {
      if (updates.length > 0) {
        const updateValues = [...values, req.params.sprintId];
        db.prepare(`UPDATE sprints SET ${updates.join(', ')} WHERE sprint_id = ?`).run(...updateValues);
      }

      // Update members if provided (only in created or planner mode)
      if (members && Array.isArray(members) && (sprint.status === 'created' || sprint.status === 'planner')) {
        // Delete existing subtasks/queries for these tasks
        db.prepare(`DELETE FROM subtasks WHERE task_id IN (SELECT task_id FROM tasks WHERE sprint_id = ?)`).run(req.params.sprintId);
        db.prepare(`DELETE FROM queries WHERE task_id IN (SELECT task_id FROM tasks WHERE sprint_id = ?)`).run(req.params.sprintId);
        db.prepare('DELETE FROM tasks WHERE sprint_id = ?').run(req.params.sprintId);
        db.prepare('DELETE FROM sprint_members WHERE sprint_id = ?').run(req.params.sprintId);

        for (const m of members) {
          if (!m.userId) continue;

          db.prepare(`
            INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours)
            VALUES (?, ?, ?, ?)
          `).run(req.params.sprintId, m.userId, m.role || '', m.estimatedHours || 0);

          if (m.taskTitle) {
            const taskId = generateTaskId();
            db.prepare(`
              INSERT INTO tasks (task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, created_by, feature_id)
              VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?, ?)
            `).run(taskId, req.params.sprintId, m.userId, m.taskTitle, m.taskDescription || '', m.taskPriority || 'medium', m.estimatedHours || 0, req.user.id, m.featureId || '');
          }
        }
      }
    });

    transaction();

    res.json({ message: 'Sprint updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sprints/:sprintId
app.delete('/api/sprints/:sprintId', authMiddleware, managerOnly, (req, res) => {
  try {
    const sprint = db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(req.params.sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const transaction = db.transaction(() => {
      // Delete child records manually since ON DELETE CASCADE is not set
      db.prepare(`DELETE FROM subtasks WHERE task_id IN (SELECT task_id FROM tasks WHERE sprint_id = ?)`).run(req.params.sprintId);
      db.prepare(`DELETE FROM queries WHERE task_id IN (SELECT task_id FROM tasks WHERE sprint_id = ?)`).run(req.params.sprintId);
      db.prepare('DELETE FROM tasks WHERE sprint_id = ?').run(req.params.sprintId);
      db.prepare('DELETE FROM sprint_members WHERE sprint_id = ?').run(req.params.sprintId);
      db.prepare('DELETE FROM sprints WHERE sprint_id = ?').run(req.params.sprintId);
    });

    transaction();
    res.json({ message: 'Sprint deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sprints/:sprintId/status
app.patch('/api/sprints/:sprintId/status', authMiddleware, managerOnly, (req, res) => {
  try {
    const { status } = req.body;
    const sprint = db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(req.params.sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    // Validate status transitions
    const validTransitions = {
      'created': 'planner',
      'planner': 'active',
      'active': 'completed'
    };

    if (validTransitions[sprint.status] !== status) {
      return res.status(400).json({
        error: `Cannot transition from "${sprint.status}" to "${status}". Valid next status: "${validTransitions[sprint.status]}".`
      });
    }

    db.prepare('UPDATE sprints SET status = ? WHERE sprint_id = ?').run(status, req.params.sprintId);

    // Send notifications based on transition
    const messages = {
      'planner': `Sprint ${sprint.sprint_id} "${sprint.sprint_name}" is now in Planner Mode. Please create your subtasks.`,
      'active': `Sprint ${sprint.sprint_id} "${sprint.sprint_name}" is now LIVE. Timer has started.`,
      'completed': `Sprint ${sprint.sprint_id} "${sprint.sprint_name}" has been completed.`
    };

    notifySprintMembers(req.params.sprintId, req.user.id, 'sprint', `Sprint ${status.charAt(0).toUpperCase() + status.slice(1)}`, messages[status]);

    res.json({ message: `Sprint status changed to "${status}" successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sprints/:sprintId
app.delete('/api/sprints/:sprintId', authMiddleware, managerOnly, (req, res) => {
  try {
    const sprint = db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(req.params.sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    if (['active', 'completed'].includes(sprint.status)) {
      return res.status(400).json({ error: 'Cannot delete an active or completed sprint.' });
    }

    const transaction = db.transaction(() => {
      // Delete subtasks for tasks in this sprint
      db.prepare(`DELETE FROM subtasks WHERE task_id IN (SELECT task_id FROM tasks WHERE sprint_id = ?)`).run(req.params.sprintId);
      // Delete queries for tasks in this sprint
      db.prepare(`DELETE FROM queries WHERE task_id IN (SELECT task_id FROM tasks WHERE sprint_id = ?)`).run(req.params.sprintId);
      db.prepare('DELETE FROM tasks WHERE sprint_id = ?').run(req.params.sprintId);
      db.prepare('DELETE FROM sprint_members WHERE sprint_id = ?').run(req.params.sprintId);
      db.prepare('DELETE FROM notifications WHERE reference_id = ?').run(req.params.sprintId);
      db.prepare('DELETE FROM sprints WHERE sprint_id = ?').run(req.params.sprintId);
    });

    transaction();
    res.json({ message: 'Sprint deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// TASK ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/tasks
app.get('/api/tasks', authMiddleware, (req, res) => {
  try {
    const { sprintId, assignedTo } = req.query;
    let query = `
      SELECT t.*, e.name as assigneeName, e.avatar_initials as assigneeInitials, e.team, e.sub_team as subTeam,
        (SELECT COUNT(*) FROM subtasks WHERE task_id = t.task_id) as subtaskCount,
        (SELECT COUNT(*) FROM subtasks WHERE task_id = t.task_id AND status = 'done') as subtaskDoneCount
      FROM tasks t
      JOIN employees e ON t.assigned_to = e.id
    `;
    const params = [];
    const conditions = [];

    if (sprintId) { conditions.push('t.sprint_id = ?'); params.push(sprintId); }
    if (assignedTo) { conditions.push('t.assigned_to = ?'); params.push(assignedTo); }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY t.id ASC';

    const tasks = db.prepare(query).all(...params);

    res.json(tasks.map(t => ({
      id: t.id,
      taskId: t.task_id,
      sprintId: t.sprint_id,
      assignedTo: t.assigned_to,
      assigneeName: t.assigneeName,
      assigneeInitials: t.assigneeInitials,
      team: t.team,
      subTeam: t.subTeam,
      title: t.task_title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      estimatedHours: t.estimated_hours,
      spentHours: t.spent_hours,
      createdBy: t.created_by,
      subtaskCount: t.subtaskCount,
      subtaskDoneCount: t.subtaskDoneCount,
      completionPct: t.subtaskCount > 0 ? Math.round((t.subtaskDoneCount / t.subtaskCount) * 100) : 0
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/employee/:userId
app.get('/api/tasks/employee/:userId', authMiddleware, (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*, s.sprint_name as sprintName, s.status as sprintStatus, s.start_date as sprintStart, s.end_date as sprintEnd,
        (SELECT COUNT(*) FROM subtasks WHERE task_id = t.task_id) as subtaskCount,
        (SELECT COUNT(*) FROM subtasks WHERE task_id = t.task_id AND status = 'done') as subtaskDoneCount
      FROM tasks t
      JOIN sprints s ON t.sprint_id = s.sprint_id
      WHERE t.assigned_to = ?
      ORDER BY s.start_date DESC, t.id ASC
    `).all(req.params.userId);

    res.json(tasks.map(t => ({
      id: t.id,
      taskId: t.task_id,
      sprintId: t.sprint_id,
      sprintName: t.sprintName,
      sprintStatus: t.sprintStatus,
      sprintStart: t.sprintStart,
      sprintEnd: t.sprintEnd,
      title: t.task_title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      estimatedHours: t.estimated_hours,
      spentHours: t.spent_hours,
      subtaskCount: t.subtaskCount,
      subtaskDoneCount: t.subtaskDoneCount,
      completionPct: t.subtaskCount > 0 ? Math.round((t.subtaskDoneCount / t.subtaskCount) * 100) : 0
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:taskId
app.get('/api/tasks/:taskId', authMiddleware, (req, res) => {
  try {
    const task = db.prepare(`
      SELECT t.*, e.name as assigneeName, e.avatar_initials as assigneeInitials
      FROM tasks t
      JOIN employees e ON t.assigned_to = e.id
      WHERE t.task_id = ?
    `).get(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY id ASC').all(req.params.taskId);
    const queries = db.prepare(`
      SELECT q.*, r.name as raiserName, rep.name as replierName
      FROM queries q
      JOIN employees r ON q.raised_by = r.id
      LEFT JOIN employees rep ON q.replied_by = rep.id
      WHERE q.task_id = ?
      ORDER BY q.created_at DESC
    `).all(req.params.taskId);

    res.json({
      id: task.id,
      taskId: task.task_id,
      sprintId: task.sprint_id,
      assignedTo: task.assigned_to,
      assigneeName: task.assigneeName,
      assigneeInitials: task.assigneeInitials,
      title: task.task_title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      estimatedHours: task.estimated_hours,
      spentHours: task.spent_hours,
      subtasks: subtasks.map(s => ({
        id: s.id,
        subtaskId: s.subtask_id,
        title: s.subtask_title,
        description: s.description,
        priority: s.priority,
        status: s.status,
        estimatedHours: s.estimated_hours,
        spentHours: s.spent_hours
      })),
      queries: queries.map(q => ({
        id: q.id,
        queryId: q.query_id,
        raisedBy: q.raised_by,
        raiserName: q.raiserName,
        queryText: q.query_text,
        replyText: q.reply_text,
        repliedBy: q.replied_by,
        replierName: q.replierName,
        status: q.status,
        createdAt: q.created_at,
        resolvedAt: q.resolved_at
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
app.post('/api/tasks', authMiddleware, managerOnly, (req, res) => {
  try {
    const { sprintId, assignedTo, title, description, priority, estimatedHours } = req.body;
    if (!sprintId || !assignedTo || !title) {
      return res.status(400).json({ error: 'Sprint ID, assigned employee, and title are required.' });
    }

    const taskId = generateTaskId();
    db.prepare(`
      INSERT INTO tasks (task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?)
    `).run(taskId, sprintId, assignedTo, title, description || '', priority || 'medium', estimatedHours || 0, req.user.id);

    // Notify assignee
    createNotification({
      recipientId: assignedTo,
      senderId: req.user.id,
      type: 'task',
      title: 'Task Assigned',
      message: `You have been assigned to "${title}" (${taskId}) in Sprint ${sprintId}.`,
      referenceId: taskId
    });

    res.status(201).json({ taskId, message: 'Task created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:taskId
app.put('/api/tasks/:taskId', authMiddleware, (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE task_id = ?').get(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { title, description, priority, estimatedHours, spentHours } = req.body;
    const updates = [];
    const values = [];

    if (title !== undefined) { updates.push('task_title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    if (estimatedHours !== undefined) { updates.push('estimated_hours = ?'); values.push(estimatedHours); }
    if (spentHours !== undefined) { updates.push('spent_hours = ?'); values.push(spentHours); }

    if (updates.length === 0) return res.status(400).json({ error: 'No valid updates.' });

    values.push(req.params.taskId);
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE task_id = ?`).run(...values);

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:taskId/status
app.patch('/api/tasks/:taskId/status', authMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'inprogress', 'blocked', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const task = db.prepare(`
      SELECT t.*, s.created_by as managerId
      FROM tasks t
      JOIN sprints s ON t.sprint_id = s.sprint_id
      WHERE t.task_id = ?
    `).get(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    db.prepare('UPDATE tasks SET status = ? WHERE task_id = ?').run(status, req.params.taskId);

    // Notify manager on blocked
    if (status === 'blocked' && task.managerId) {
      const assignee = db.prepare('SELECT name FROM employees WHERE id = ?').get(task.assigned_to);
      createNotification({
        recipientId: task.managerId,
        senderId: task.assigned_to,
        type: 'blocked',
        title: 'Task Blocked',
        message: `${assignee.name} flagged "${task.task_title}" as Blocked.`,
        referenceId: req.params.taskId
      });
    }

    // Notify manager on done
    if (status === 'done' && task.managerId) {
      const assignee = db.prepare('SELECT name FROM employees WHERE id = ?').get(task.assigned_to);
      createNotification({
        recipientId: task.managerId,
        senderId: task.assigned_to,
        type: 'task',
        title: 'Task Completed',
        message: `${assignee.name} completed "${task.task_title}".`,
        referenceId: req.params.taskId
      });
    }

    res.json({ message: `Task status updated to "${status}"` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// SUBTASK ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/subtasks/task/:taskId
app.get('/api/subtasks/task/:taskId', authMiddleware, (req, res) => {
  try {
    const subtasks = db.prepare(`
      SELECT s.*, e.name as creatorName
      FROM subtasks s
      LEFT JOIN employees e ON s.created_by = e.id
      WHERE s.task_id = ?
      ORDER BY s.id ASC
    `).all(req.params.taskId);

    res.json(subtasks.map(s => ({
      id: s.id,
      subtaskId: s.subtask_id,
      taskId: s.task_id,
      title: s.subtask_title,
      description: s.description,
      priority: s.priority,
      status: s.status,
      estimatedHours: s.estimated_hours,
      spentHours: s.spent_hours,
      createdBy: s.created_by,
      creatorName: s.creatorName
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subtasks
app.post('/api/subtasks', authMiddleware, (req, res) => {
  try {
    const { taskId, title, description, priority, estimatedHours } = req.body;
    if (!taskId || !title) {
      return res.status(400).json({ error: 'Task ID and title are required.' });
    }

    // Check sprint is in planner mode
    const task = db.prepare(`
      SELECT t.*, s.status as sprintStatus, s.created_by as managerId
      FROM tasks t
      JOIN sprints s ON t.sprint_id = s.sprint_id
      WHERE t.task_id = ?
    `).get(taskId);

    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.sprintStatus === 'active') {
      return res.status(400).json({ error: 'Subtask creation is locked. Sprint is now Active.' });
    }

    const subtaskId = generateSubtaskId();
    db.prepare(`
      INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority, estimated_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(subtaskId, taskId, req.user.id, title, description || '', priority || 'medium', estimatedHours || 0);

    // Notify manager
    if (task.managerId) {
      createNotification({
        recipientId: task.managerId,
        senderId: req.user.id,
        type: 'subtask',
        title: 'Subtask Created',
        message: `${req.user.name} created subtask "${title}" for "${task.task_title}".`,
        referenceId: taskId
      });
    }

    res.status(201).json({ subtaskId, message: 'Subtask created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/subtasks/:subtaskId/status
app.patch('/api/subtasks/:subtaskId/status', authMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'inprogress', 'blocked', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const subtask = db.prepare(`
      SELECT st.*, t.assigned_to, t.task_title, s.created_by as managerId
      FROM subtasks st
      JOIN tasks t ON st.task_id = t.task_id
      JOIN sprints s ON t.sprint_id = s.sprint_id
      WHERE st.subtask_id = ?
    `).get(req.params.subtaskId);

    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    db.prepare('UPDATE subtasks SET status = ? WHERE subtask_id = ?').run(status, req.params.subtaskId);

    // Notify manager on blocked
    if (status === 'blocked' && subtask.managerId) {
      const user = db.prepare('SELECT name FROM employees WHERE id = ?').get(subtask.assigned_to);
      createNotification({
        recipientId: subtask.managerId,
        senderId: subtask.assigned_to,
        type: 'blocked',
        title: 'Subtask Blocked',
        message: `${user.name} flagged subtask "${subtask.subtask_title}" as Blocked in "${subtask.task_title}".`,
        referenceId: subtask.task_id
      });
    }

    // Notify manager on completion
    if (status === 'done' && subtask.managerId) {
      createNotification({
        recipientId: subtask.managerId,
        senderId: subtask.assigned_to,
        type: 'task',
        title: 'Subtask Completed',
        message: `Subtask "${subtask.subtask_title}" completed for "${subtask.task_title}".`,
        referenceId: subtask.task_id
      });
    }

    res.json({ message: `Subtask status updated to "${status}"` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/subtasks/:subtaskId
app.put('/api/subtasks/:subtaskId', authMiddleware, (req, res) => {
  try {
    const subtask = db.prepare('SELECT * FROM subtasks WHERE subtask_id = ?').get(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    const { title, description, priority, estimatedHours, spentHours } = req.body;
    const updates = [];
    const values = [];

    if (title !== undefined) { updates.push('subtask_title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    if (estimatedHours !== undefined) { updates.push('estimated_hours = ?'); values.push(estimatedHours); }
    if (spentHours !== undefined) { updates.push('spent_hours = ?'); values.push(spentHours); }

    if (updates.length === 0) return res.status(400).json({ error: 'No valid updates.' });

    values.push(req.params.subtaskId);
    db.prepare(`UPDATE subtasks SET ${updates.join(', ')} WHERE subtask_id = ?`).run(...values);

    res.json({ message: 'Subtask updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/subtasks/:subtaskId
app.delete('/api/subtasks/:subtaskId', authMiddleware, (req, res) => {
  try {
    const subtask = db.prepare('SELECT * FROM subtasks WHERE subtask_id = ?').get(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    db.prepare('DELETE FROM subtasks WHERE subtask_id = ?').run(req.params.subtaskId);
    res.json({ message: 'Subtask deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// QUERY ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/queries/task/:taskId
app.get('/api/queries/task/:taskId', authMiddleware, (req, res) => {
  try {
    const queries = db.prepare(`
      SELECT q.*, r.name as raiserName, rep.name as replierName
      FROM queries q
      JOIN employees r ON q.raised_by = r.id
      LEFT JOIN employees rep ON q.replied_by = rep.id
      WHERE q.task_id = ?
      ORDER BY q.created_at DESC
    `).all(req.params.taskId);

    res.json(queries.map(q => ({
      id: q.id,
      queryId: q.query_id,
      taskId: q.task_id,
      raisedBy: q.raised_by,
      raiserName: q.raiserName,
      queryText: q.query_text,
      replyText: q.reply_text,
      repliedBy: q.replied_by,
      replierName: q.replierName,
      status: q.status,
      createdAt: q.created_at,
      resolvedAt: q.resolved_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/queries
app.post('/api/queries', authMiddleware, (req, res) => {
  try {
    const { taskId, queryText } = req.body;
    if (!taskId || !queryText) {
      return res.status(400).json({ error: 'Task ID and query text are required.' });
    }

    const task = db.prepare(`
      SELECT t.*, s.created_by as managerId
      FROM tasks t
      JOIN sprints s ON t.sprint_id = s.sprint_id
      WHERE t.task_id = ?
    `).get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const queryId = generateQueryId();
    db.prepare(`
      INSERT INTO queries (query_id, task_id, raised_by, query_text)
      VALUES (?, ?, ?, ?)
    `).run(queryId, taskId, req.user.id, queryText);

    // Notify manager
    if (task.managerId) {
      createNotification({
        recipientId: task.managerId,
        senderId: req.user.id,
        type: 'query',
        title: 'Query Raised',
        message: `${req.user.name} raised a query on "${task.task_title}": "${queryText.substring(0, 80)}..."`,
        referenceId: queryId
      });
    }

    res.status(201).json({ queryId, message: 'Query raised successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/queries/:queryId/reply
app.put('/api/queries/:queryId/reply', authMiddleware, managerOnly, (req, res) => {
  try {
    const { replyText } = req.body;
    if (!replyText) return res.status(400).json({ error: 'Reply text is required.' });

    const query = db.prepare('SELECT * FROM queries WHERE query_id = ?').get(req.params.queryId);
    if (!query) return res.status(404).json({ error: 'Query not found' });

    db.prepare(`
      UPDATE queries SET reply_text = ?, replied_by = ?, status = 'resolved', resolved_at = datetime('now')
      WHERE query_id = ?
    `).run(replyText, req.user.id, req.params.queryId);

    // Notify the query raiser
    createNotification({
      recipientId: query.raised_by,
      senderId: req.user.id,
      type: 'query',
      title: 'Query Replied',
      message: `${req.user.name} replied to your query: "${replyText.substring(0, 80)}..."`,
      referenceId: req.params.queryId
    });

    res.json({ message: 'Query replied successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// LEAVE ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/leaves
app.get('/api/leaves', authMiddleware, (req, res) => {
  try {
    const { status, employeeId } = req.query;
    let query = `
      SELECT l.*, e.name as employeeName, e.avatar_initials as employeeInitials, e.team, e.sub_team as subTeam,
             m.name as managerName
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN employees m ON l.manager_id = m.id
    `;
    const conditions = [];
    const params = [];

    if (status && status !== 'all') { conditions.push('l.status = ?'); params.push(status); }
    if (employeeId) { conditions.push('l.employee_id = ?'); params.push(employeeId); }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY l.applied_at DESC';

    const leaves = db.prepare(query).all(...params);

    res.json(leaves.map(l => ({
      id: l.id,
      employeeId: l.employee_id,
      employeeName: l.employeeName,
      employeeInitials: l.employeeInitials,
      team: l.team,
      subTeam: l.subTeam,
      managerId: l.manager_id,
      managerName: l.managerName,
      sprintId: l.sprint_id,
      leaveType: l.leave_type,
      startDate: l.start_date,
      endDate: l.end_date,
      durationDays: l.duration_days,
      reason: l.reason,
      status: l.status,
      appliedAt: l.applied_at,
      decidedAt: l.decided_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leaves/employee/:id
app.get('/api/leaves/employee/:id', authMiddleware, (req, res) => {
  try {
    const leaves = db.prepare(`
      SELECT l.*, m.name as managerName
      FROM leaves l
      JOIN employees m ON l.manager_id = m.id
      WHERE l.employee_id = ?
      ORDER BY l.applied_at DESC
    `).all(req.params.id);

    res.json(leaves.map(l => ({
      id: l.id,
      leaveType: l.leave_type,
      startDate: l.start_date,
      endDate: l.end_date,
      durationDays: l.duration_days,
      reason: l.reason,
      status: l.status,
      managerName: l.managerName,
      appliedAt: l.applied_at,
      decidedAt: l.decided_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leaves
app.post('/api/leaves', authMiddleware, (req, res) => {
  try {
    const { managerId, leaveType, startDate, endDate, reason } = req.body;
    if (!managerId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check if leave falls during an active sprint
    const activeSprint = db.prepare(`
      SELECT sprint_id FROM sprints
      WHERE status = 'active' AND start_date <= ? AND end_date >= ?
    `).get(endDate, startDate);

    db.prepare(`
      INSERT INTO leaves (employee_id, manager_id, sprint_id, leave_type, start_date, end_date, duration_days, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, managerId, activeSprint ? activeSprint.sprint_id : null, leaveType, startDate, endDate, durationDays, reason);

    // Notify manager
    createNotification({
      recipientId: managerId,
      senderId: req.user.id,
      type: 'leave',
      title: 'Leave Request',
      message: `${req.user.name} applied for ${leaveType} leave from ${startDate} to ${endDate} (${durationDays} days).`,
      referenceId: null
    });

    res.status(201).json({ message: 'Leave request submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/leaves/:id/approve
app.patch('/api/leaves/:id/approve', authMiddleware, managerOnly, (req, res) => {
  try {
    const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    db.prepare("UPDATE leaves SET status = 'approved', decided_at = datetime('now') WHERE id = ?").run(req.params.id);

    createNotification({
      recipientId: leave.employee_id,
      senderId: req.user.id,
      type: 'leave',
      title: 'Leave Approved',
      message: `Your ${leave.leave_type} leave request for ${leave.start_date} to ${leave.end_date} has been approved.`,
      referenceId: null
    });

    res.json({ message: 'Leave approved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/leaves/:id/reject
app.patch('/api/leaves/:id/reject', authMiddleware, managerOnly, (req, res) => {
  try {
    const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    db.prepare("UPDATE leaves SET status = 'rejected', decided_at = datetime('now') WHERE id = ?").run(req.params.id);

    createNotification({
      recipientId: leave.employee_id,
      senderId: req.user.id,
      type: 'leave',
      title: 'Leave Rejected',
      message: `Your ${leave.leave_type} leave request for ${leave.start_date} to ${leave.end_date} has been rejected.`,
      referenceId: null
    });

    res.json({ message: 'Leave rejected successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// NOTIFICATION ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════



// GET /api/notifications/unread-count
app.get('/api/notifications/unread-count', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0').get(req.user.id);
    res.json({ count: result.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read
app.patch('/api/notifications/:id/read', authMiddleware, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/read-all
app.patch('/api/notifications/read-all', authMiddleware, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE recipient_id = ?').run(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// REPORT ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/reports/sprint/:sprintId
app.get('/api/reports/sprint/:sprintId', authMiddleware, (req, res) => {
  try {
    const sprint = db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(req.params.sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const tasks = db.prepare(`
      SELECT t.*, e.name as assigneeName, e.team, e.sub_team as subTeam
      FROM tasks t
      JOIN employees e ON t.assigned_to = e.id
      WHERE t.sprint_id = ?
    `).all(req.params.sprintId);

    // Group by employee
    const byEmployee = {};
    for (const t of tasks) {
      if (!byEmployee[t.assigned_to]) {
        byEmployee[t.assigned_to] = {
          name: t.assigneeName,
          team: t.team,
          subTeam: t.subTeam,
          tasks: [],
          totalEst: 0,
          totalSpent: 0,
          done: 0,
          blocked: 0
        };
      }
      const emp = byEmployee[t.assigned_to];
      const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(t.task_id);
      emp.tasks.push({
        taskId: t.task_id,
        title: t.task_title,
        status: t.status,
        estimatedHours: t.estimated_hours,
        spentHours: t.spent_hours,
        subtasks: subtasks.map(s => ({
          title: s.subtask_title,
          status: s.status,
          estimatedHours: s.estimated_hours,
          spentHours: s.spent_hours
        }))
      });
      emp.totalEst += t.estimated_hours;
      emp.totalSpent += t.spent_hours;
      if (t.status === 'done') emp.done++;
      if (t.status === 'blocked') emp.blocked++;
    }

    // Calculate per-employee stats
    const employeeReports = Object.entries(byEmployee).map(([id, emp]) => ({
      employeeId: parseInt(id),
      name: emp.name,
      team: emp.team,
      subTeam: emp.subTeam,
      tasksAssigned: emp.tasks.length,
      tasksCompleted: emp.done,
      tasksBlocked: emp.blocked,
      estimatedHours: emp.totalEst,
      spentHours: emp.totalSpent,
      completionRate: emp.tasks.length > 0 ? Math.round((emp.done / emp.tasks.length) * 100) : 0,
      estimationAccuracy: emp.totalEst > 0 ? Math.round((1 - Math.abs(emp.totalEst - emp.totalSpent) / emp.totalEst) * 100) : 0,
      tasks: emp.tasks
    }));

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const totalEst = tasks.reduce((s, t) => s + t.estimated_hours, 0);
    const totalSpent = tasks.reduce((s, t) => s + t.spent_hours, 0);

    res.json({
      sprint: {
        sprintId: sprint.sprint_id,
        sprintName: sprint.sprint_name,
        startDate: sprint.start_date,
        endDate: sprint.end_date,
        status: sprint.status
      },
      summary: {
        totalTasks,
        doneTasks,
        velocity: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        totalEstimatedHours: totalEst,
        totalSpentHours: totalSpent,
        effortVariance: totalEst > 0 ? Math.round(((totalSpent - totalEst) / totalEst) * 100) : 0
      },
      employees: employeeReports
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/employee/:id
app.get('/api/reports/employee/:id', authMiddleware, (req, res) => {
  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const tasks = db.prepare(`
      SELECT t.*, s.sprint_name, s.sprint_id as sid, s.status as sprintStatus
      FROM tasks t
      JOIN sprints s ON t.sprint_id = s.sprint_id
      WHERE t.assigned_to = ?
      ORDER BY s.start_date DESC
    `).all(req.params.id);

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const totalEst = tasks.reduce((s, t) => s + t.estimated_hours, 0);
    const totalSpent = tasks.reduce((s, t) => s + t.spent_hours, 0);

    res.json({
      employee: {
        id: employee.id,
        name: employee.name,
        team: employee.team,
        subTeam: employee.sub_team
      },
      stats: {
        totalTasks,
        doneTasks,
        blockedTasks: tasks.filter(t => t.status === 'blocked').length,
        completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        estimationAccuracy: totalEst > 0 ? Math.round((1 - Math.abs(totalEst - totalSpent) / totalEst) * 100) : 0,
        totalEstimatedHours: totalEst,
        totalSpentHours: totalSpent
      },
      tasks: tasks.map(t => ({
        taskId: t.task_id,
        sprintId: t.sid,
        sprintName: t.sprint_name,
        title: t.task_title,
        status: t.status,
        estimatedHours: t.estimated_hours,
        spentHours: t.spent_hours
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/velocity — Sprint velocity trend
app.get('/api/reports/velocity', authMiddleware, (req, res) => {
  try {
    const sprints = db.prepare(`
      SELECT s.sprint_id, s.sprint_name,
        (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.sprint_id) as totalTasks,
        (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.sprint_id AND status = 'done') as doneTasks
      FROM sprints s
      ORDER BY s.start_date ASC
    `).all();

    res.json(sprints.map(s => ({
      sprintId: s.sprint_id,
      sprintName: s.sprint_name,
      velocity: s.totalTasks > 0 ? Math.round((s.doneTasks / s.totalTasks) * 100) : 0,
      totalTasks: s.totalTasks,
      doneTasks: s.doneTasks
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/estimation-accuracy — Per employee
app.get('/api/reports/estimation-accuracy', authMiddleware, (req, res) => {
  try {
    const { sprintId } = req.query;
    let taskQuery = `
      SELECT t.assigned_to, e.name,
        SUM(t.estimated_hours) as totalEst,
        SUM(t.spent_hours) as totalSpent
      FROM tasks t
      JOIN employees e ON t.assigned_to = e.id
    `;
    const params = [];
    if (sprintId) {
      taskQuery += ' WHERE t.sprint_id = ?';
      params.push(sprintId);
    }
    taskQuery += ' GROUP BY t.assigned_to ORDER BY e.name';

    const employees = db.prepare(taskQuery).all(...params);

    res.json(employees.map(e => ({
      employeeId: e.assigned_to,
      name: e.name,
      totalEstimated: e.totalEst,
      totalSpent: e.totalSpent,
      accuracy: e.totalEst > 0 ? Math.round((1 - Math.abs(e.totalEst - e.totalSpent) / e.totalEst) * 100) : 0
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// SPRINT MEMBER ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// POST /api/sprint-members — Add member to sprint
app.post('/api/sprint-members', authMiddleware, managerOnly, (req, res) => {
  try {
    const { sprintId, userId, role, estimatedHours, taskTitle, taskDescription, taskPriority } = req.body;
    if (!sprintId || !userId) {
      return res.status(400).json({ error: 'Sprint ID and user ID are required.' });
    }

    // Check if already a member
    const existing = db.prepare('SELECT id FROM sprint_members WHERE sprint_id = ? AND user_id = ?').get(sprintId, userId);
    if (existing) return res.status(400).json({ error: 'User is already a member of this sprint.' });

    db.prepare(`
      INSERT INTO sprint_members (sprint_id, user_id, role, estimated_hours)
      VALUES (?, ?, ?, ?)
    `).run(sprintId, userId, role || '', estimatedHours || 0);

    // Create task if title provided
    if (taskTitle) {
      const taskId = generateTaskId();
      db.prepare(`
        INSERT INTO tasks (task_id, sprint_id, assigned_to, task_title, description, priority, status, estimated_hours, created_by)
        VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?)
      `).run(taskId, sprintId, userId, taskTitle, taskDescription || '', taskPriority || 'medium', estimatedHours || 0, req.user.id);
    }

    // Notify
    const sprint = db.prepare('SELECT sprint_name FROM sprints WHERE sprint_id = ?').get(sprintId);
    createNotification({
      recipientId: userId,
      senderId: req.user.id,
      type: 'sprint',
      title: 'Added to Sprint',
      message: `You have been added to Sprint ${sprintId} "${sprint ? sprint.sprint_name : ''}".`,
      referenceId: sprintId
    });

    res.status(201).json({ message: 'Member added to sprint successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sprint-members/:sprintId/:userId
app.delete('/api/sprint-members/:sprintId/:userId', authMiddleware, managerOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM sprint_members WHERE sprint_id = ? AND user_id = ?').run(req.params.sprintId, req.params.userId);
    res.json({ message: 'Member removed from sprint' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// NOTIFICATION & LEAVE ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/notifications
app.get('/api/notifications', authMiddleware, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT n.*, e.name as senderName, e.avatar_initials as senderInitials
      FROM notifications n
      LEFT JOIN employees e ON n.sender_id = e.id
      WHERE n.recipient_id = ?
      ORDER BY n.created_at DESC
    `).all(req.user.id);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/read-all
app.put('/api/notifications/read-all', authMiddleware, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE recipient_id = ?').run(req.user.id);
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications/unread-count
app.get('/api/notifications/unread-count', authMiddleware, (req, res) => {
  try {
    const result = db.prepare(`
      SELECT COUNT(*) as unread_count 
      FROM notifications 
      WHERE recipient_id = ? AND is_read = 0
    `).get(req.user.id);
    res.json({ unread_count: result.unread_count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read
app.put('/api/notifications/:id/read', authMiddleware, (req, res) => {
  try {
    console.log(`[API] Marking notification ${req.params.id} as read for user ${req.user.id}`);
    const info = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?').run(req.params.id, req.user.id);
    console.log(`[API] DB update info:`, info);
    res.json({ message: 'Marked as read', info });
  } catch (err) {
    console.error(`[API] Error marking read:`, err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications
app.delete('/api/notifications', authMiddleware, (req, res) => {
  try {
    const { ids } = req.body; // Array of IDs to delete
    if (ids && ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      db.prepare(`DELETE FROM notifications WHERE recipient_id = ? AND id IN (${placeholders})`).run(req.user.id, ...ids);
    } else {
      // If no IDs provided, maybe delete all? Or just return error
      return res.status(400).json({ error: 'No notification IDs provided' });
    }
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leaves
app.get('/api/leaves', authMiddleware, managerOnly, (req, res) => {
  try {
    const leaves = db.prepare(`
      SELECT l.*, e.name as employeeName, e.department, e.role, e.avatar_initials as employeeInitials
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      WHERE l.manager_id = ?
      ORDER BY l.applied_at DESC
    `).all(req.user.id);
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/leaves/:id/status
app.put('/api/leaves/:id/status', authMiddleware, managerOnly, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE leaves SET status = ?, decided_at = datetime("now") WHERE id = ? AND manager_id = ?').run(status, req.params.id, req.user.id);
    
    // Notify employee
    const leave = db.prepare('SELECT employee_id FROM leaves WHERE id = ?').get(req.params.id);
    if (leave) {
      createNotification({
        recipientId: leave.employee_id,
        senderId: req.user.id,
        type: 'leave',
        title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your leave request has been ${status}.`,
        referenceId: req.params.id.toString()
      });
    }

    res.json({ message: `Leave ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings/notifications
app.get('/api/settings/notifications', authMiddleware, (req, res) => {
  try {
    let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);
    if (!settings) {
      db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(req.user.id);
      settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/notifications
app.put('/api/settings/notifications', authMiddleware, (req, res) => {
  try {
    const { notify_queries, notify_leaves, notify_sprints, notify_system, delivery_inapp, delivery_email } = req.body;
    db.prepare(`
      UPDATE user_settings 
      SET notify_queries = ?, notify_leaves = ?, notify_sprints = ?, notify_system = ?, delivery_inapp = ?, delivery_email = ?
      WHERE user_id = ?
    `).run(
      notify_queries ? 1 : 0, 
      notify_leaves ? 1 : 0, 
      notify_sprints ? 1 : 0, 
      notify_system ? 1 : 0, 
      delivery_inapp ? 1 : 0, 
      delivery_email ? 1 : 0, 
      req.user.id
    );
    res.json({ message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// SPA FALLBACK
// ══════════════════════════════════════════════════════════════════════════

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start Server ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n  Nokia Sprint Management Platform');
  console.log('  ═════════════════════════════════');
  console.log(`  Server:    http://localhost:${PORT}`);
  console.log(`  Database:  ${DB_PATH}`);
  console.log('  Status:    Ready\n');
});
