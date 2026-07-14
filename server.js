/**
 * server.js — Nokia Sprint Management Platform
 * Express.js Backend with SQLite + Complete REST API
 */

const express = require('express');
const ExcelJS = require('exceljs');
const cors = require('cors');
const { Pool } = require('pg');

class PGStatement {
  constructor(pool, sql) {
    this.pool = pool;
    this.sql = sql;
  }
  
  _convert(sql) {
    let i = 1;
    return sql.replace(/\?/g, () => '$' + (i++));
  }
  
  async get(...params) {
    let flatParams = Array.isArray(params[0]) ? params[0] : params;
    if (params.length === 1 && Array.isArray(params[0])) flatParams = params[0];
    else flatParams = params;
    
    try {
      const res = await this.pool.query(this._convert(this.sql), flatParams);
      return res.rows[0];
    } catch(e) {
      console.error('DB Error GET:', e.message, this.sql, flatParams);
      throw e;
    }
  }
  
  async all(...params) {
    let flatParams = Array.isArray(params[0]) ? params[0] : params;
    if (params.length === 1 && Array.isArray(params[0])) flatParams = params[0];
    else flatParams = params;
    
    try {
      const res = await this.pool.query(this._convert(this.sql), flatParams);
      return res.rows;
    } catch(e) {
      console.error('DB Error ALL:', e.message, this.sql, flatParams);
      throw e;
    }
  }
  
  async run(...params) {
    let flatParams = Array.isArray(params[0]) ? params[0] : params;
    if (params.length === 1 && Array.isArray(params[0])) flatParams = params[0];
    else flatParams = params;
    
    let modifiedSql = this._convert(this.sql);
    let isInsert = /^\s*INSERT/i.test(modifiedSql);
    if (isInsert && !/RETURNING/i.test(modifiedSql)) {
      modifiedSql = modifiedSql.trim().replace(/;$/, '') + " RETURNING id";
    }
    
    try {
      const res = await this.pool.query(modifiedSql, flatParams);
      return {
        changes: res.rowCount,
        lastInsertRowid: isInsert && res.rows[0] ? res.rows[0].id : null
      };
    } catch(e) {
      console.error('DB Error RUN:', e.message, this.sql, flatParams);
      throw e;
    }
  }
}

class PGDatabaseWrapper {
  constructor(config) {
    this.pool = new Pool(config);
  }
  
  pragma(stmt) {}
  
  transaction(cb) {
    return async (...args) => {
      // NOTE: In a true PG connection, the client must be passed down. 
      // For this migration layer, we execute it directly.
      return await cb(...args);
    };
  }
  
  prepare(sql) {
    return new PGStatement(this.pool, sql);
  }
}
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Database Setup ──────────────────────────────────────────────────────
const DB_PATH = process.env.DATABASE_URL || 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db';
const db = new PGDatabaseWrapper({ connectionString: DB_PATH });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* top level schema migrations removed */

// ── Middleware ───────────────────────────────────────────────────────────
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Request logging middleware
app.use(async (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api/')) {
      console.log(`  ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

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
  if (req.user.role !== 'manager' && req.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
}

function managerOrAdmin(req, res, next) {
  if (req.user.role !== 'administrator' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Manager or Administrator access required' });
  }
  next();
}

// ── Helper Functions ────────────────────────────────────────────────────

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

async function generateSprintId() {
  const last = await db.prepare("SELECT sprint_id FROM sprints WHERE sprint_id LIKE 'S%' ORDER BY LENGTH(sprint_id) DESC, sprint_id DESC LIMIT 1").get();
  if (!last) return 'S4321';
  const num = parseInt(last.sprint_id.replace('S', '')) + 1;
  return 'S' + num;
}

async function generateTaskId() {
  const last = await db.prepare("SELECT task_id FROM tasks WHERE task_id LIKE 'TSK-%' ORDER BY LENGTH(task_id) DESC, task_id DESC LIMIT 1").get();
  if (!last) return 'TSK-001';
  const num = parseInt(last.task_id.replace('TSK-', '')) + 1;
  return 'TSK-' + String(num).padStart(3, '0');
}

async function generateSubtaskId() {
  const last = await db.prepare("SELECT subtask_id FROM subtasks WHERE subtask_id LIKE 'SUB-%' ORDER BY LENGTH(subtask_id) DESC, subtask_id DESC LIMIT 1").get();
  if (!last) return 'SUB-001';
  const num = parseInt(last.subtask_id.replace('SUB-', '')) + 1;
  return 'SUB-' + String(num).padStart(3, '0');
}

async function generateQueryId() {
  const last = await db.prepare("SELECT query_id FROM queries WHERE query_id LIKE 'QRY-%' ORDER BY LENGTH(query_id) DESC, query_id DESC LIMIT 1").get();
  if (!last) return 'QRY-001';
  const num = parseInt(last.query_id.replace('QRY-', '')) + 1;
  return 'QRY-' + String(num).padStart(3, '0');
}

async function createNotification({ recipientId, senderId, type, title, message, referenceId }) {
  await db.prepare(`
    INSERT INTO notifications (recipient_id, sender_id, type, title, message, reference_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(recipientId, senderId || null, type, title, message, referenceId || null);
}

async function notifySprintMembers(sprintId, senderId, type, title, message) {
  const members = await db.prepare('SELECT user_id FROM sprint_members WHERE sprint_id = ?').all(sprintId);
  for (const m of members) {
    await createNotification({ recipientId: m.user_id, senderId, type, title, message, referenceId: sprintId });
  }
}

// ══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════════════════════════════════════════
app.get('/api/health', async (req, res) => {
  try {
    await db.prepare('SELECT 1').get();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      version: '1.0.0'
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// AUTH ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    const user = await db.prepare('SELECT * FROM employees WHERE email = ?').get(email);
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
app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  tokenStore.delete(req.token);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// ══════════════════════════════════════════════════════════════════════════
// USER ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// POST /api/users — Create new user (Manager Only)
app.post('/api/users', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { name, email, password, role, team, subTeam, department } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    // Check if email already exists
    const existing = await db.prepare('SELECT id FROM employees WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const avatarInitials = getInitials(name);

    const info = await db.prepare(`
      INSERT INTO employees (name, email, password, role, team, sub_team, department, avatar_initials)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, 
      email, 
      password, // Note: storing in plain text as per current architecture
      role.toLowerCase(), 
      team || '', 
      subTeam || '', 
      department || 'Engineering',
      avatarInitials
    );

    res.json({ success: true, id: info.lastInsertRowid, message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — Update existing user (Manager Only)
app.put('/api/users/:id', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, team, subTeam, department, newPassword } = req.body;
    
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    // Check if email already exists for a DIFFERENT user
    const existing = await db.prepare('SELECT id FROM employees WHERE email = ? AND id != ?').get(email, id);
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered to another user' });
    }

    const avatarInitials = getInitials(name);

    if (newPassword && newPassword.trim() !== '') {
      // Update including password
      await db.prepare(`
        UPDATE employees 
        SET name = ?, email = ?, password = ?, role = ?, team = ?, sub_team = ?, department = ?, avatar_initials = ?
        WHERE id = ?
      `).run(name, email, newPassword.trim(), role.toLowerCase(), team || '', subTeam || '', department || 'Engineering', avatarInitials, id);
    } else {
      // Update without touching password
      await db.prepare(`
        UPDATE employees 
        SET name = ?, email = ?, role = ?, team = ?, sub_team = ?, department = ?, avatar_initials = ?
        WHERE id = ?
      `).run(name, email, role.toLowerCase(), team || '', subTeam || '', department || 'Engineering', avatarInitials, id);
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id — Remove a user (Manager Only)
app.delete('/api/users/:id', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent managers from deleting themselves
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    await db.prepare('DELETE FROM employees WHERE id = ?').run(id);
    res.json({ success: true, message: 'Employee removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users — All users
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const users = await db.prepare(`
      SELECT id, name, email, team, sub_team as subTeam, role, department, avatar_initials as initials
      FROM employees ORDER BY role DESC, name ASC
    `).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/employees — Only employees
app.get('/api/users/employees', authMiddleware, async (req, res) => {
  try {
    const users = await db.prepare(`
      SELECT id, name, email, team, sub_team as subTeam, role, department, avatar_initials as initials
      FROM employees WHERE role = 'employee' ORDER BY name ASC
    `).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/managers — Only managers
app.get('/api/users/managers', authMiddleware, async (req, res) => {
  try {
    const managers = await db.prepare(`
      SELECT id, name, email, team, sub_team as subTeam, role, department, avatar_initials as initials
      FROM employees WHERE role = 'manager' OR role = 'scrum_master' OR role = 'administrator' ORDER BY name ASC
    `).all();
    res.json(managers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team/stats
app.get('/api/team/stats', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { timeRange } = req.query;
    
    // Date bounds
    let dateCondition = '';
    let params = [];
    let attCondition = '';
    let attParams = [];

    if (timeRange === 'this_month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      dateCondition = 'AND created_at >= ? AND created_at <= ?';
      params.push(`${start} 00:00:00`, `${end} 23:59:59`);
      attCondition = 'AND date >= ? AND date <= ?';
      attParams.push(start, end);
    } else if (timeRange === 'last_3_months') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      dateCondition = 'AND created_at >= ? AND created_at <= ?';
      params.push(`${start} 00:00:00`, `${end} 23:59:59`);
      attCondition = 'AND date >= ? AND date <= ?';
      attParams.push(start, end);
    }

    // 1. Get all employees
    const employees = await db.prepare(`SELECT id, name, email, role, avatar_initials as initials, department, team, sub_team as subTeam FROM employees`).all();

    // 2. Gather task metrics
    const tasksQuery = `
      SELECT assigned_to, status
      FROM tasks 
      WHERE 1=1 ${dateCondition}
    `;
    const tasks = await db.prepare(tasksQuery).all(...params);

    // 3. Gather attendance metrics
    const attendance = await db.prepare(`SELECT user_id, status FROM attendance WHERE 1=1 ${attCondition}`).all(...attParams);

    // 4. Gather active sprints
    const activeSprints = await db.prepare(`
      SELECT sm.user_id, s.sprint_id, s.sprint_name, s.status 
      FROM sprint_members sm
      JOIN sprints s ON sm.sprint_id = s.sprint_id
      WHERE s.status IN ('active')
    `).all();

    // Map data
    const result = employees.map(emp => {
      // Tasks
      const empTasks = tasks.filter(t => t.assigned_to === emp.id);
      const totalTasks = empTasks.length;
      const tasksDone = empTasks.filter(t => t.status === 'done').length;
      
      const totalSpentHours = 0;

      // Attendance
      const empAtt = attendance.filter(a => a.user_id === emp.id);
      const attStats = { present: 0, absent: 0, halfDay: 0, onLeave: 0 };
      empAtt.forEach(a => {
        if (a.status === 'Present') attStats.present++;
        else if (a.status === 'Absent') attStats.absent++;
        else if (a.status === 'Half-Day') attStats.halfDay++;
        else attStats.onLeave++;
      });

      // Active Sprints
      const sprints = activeSprints.filter(s => s.user_id === emp.id).map(s => ({
        id: s.sprint_id,
        name: s.sprint_name,
        status: s.status
      }));

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        initials: emp.initials,
        department: emp.department,
        team: emp.team,
        subTeam: emp.subTeam,
        metrics: {
          totalTasks,
          tasksDone,
          totalEstHours,
          totalSpentHours
        },
        attendance: attStats,
        activeSprints: sprints
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/team/employee/:id/details
app.get('/api/team/employee/:id/details', authMiddleware, managerOnly, async (req, res) => {
  try {
    const empId = req.params.id;
    
    // 1. User Info
    const employee = await db.prepare('SELECT id, name, email, role, avatar_initials as initials, department, team, sub_team as subTeam FROM employees WHERE id = ?').get(empId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    // 2. Attendance (Current Month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const attendance = await db.prepare('SELECT date, status FROM attendance WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC').all(empId, startOfMonth, endOfMonth);
    const attStats = { present: 0, absent: 0, onLeave: 0 };
    attendance.forEach(a => {
      if (a.status === 'Present') attStats.present++;
      else if (a.status === 'Absent') attStats.absent++;
      else attStats.onLeave++;
    });

    // 3. Active Sprints & Tasks
    const activeSprints = await db.prepare(`
      SELECT s.sprint_id, s.sprint_name 
      FROM sprint_members sm
      JOIN sprints s ON sm.sprint_id = s.sprint_id
      WHERE sm.user_id = ? AND s.status = 'active'
    `).all(empId);

    const activeSprintIds = activeSprints.map(s => s.sprint_id);
    let sprintTasks = [];
    if (activeSprintIds.length > 0) {
      sprintTasks = await db.prepare(`
        SELECT task_id, task_title, status, priority
        FROM tasks 
        WHERE assigned_to = ? AND sprint_id IN (${activeSprintIds.map(() => '?').join(',')})
        ORDER BY created_at DESC
      `).all(empId, ...activeSprintIds);
    }

    // 4. All Tasks Metrics (Lifetime or active)
    const allTasks = await db.prepare('SELECT status FROM tasks WHERE assigned_to = ?').all(empId);
    const metrics = {
      totalTasks: allTasks.length,
      tasksDone: allTasks.filter(t => t.status === 'done').length
    };

    // 5. Recent Activity
    const activities = [];
    
    // Tasks created/assigned
    const recentTasks = await db.prepare('SELECT task_title, created_at FROM tasks WHERE assigned_to = ? ORDER BY created_at DESC LIMIT 5').all(empId);
    recentTasks.forEach(t => activities.push({ action: `Assigned task "${t.task_title}"`, timestamp: t.created_at }));

    // Leaves
    const recentLeaves = await db.prepare('SELECT leave_type, status, applied_at FROM leaves WHERE employee_id = ? ORDER BY applied_at DESC LIMIT 5').all(empId);
    recentLeaves.forEach(l => activities.push({ action: `Applied for ${l.leave_type} leave (${l.status})`, timestamp: l.applied_at }));

    // Sort activities by timestamp DESC and take top 7
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivity = activities.slice(0, 7);

    res.json({
      ...employee,
      metrics,
      attendanceList: attendance,
      attendanceStats: attStats,
      activeSprints,
      sprintTasks,
      recentActivity
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id — Single user
app.get('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const user = await db.prepare(`
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
// ADMIN TEAM ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/admin/team/sprints
app.get('/api/admin/team/sprints', authMiddleware, async (req, res) => {
  if (req.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Administrator access required' });
  }

  try {
    const sprints = await db.prepare(`
      SELECT s.sprint_id, s.sprint_name, s.status, s.start_date, s.end_date, s.owner_id,
        e.name as managerName, e.avatar_initials as managerInitials, e.role as managerRole,
        (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.sprint_id) as taskCount
      FROM sprints s
      LEFT JOIN employees e ON s.owner_id = e.id
      ORDER BY s.created_at DESC
    `).all();

    // Fetch members for all sprints
    const sprintIds = sprints.map(s => s.sprint_id);
    let allMembers = [];
    if (sprintIds.length > 0) {
      allMembers = await db.prepare(`
        SELECT sm.sprint_id, e.id, e.name, e.avatar_initials, sm.role
        FROM sprint_members sm
        JOIN employees e ON sm.user_id = e.id
        WHERE sm.sprint_id IN (${sprintIds.map(() => '?').join(',')})
      `).all(...sprintIds);
    }

    // Group members by sprint_id
    const membersBySprint = allMembers.reduce((acc, curr) => {
      if (!acc[curr.sprint_id]) acc[curr.sprint_id] = [];
      acc[curr.sprint_id].push(curr);
      return acc;
    }, {});

    const result = sprints.map(s => ({
      sprintId: s.sprint_id,
      sprintName: s.sprint_name,
      status: s.status,
      startDate: s.start_date,
      endDate: s.end_date,
      manager: s.owner_id ? {
        id: s.owner_id,
        name: s.managerName || s.managername,
        initials: s.managerInitials || s.managerinitials,
        role: s.managerRole || s.managerrole
      } : null,
      taskCount: s.taskCount || s.taskcount,
      meetingLink: s.meeting_link,
      allowedStatuses: JSON.parse(s.allowed_statuses || '["todo", "inprogress", "done", "blocked", "failed"]'),
      members: membersBySprint[s.sprint_id] || []
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// SPRINT ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/sprints
app.get('/api/sprints', authMiddleware, async (req, res) => {
  try {
    const sprints = await db.prepare(`
      SELECT s.*, e.name as creatorName, e2.name as ownerName,
        r.dod_met, r.qa_passed, r.stakeholder_signoff, r.reviewer_notes, r.return_reason, r.moved_to_review_at, r.notes_updated_at,
        (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.sprint_id) as taskCount,
        (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.sprint_id AND status = 'done') as doneCount,
        (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.sprint_id AND status = 'todo') as todoCount,
        (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.sprint_id AND status = 'inprogress') as inProgressCount,
        (SELECT COUNT(*) FROM tasks WHERE sprint_id = s.sprint_id AND status = 'blocked') as blockedCount,
        (SELECT COUNT(*) FROM sprint_members WHERE sprint_id = s.sprint_id) as memberCount
      FROM sprints s
      LEFT JOIN employees e ON s.created_by = e.id
      LEFT JOIN employees e2 ON s.owner_id = e2.id
      LEFT JOIN sprint_reviews r ON s.sprint_id = r.sprint_id
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
      plannerDate: s.planner_date,
      createdBy: s.created_by,
      creatorName: s.creatorName || s.creatorname,
      ownerId: s.owner_id,
      ownerName: s.ownerName || s.ownername,
      taskCount: s.taskCount || s.taskcount,
      doneCount: s.doneCount || s.donecount,
      todoCount: s.todoCount || s.todocount,
      inProgressCount: s.inProgressCount || s.inprogresscount,
      blockedCount: s.blockedCount || s.blockedcount,
      memberCount: s.memberCount || s.membercount,
      allowedStatuses: JSON.parse(s.allowed_statuses || '["todo", "inprogress", "done", "blocked", "failed"]'),
      velocity: (s.taskCount || s.taskcount) > 0 ? Math.round(((s.doneCount || s.donecount) / (s.taskCount || s.taskcount)) * 100) : 0,
      reviewData: s.status === 'review' || s.return_reason ? {
        dodMet: !!s.dod_met,
        qaPassed: !!s.qa_passed,
        stakeholderSignoff: !!s.stakeholder_signoff,
        reviewerNotes: s.reviewer_notes || '',
        returnReason: s.return_reason || '',
        movedToReviewAt: s.moved_to_review_at,
        notesUpdatedAt: s.notes_updated_at
      } : null
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /api/sprints/:sprintId
app.get('/api/sprints/:sprintId', authMiddleware, async (req, res) => {
  try {
    const sprint = await db.prepare(`
      SELECT s.*, e2.name as ownerName, r.dod_met, r.qa_passed, r.stakeholder_signoff, r.reviewer_notes, r.return_reason, r.moved_to_review_at, r.notes_updated_at
      FROM sprints s 
      LEFT JOIN employees e2 ON s.owner_id = e2.id
      LEFT JOIN sprint_reviews r ON s.sprint_id = r.sprint_id 
      WHERE s.sprint_id = ?
    `).get(req.params.sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const members = await db.prepare(`
      SELECT sm.*, e.name, e.email, e.team, e.sub_team as subTeam, e.avatar_initials as initials, e.role as empRole
      FROM sprint_members sm
      JOIN employees e ON sm.user_id = e.id
      WHERE sm.sprint_id = ?
    `).all(req.params.sprintId);

    const tasks = await db.prepare(`
      SELECT t.*
      FROM tasks t
      WHERE t.sprint_id = ?
      ORDER BY t.id ASC
    `).all(req.params.sprintId);
    
    const allEmployees = await db.prepare('SELECT id, name, avatar_initials as initials, role FROM employees').all();

    const subtasks = await db.prepare(`
      SELECT st.*
      FROM subtasks st
      JOIN tasks t ON st.task_id = t.task_id
      WHERE t.sprint_id = ?
    `).all(req.params.sprintId);

    const notes = await db.prepare('SELECT * FROM sprint_notes WHERE sprint_id = ? ORDER BY created_at ASC').all(req.params.sprintId);
    const attachments = await db.prepare('SELECT * FROM sprint_attachments WHERE sprint_id = ? ORDER BY created_at ASC').all(req.params.sprintId);

    res.json({
      ...sprint,
      sprintId: sprint.sprint_id,
      sprintName: sprint.sprint_name,
      sprintGoal: sprint.sprint_goal,
      startDate: sprint.start_date,
      endDate: sprint.end_date,
      createdBy: sprint.created_by,
      ownerId: sprint.owner_id,
      ownerName: sprint.ownerName || sprint.ownername,
      meetingLink: sprint.meeting_link,
      allowedStatuses: JSON.parse(sprint.allowed_statuses || '["todo", "inprogress", "done", "blocked", "failed"]'),
      members: members.map(m => ({
        id: m.id,
        userId: m.user_id,
        name: m.name,
        email: m.email,
        team: m.team,
        subTeam: m.subTeam || m.subteam,
        initials: m.initials,
        role: m.empRole || m.emprole || m.role || 'employee'})),
      tasks: tasks.map(t => {
        let assigneeIds = [];
        try {
          assigneeIds = JSON.parse(t.assignees_json || '[]');
        } catch (e) { assigneeIds = []; }
        
        // If empty but has legacy assigned_to, use it
        if (assigneeIds.length === 0 && t.assigned_to) {
          assigneeIds = [t.assigned_to];
        }

        const assignees = assigneeIds.map(uid => {
          const emp = allEmployees.find(e => e.id === uid);
          if (!emp) return { id: uid };
          return { id: emp.id, name: emp.name, initials: emp.initials, role: emp.role };
        });

        return {
          id: t.id,
          taskId: t.task_id,
          title: t.task_title,
          description: t.description,
          priority: t.priority,
          status: t.status,
          
          assignees: assignees,
          assignedTo: assignees.length > 0 ? assignees[0].id : null,
          assigneeName: assignees.length > 0 ? assignees[0].name : null,
          assigneeInitials: assignees.length > 0 ? assignees[0].initials : null,
          featureId: t.feature_id,
          subtasksList: subtasks.filter(st => st.task_id === t.task_id).map(st => ({
            id: st.id,
            subtaskId: st.subtask_id,
            title: st.subtask_title,
            description: st.description,
            status: st.status}))
        };
      }),
      notes: notes.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        createdBy: n.created_by,
        createdAt: n.created_at
      })),
      attachments: attachments.map(a => ({
        id: a.id,
        fileName: a.file_name,
        fileUrl: a.file_url,
        isExternal: a.is_external === 1,
        uploadedBy: a.uploaded_by,
        createdAt: a.created_at
      })),
      reviewData: sprint.status === 'review' || sprint.return_reason ? {
        dodMet: !!sprint.dod_met,
        qaPassed: !!sprint.qa_passed,
        stakeholderSignoff: !!sprint.stakeholder_signoff,
        reviewerNotes: sprint.reviewer_notes || '',
        returnReason: sprint.return_reason || '',
        movedToReviewAt: sprint.moved_to_review_at,
        notesUpdatedAt: sprint.notes_updated_at
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const statsCache = new Map();

// GET /api/sprints/:sprintId/stats
app.get('/api/sprints/:sprintId/stats', authMiddleware, async (req, res) => {
  try {
    const sprintId = req.params.sprintId;
    
    // Check cache (60s TTL)
    const cached = statsCache.get(sprintId);
    if (cached && (Date.now() - cached.timestamp < 60000)) {
      return res.json(cached.data);
    }
    const sprint = await db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const tasks = await db.prepare('SELECT * FROM tasks WHERE sprint_id = ?').all(sprintId);
    const subtasks = await db.prepare(`
      SELECT s.* FROM subtasks s
      JOIN tasks t ON s.task_id = t.task_id
      WHERE t.sprint_id = ?
    `).all(sprintId);

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;

    
    const totalSpent = 0;

    const velocity = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const variance = 0;

    const highPriority = tasks.filter(t => t.priority === 'high').length;
    const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
    const lowPriority = tasks.filter(t => t.priority === 'low').length;

    const getPriorityStats = (priority) => {
      const pTasks = tasks.filter(t => t.priority === priority);
      const done = pTasks.filter(t => t.status === 'done').length;
      return { total: pTasks.length, done, incompleted: pTasks.length - done };
    };
    const taskPriorityCompletion = {
      high: getPriorityStats('high'),
      medium: getPriorityStats('medium'),
      low: getPriorityStats('low')
    };

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

    // Subtask Burndown data
    const subtaskBurndown = [];
    const totalSubtasks = subtasks.length;
    const doneSubtasks = subtasks.filter(s => s.status === 'done').length;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dayLabel = 'D' + (i + 1);
      const idealRemaining = totalSubtasks - (totalSubtasks / (totalDays - 1 || 1)) * i;
      const progress = Math.min(i / (totalDays - 1 || 1), 1);
      const actualRemaining = Math.max(totalSubtasks - Math.floor(doneSubtasks * progress * 1.2), totalSubtasks - doneSubtasks);
      subtaskBurndown.push({
        day: dayLabel,
        date: d.toISOString().slice(0, 10),
        ideal: Math.max(Math.round(idealRemaining * 10) / 10, 0),
        actual: Math.max(Math.round(actualRemaining * 10) / 10, 0)
      });
    }

    // Team workload data (hours per member per day)
    const members = await db.prepare(`
      SELECT sm.user_id, e.name
      FROM sprint_members sm
      JOIN employees e ON sm.user_id = e.id
      WHERE sm.sprint_id = ?
    `).all(sprintId);

    const teamWorkload = members.map(m => {
      // Distribute spent hours across weekdays deterministically
      const dailyAvg = 0;
      const getVal = (idx) => {
        // pseudo-random but deterministic based on user id and day index
        const modifier = 0.8 + ((m.user_id + idx) % 5) * 0.1; 
        return Math.round((dailyAvg * modifier) * 10) / 10;
      };
      return {
        name: m.name,
        userId: m.user_id,
        
        dailyHours: [getVal(1), getVal(2), getVal(3), getVal(4), getVal(5)]
      };
    });

    // Heatmap data
    const heatmapColumns = [];
    for (let i = 0; i < totalDays; i++) {
      heatmapColumns.push('D' + (i + 1));
    }

    const weeklyHeatmap = members.map(m => {
      const dailyAvg = 0;
      const data = {};
      let distributed = 0;
      for (let i = 0; i < totalDays; i++) {
        const modifier = 0.6 + ((m.user_id + i) % 7) * 0.15;
        const val = Math.round((dailyAvg * modifier) * 10) / 10;
        data['D' + (i + 1)] = val;
        distributed += val;
      }
      return {
        name: m.name,
        data
      };
    });

    const payload = {
      sprintId,
      velocity,
      totalTasks,
      doneTasks,
      inProgressTasks,
      blockedTasks,
      todoTasks,
      totalEstimatedHours: 0,
      totalSpentHours: totalSpent,
      effortVariance: variance,
      burndown,
      subtaskBurndown,
      taskStatusBreakdown: { done: doneTasks, inprogress: inProgressTasks, blocked: blockedTasks, todo: todoTasks },
      taskPriorityBreakdown: { high: highPriority, medium: mediumPriority, low: lowPriority },
      taskPriorityCompletion,
      teamWorkload,
      heatmapColumns,
      weeklyHeatmap,
      subtaskStats: {
        total: subtasks.length,
        done: subtasks.filter(s => s.status === 'done').length,
        inprogress: subtasks.filter(s => s.status === 'inprogress').length,
        blocked: subtasks.filter(s => s.status === 'blocked').length,
        todo: subtasks.filter(s => s.status === 'todo').length
      }
    };

    statsCache.set(sprintId, { timestamp: Date.now(), data: payload });
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sprints/:sprintId/report
app.get('/api/sprints/:sprintId/report', authMiddleware, async (req, res) => {
  try {
    const sprintId = req.params.sprintId;
    const sprint = await db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const members = await db.prepare(`
      SELECT sm.*, e.name, e.email 
      FROM sprint_members sm 
      JOIN employees e ON sm.user_id = e.id 
      WHERE sm.sprint_id = ?
    `).all(sprintId);

    const tasks = await db.prepare(`
      SELECT t.*, e.name as assigneeName 
      FROM tasks t 
      JOIN employees e ON t.assigned_to = e.id 
      WHERE t.sprint_id = ?
    `).all(sprintId);

    const subtasks = await db.prepare(`
      SELECT s.* FROM subtasks s 
      JOIN tasks t ON s.task_id = t.task_id 
      WHERE t.sprint_id = ?
    `).all(sprintId);

    const queries = await db.prepare(`
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
        
        const tasksWithSubtasks = memberTasks.map(t => ({
          ...t,
          subtasksList: memberSubtasks.filter(s => s.task_id === t.task_id)
        }));
        
        return {
          id: m.id,
          name: m.name,
          role: m.role,
          tasks: tasksWithSubtasks,
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
app.post('/api/sprints', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { sprintName, sprintGoal, description, priority, startDate, endDate, members, notes, attachments, owner_id } = req.body;
    if (!sprintName || !startDate || !endDate) {
      return res.status(400).json({ error: 'Sprint name, start date, and end date are required.' });
    }
    let finalOwnerId = req.user.id;
    if (req.user.role === 'administrator' && owner_id) {
      finalOwnerId = owner_id;
    }

    if (isNaN(new Date(startDate).getTime()) || isNaN(new Date(endDate).getTime())) {
      return res.status(400).json({ error: 'Start date and end date must be valid ISO formats.' });
    }

    const sprintId = await generateSprintId();

    const transaction = await db.transaction(async () => {
      await db.prepare(`
        INSERT INTO sprints (sprint_id, sprint_name, sprint_goal, description, priority, status, start_date, end_date, created_by, owner_id)
        VALUES (?, ?, ?, ?, ?, 'created', ?, ?, ?, ?)
      `).run(sprintId, sprintName, sprintGoal || '', description || '', priority || 'medium', startDate, endDate, req.user.id, finalOwnerId || null);

      // Add members with their tasks
      if (members && Array.isArray(members)) {
        for (const m of members) {
          if (!m.userId) continue;

          // Support backward compatibility or new tasks array
          const tasksToCreate = [];
          if (m.tasks && Array.isArray(m.tasks)) {
            tasksToCreate.push(...m.tasks);
          } else if (m.taskTitle) {
            tasksToCreate.push({ title: m.taskTitle, description: m.taskDescription || '', priority: m.taskPriority || 'medium' });
          }

          await db.prepare(`
            INSERT INTO sprint_members (sprint_id, user_id, role)
            VALUES (?, ?, ?)
          `).run(sprintId, m.userId, m.role || '');

          // Create tasks for this member
          for (const task of tasksToCreate) {
            if (!task.title) continue;
            const taskId = await generateTaskId();
            await db.prepare(`
              INSERT INTO tasks (task_id, sprint_id, assigned_to, task_title, description, priority, status, created_by, feature_id)
              VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?)
            `).run(taskId, sprintId, m.userId, task.title, task.description || '', task.priority || 'medium', req.user.id, m.featureId ? m.featureId : null);
          }

          // Notify member
          await createNotification({
            recipientId: m.userId,
            senderId: req.user.id,
            type: 'sprint',
            title: 'Added to Sprint',
            message: `You have been added to Sprint ${sprintId} "${sprintName}". Sprint starts ${startDate}.`,
            referenceId: sprintId
          });
        }
      }

      // Add sprint notes
      if (notes && Array.isArray(notes)) {
        for (const note of notes) {
          if (!note.title) continue;
          await db.prepare(`
            INSERT INTO sprint_notes (sprint_id, title, content, created_by)
            VALUES (?, ?, ?, ?)
          `).run(sprintId, note.title, note.content || '', req.user.id);
        }
      }

      // Add sprint attachments
      if (attachments && Array.isArray(attachments)) {
        for (const att of attachments) {
          if (!att.fileName || !att.fileUrl) continue;
          await db.prepare(`
            INSERT INTO sprint_attachments (sprint_id, file_name, file_url, is_external, uploaded_by)
            VALUES (?, ?, ?, ?, ?)
          `).run(sprintId, att.fileName, att.fileUrl, att.isExternal ? 1 : 0, req.user.id);
        }
      }
    });

    await transaction();
    res.status(201).json({ sprintId, message: 'Sprint created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sprints/:sprintId
app.put('/api/sprints/:sprintId', authMiddleware, managerOnly, async (req, res) => {
  try {
    const sprint = await db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(req.params.sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    if (sprint.status === 'completed') {
      return res.status(400).json({ error: 'Completed sprints cannot be edited.' });
    }

    const { sprintName, sprintGoal, description, priority, startDate, endDate, members, notes, attachments, owner_id } = req.body;
    const updates = [];
    const values = [];

    if (sprintName !== undefined) { updates.push('sprint_name = ?'); values.push(sprintName); }
    if (sprintGoal !== undefined) { updates.push('sprint_goal = ?'); values.push(sprintGoal); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    if (owner_id !== undefined) { updates.push('owner_id = ?'); values.push(owner_id === '' ? null : owner_id); }

    // Only allow date changes in created status
    if (sprint.status === 'created' || sprint.status === 'planner') {
      if (startDate !== undefined) {
        if (isNaN(new Date(startDate).getTime())) return res.status(400).json({ error: 'Start date must be a valid ISO format.' });
        updates.push('start_date = ?'); values.push(startDate);
      }
      if (endDate !== undefined) {
        if (isNaN(new Date(endDate).getTime())) return res.status(400).json({ error: 'End date must be a valid ISO format.' });
        updates.push('end_date = ?'); values.push(endDate);
      }
    }

    const transaction = await db.transaction(async () => {
      if (updates.length > 0) {
        const updateValues = [...values, req.params.sprintId];
        await db.prepare(`UPDATE sprints SET ${updates.join(', ')} WHERE sprint_id = ?`).run(...updateValues);
      }

      // Update members if provided (only in created or planner mode)
      if (members && Array.isArray(members) && (sprint.status === 'created' || sprint.status === 'planner')) {
        // Delete existing subtasks/queries for these tasks
        await db.prepare(`DELETE FROM subtasks WHERE task_id IN (SELECT task_id FROM tasks WHERE sprint_id = ?)`).run(req.params.sprintId);
        await db.prepare(`DELETE FROM queries WHERE task_id IN (SELECT task_id FROM tasks WHERE sprint_id = ?)`).run(req.params.sprintId);
        await db.prepare('DELETE FROM tasks WHERE sprint_id = ?').run(req.params.sprintId);
        await db.prepare('DELETE FROM sprint_members WHERE sprint_id = ?').run(req.params.sprintId);

        for (const m of members) {
          if (!m.userId) continue;

          const tasksToCreate = [];
          if (m.tasks && Array.isArray(m.tasks)) {
            tasksToCreate.push(...m.tasks);
          } else if (m.taskTitle) {
            tasksToCreate.push({ title: m.taskTitle, description: m.taskDescription || '', priority: m.taskPriority || 'medium' });
          }

          await db.prepare(`
            INSERT INTO sprint_members (sprint_id, user_id, role)
            VALUES (?, ?, ?)
          `).run(req.params.sprintId, m.userId, m.role || '');

          for (const task of tasksToCreate) {
            if (!task.title) continue;
            const taskId = await generateTaskId();
            await db.prepare(`
              INSERT INTO tasks (task_id, sprint_id, assigned_to, task_title, description, priority, status, created_by, feature_id)
              VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?)
            `).run(taskId, req.params.sprintId, m.userId, task.title, task.description || '', task.priority || 'medium', req.user.id, m.featureId ? m.featureId : null);
          }
        }
      }

      // Update notes if provided
      if (notes && Array.isArray(notes)) {
        await db.prepare('DELETE FROM sprint_notes WHERE sprint_id = ?').run(req.params.sprintId);
        for (const note of notes) {
          if (!note.title) continue;
          await db.prepare(`
            INSERT INTO sprint_notes (sprint_id, title, content, created_by)
            VALUES (?, ?, ?, ?)
          `).run(req.params.sprintId, note.title, note.content || '', req.user.id);
        }
      }

      // Update attachments if provided
      if (attachments && Array.isArray(attachments)) {
        await db.prepare('DELETE FROM sprint_attachments WHERE sprint_id = ?').run(req.params.sprintId);
        for (const att of attachments) {
          if (!att.fileName || !att.fileUrl) continue;
          await db.prepare(`
            INSERT INTO sprint_attachments (sprint_id, file_name, file_url, is_external, uploaded_by)
            VALUES (?, ?, ?, ?, ?)
          `).run(req.params.sprintId, att.fileName, att.fileUrl, att.isExternal ? 1 : 0, req.user.id);
        }
      }
    });

    await transaction();

    // Notify members of updates if there were any general details changed
    if (updates.length > 0) {
      await notifySprintMembers(req.params.sprintId, req.user.id, 'sprint', 'Sprint Updated', `Sprint "${sprintName || sprint.sprint_name}" details have been updated.`);
    }

    res.json({ message: 'Sprint updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sprints/:sprintId
app.delete('/api/sprints/:sprintId', authMiddleware, managerOnly, async (req, res) => {
  try {
    const sprint = await db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(req.params.sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const transaction = await db.transaction(async () => {
      // Delete child records manually since ON DELETE CASCADE is not set
      await db.prepare(`DELETE FROM timer_sessions WHERE subtask_id IN (SELECT subtask_id FROM subtasks WHERE task_id IN (SELECT task_id FROM tasks WHERE sprint_id = ?))`).run(req.params.sprintId);
      await db.prepare(`DELETE FROM subtasks WHERE task_id IN (SELECT task_id FROM tasks WHERE sprint_id = ?)`).run(req.params.sprintId);
      await db.prepare(`DELETE FROM queries WHERE task_id IN (SELECT task_id FROM tasks WHERE sprint_id = ?)`).run(req.params.sprintId);
      await db.prepare('DELETE FROM tasks WHERE sprint_id = ?').run(req.params.sprintId);
      await db.prepare('DELETE FROM sprint_members WHERE sprint_id = ?').run(req.params.sprintId);
      await db.prepare('DELETE FROM sprint_reviews WHERE sprint_id = ?').run(req.params.sprintId);
      await db.prepare('DELETE FROM sprint_notes WHERE sprint_id = ?').run(req.params.sprintId);
      await db.prepare('DELETE FROM sprint_attachments WHERE sprint_id = ?').run(req.params.sprintId);
      await db.prepare('DELETE FROM sprints WHERE sprint_id = ?').run(req.params.sprintId);
    });

    await transaction();
    res.json({ message: 'Sprint deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sprints/:sprintId/status
app.patch('/api/sprints/:sprintId/status', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const sprint = await db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(req.params.sprintId);
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

    if (status === 'planner') {
      await db.prepare('UPDATE sprints SET status = ?, planner_date = ? WHERE sprint_id = ?').run(status, new Date().toISOString().split('T')[0], req.params.sprintId);
    } else {
      await db.prepare('UPDATE sprints SET status = ? WHERE sprint_id = ?').run(status, req.params.sprintId);
    }

    // Send notifications based on transition
    const messages = {
      'planner': `Sprint ${sprint.sprint_id} "${sprint.sprint_name}" is now in Planner Mode. Please create your subtasks.`,
      'active': `Sprint ${sprint.sprint_id} "${sprint.sprint_name}" is now LIVE. Timer has started.`,
      'completed': `Sprint ${sprint.sprint_id} "${sprint.sprint_name}" has been completed.`
    };

    await notifySprintMembers(req.params.sprintId, req.user.id, 'sprint', `Sprint ${status.charAt(0).toUpperCase() + status.slice(1)}`, messages[status]);

    res.json({ message: `Sprint status changed to "${status}" successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sprints/:sprintId/statuses — configure allowed progress statuses
app.patch('/api/sprints/:sprintId/statuses', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { allowedStatuses } = req.body;
    if (!Array.isArray(allowedStatuses) || allowedStatuses.length === 0) {
      return res.status(400).json({ error: 'allowedStatuses must be a non-empty array' });
    }
    const valid = ['todo', 'inprogress', 'done', 'blocked', 'failed'];
    if (!allowedStatuses.every(s => valid.includes(s))) {
      return res.status(400).json({ error: 'Invalid status values' });
    }
    await db.prepare('UPDATE sprints SET allowed_statuses = ? WHERE sprint_id = ?')
      .run(JSON.stringify(allowedStatuses), req.params.sprintId);
    res.json({ message: 'Allowed statuses updated', allowedStatuses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sprints/:sprintId/tasks/:taskId/assignees — update task assignees (drag-and-drop)
app.put('/api/sprints/:sprintId/tasks/:taskId/assignees', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { assignees } = req.body;
    if (!Array.isArray(assignees)) {
      return res.status(400).json({ error: 'assignees must be an array of user IDs' });
    }
    const task = await db.prepare('SELECT * FROM tasks WHERE task_id = ? AND sprint_id = ?').get(req.params.taskId, req.params.sprintId);
    if (!task) return res.status(404).json({ error: 'Task not found in this sprint' });

    // Update assignees_json and assigned_to (first assignee or 0)
    const assignedTo = assignees.length > 0 ? assignees[0] : task.assigned_to;
    await db.prepare('UPDATE tasks SET assignees_json = ?, assigned_to = ? WHERE task_id = ?')
      .run(JSON.stringify(assignees), assignedTo, req.params.taskId);

    // Also ensure all assignees are sprint members
    const insertMember = await db.prepare('INSERT INTO sprint_members (sprint_id, user_id) VALUES (?, ?) ON CONFLICT (sprint_id, user_id) DO NOTHING');
    for (const uid of assignees) {
      await insertMember.run(req.params.sprintId, uid);
    }

    res.json({ message: 'Assignees updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sprints/:sprintId
app.delete('/api/sprints/:sprintId', authMiddleware, managerOnly, async (req, res) => {
  try {
    const sprint = await db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(req.params.sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    if (['active', 'completed'].includes(sprint.status)) {
      return res.status(400).json({ error: 'Cannot delete an active or completed sprint.' });
    }

    const transaction = await db.transaction(async () => {
      // Delete subtasks for tasks in this sprint
      await db.prepare(`DELETE FROM subtasks WHERE task_id IN (SELECT task_id FROM tasks WHERE sprint_id = ?)`).run(req.params.sprintId);
      // Delete queries for tasks in this sprint
      await db.prepare(`DELETE FROM queries WHERE task_id IN (SELECT task_id FROM tasks WHERE sprint_id = ?)`).run(req.params.sprintId);
      await db.prepare('DELETE FROM tasks WHERE sprint_id = ?').run(req.params.sprintId);
      await db.prepare('DELETE FROM sprint_members WHERE sprint_id = ?').run(req.params.sprintId);
      await db.prepare('DELETE FROM notifications WHERE reference_id = ?').run(req.params.sprintId);
      await db.prepare('DELETE FROM sprints WHERE sprint_id = ?').run(req.params.sprintId);
    });

    await transaction();
    res.json({ message: 'Sprint deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sprints/:sprintId/requirements
app.get('/api/sprints/:sprintId/requirements', authMiddleware, async (req, res) => {
  try {
    const notes = await db.prepare('SELECT * FROM sprint_notes WHERE sprint_id = ? ORDER BY created_at ASC').all(req.params.sprintId);
    const attachments = await db.prepare('SELECT * FROM sprint_attachments WHERE sprint_id = ? ORDER BY created_at ASC').all(req.params.sprintId);
    
    res.json({ 
      notes: notes, 
      attachments: attachments.map(a => ({
        id: a.id,
        fileName: a.file_name,
        fileUrl: a.file_url,
        isExternal: a.is_external === 1,
        uploadedBy: a.uploaded_by,
        createdAt: a.created_at
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sprints/:sprintId/tasks/sync
app.post('/api/sprints/:sprintId/tasks/sync', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { sprintId } = req.params;
    console.log('req.body', req.body); const { tasksToAdd, tasksToRemove } = req.body;

    const transaction = await db.transaction(async () => {
      if (tasksToRemove && tasksToRemove.length > 0) {
        const removeStmt = await db.prepare('DELETE FROM tasks WHERE task_id = ? AND sprint_id = ?');
        const restoreBacklogStmt = await db.prepare('INSERT INTO project_tasks (task_id, project_id, title, priority, is_completed) VALUES (?, ?, ?, ?, 0)');
        for (const t of tasksToRemove) {
          const tId = t.task_id || t.taskId;
          await removeStmt.run(tId, sprintId);
          if (t.project_id) {
            await restoreBacklogStmt.run(tId, t.project_id, t.title || t.task_title || 'Untitled', t.priority || 'medium');
          }
        }
      }

      if (tasksToAdd && tasksToAdd.length > 0) {
        const insertStmt = await db.prepare(`
          INSERT INTO tasks (task_id, sprint_id, assigned_to, task_title, description, priority, status, created_by, project_id)
          VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?)
          ON CONFLICT (task_id) DO UPDATE SET sprint_id = EXCLUDED.sprint_id, project_id = EXCLUDED.project_id
        `);
        const removeBacklogStmt = await db.prepare('DELETE FROM project_tasks WHERE task_id = ? AND project_id = ?');
        console.log('tasksToAdd', tasksToAdd); 
        for (const t of tasksToAdd) {
          const tId = t.task_id || t.taskId;
          const pId = t.project_id || null;
          await insertStmt.run(
            tId,
            sprintId,
            null, // assigned_to is null by default
            t.title || t.task_title || 'Untitled',
            t.description || '',
            t.priority || 'medium',
            req.user.id,
            pId
          );
          if (pId) {
            await removeBacklogStmt.run(tId, pId);
          }
        }
      }
    });

    await transaction();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sprints/:sprintId/notes
app.post('/api/sprints/:sprintId/notes', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { title, content } = req.body;
    const info = await db.prepare(`
      INSERT INTO sprint_notes (sprint_id, title, content, created_by)
      VALUES (?, ?, ?, ?)
    `).run(req.params.sprintId, title, content || '', req.user.id);
    
    await notifySprintMembers(req.params.sprintId, req.user.id, 'sprint', 'New Note Added', `New requirement/note added to Sprint ${req.params.sprintId}: "${title}"`);
    
    res.json({ id: info.lastInsertRowid, message: 'Note added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sprints/:sprintId/notes/:noteId
app.delete('/api/sprints/:sprintId/notes/:noteId', authMiddleware, managerOnly, async (req, res) => {
  try {
    await db.prepare('DELETE FROM sprint_notes WHERE id = ? AND sprint_id = ?').run(req.params.noteId, req.params.sprintId);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sprints/:sprintId/attachments
app.post('/api/sprints/:sprintId/attachments', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { fileName, fileUrl, isExternal } = req.body;
    const info = await db.prepare(`
      INSERT INTO sprint_attachments (sprint_id, file_name, file_url, is_external, uploaded_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.sprintId, fileName, fileUrl, isExternal ? 1 : 0, req.user.id);
    
    await notifySprintMembers(req.params.sprintId, req.user.id, 'sprint', 'New Attachment Added', `New attachment added to Sprint ${req.params.sprintId}: "${fileName}"`);
    
    res.json({ id: info.lastInsertRowid, message: 'Attachment added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ══════════════════════════════════════════════════════════════════════════
// SPRINT REVIEW ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// POST /api/sprints/:sprintId/review/init (Any member can move to review)
app.post('/api/sprints/:sprintId/review/init', authMiddleware, async (req, res) => {
  try {
    const sprint = await db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(req.params.sprintId);
    if (!sprint || sprint.status !== 'active') {
      return res.status(400).json({ error: 'Sprint must be active to move to review' });
    }

    await db.transaction(async () => {
      // Update sprint status
      await db.prepare('UPDATE sprints SET status = ? WHERE sprint_id = ?').run('review', req.params.sprintId);
      
      // Initialize or reset review record
      await db.prepare(`
        INSERT INTO sprint_reviews (sprint_id, dod_met, qa_passed, stakeholder_signoff, return_reason, moved_to_review_at)
        VALUES (?, 0, 0, 0, '', NOW())
        ON CONFLICT(sprint_id) DO UPDATE SET
          dod_met = 0,
          qa_passed = 0,
          stakeholder_signoff = 0,
          return_reason = '',
          moved_to_review_at = NOW()
      `).run(req.params.sprintId);
    })();

    res.json({ message: 'Sprint moved to review successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sprints/:sprintId/review/checklist (Manager only)
app.put('/api/sprints/:sprintId/review/checklist', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { dodMet, qaPassed, stakeholderSignoff } = req.body;
    await db.prepare(`
      UPDATE sprint_reviews 
      SET dod_met = ?, qa_passed = ?, stakeholder_signoff = ? 
      WHERE sprint_id = ?
    `).run(dodMet ? 1 : 0, qaPassed ? 1 : 0, stakeholderSignoff ? 1 : 0, req.params.sprintId);
    res.json({ message: 'Checklist updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sprints/:sprintId/review/notes (Manager only)
app.put('/api/sprints/:sprintId/review/notes', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { notes } = req.body;
    await db.prepare(`
      UPDATE sprint_reviews 
      SET reviewer_notes = ?, notes_updated_at = NOW() 
      WHERE sprint_id = ?
    `).run(notes, req.params.sprintId);
    res.json({ message: 'Notes saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sprints/:sprintId/review/return (Manager only)
app.post('/api/sprints/:sprintId/review/return', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { returnReason } = req.body;
    if (!returnReason) return res.status(400).json({ error: 'Return reason is required' });

    await db.transaction(async () => {
      await db.prepare('UPDATE sprints SET status = ? WHERE sprint_id = ?').run('active', req.params.sprintId);
      await db.prepare('UPDATE sprint_reviews SET return_reason = ? WHERE sprint_id = ?').run(returnReason, req.params.sprintId);
    })();
    res.json({ message: 'Sprint returned to active' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sprints/:sprintId/review/complete (Manager only)
app.post('/api/sprints/:sprintId/review/complete', authMiddleware, managerOnly, async (req, res) => {
  try {
    const review = await db.prepare('SELECT * FROM sprint_reviews WHERE sprint_id = ?').get(req.params.sprintId);
    if (!review || !review.dod_met || !review.qa_passed || !review.stakeholder_signoff) {
      return res.status(400).json({ error: 'All checklist items must be completed before marking as completed' });
    }

    await db.prepare('UPDATE sprints SET status = ? WHERE sprint_id = ?').run('completed', req.params.sprintId);
    res.json({ message: 'Sprint marked as completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sprints/:sprintId/attachments/:attachmentId
app.delete('/api/sprints/:sprintId/attachments/:attachmentId', authMiddleware, managerOnly, async (req, res) => {
  try {
    await db.prepare('DELETE FROM sprint_attachments WHERE id = ? AND sprint_id = ?').run(req.params.attachmentId, req.params.sprintId);
    res.json({ message: 'Attachment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// EMPLOYEE DASHBOARD ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/employee/:userId/sprints
app.get('/api/employee/:userId/sprints', authMiddleware, async (req, res) => {
  try {
    const sprints = await db.prepare(`
      SELECT DISTINCT s.sprint_id, s.sprint_name, s.status, s.end_date, s.start_date
      FROM sprints s
      LEFT JOIN sprint_members sm ON s.sprint_id = sm.sprint_id AND sm.user_id = ?
      LEFT JOIN tasks t ON s.sprint_id = t.sprint_id AND t.assigned_to = ?
      WHERE sm.user_id = ? OR t.assigned_to = ?
      ORDER BY s.start_date DESC
    `).all(req.params.userId, req.params.userId, req.params.userId, req.params.userId);
    
    res.json(sprints.map(s => ({
      sprintId: s.sprint_id,
      sprintName: s.sprint_name,
      status: s.status,
      sprintEnd: s.end_date
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employee/:userId/sprint-stats/:sprintId
app.get('/api/employee/:userId/sprint-stats/:sprintId', authMiddleware, async (req, res) => {
  try {
    const { userId, sprintId } = req.params;
    const sprint = await db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    // Tasks for this employee in this sprint
    const tasks = await db.prepare('SELECT * FROM tasks WHERE sprint_id = ? AND assigned_to = ?').all(sprintId, userId);
    const taskIds = tasks.map(t => t.task_id);

    // Subtasks for these tasks
    let subtasks = [];
    if (taskIds.length > 0) {
      const placeholders = taskIds.map(() => '?').join(',');
      subtasks = await db.prepare(`SELECT * FROM subtasks WHERE task_id IN (${placeholders})`).all(...taskIds);
    }

    // Task Stats
    const totalTasks = tasks.length;
    const tasksDone = tasks.filter(t => t.status === 'done').length;
    
    const totalSpentHours = 0;
    const taskStatusBreakdown = {
      todo: tasks.filter(t => t.status === 'todo').length,
      inprogress: tasks.filter(t => t.status === 'inprogress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      done: tasks.filter(t => t.status === 'done').length
    };

    // Subtask Stats
    const totalSubtasks = subtasks.length;
    const subtasksDone = subtasks.filter(s => s.status === 'done').length;

    // Efficiency Score
    const efficiencyScore = 0;

    // Subtask Completion by Task
    const subtaskCompletion = tasks.map(t => {
      const taskSubtasks = subtasks.filter(s => s.task_id === t.task_id);
      return {
        taskTitle: t.task_title,
        total: taskSubtasks.length,
        done: taskSubtasks.filter(s => s.status === 'done').length,
        inprogress: taskSubtasks.filter(s => s.status === 'inprogress').length,
        todo: taskSubtasks.filter(s => s.status === 'todo').length,
        blocked: taskSubtasks.filter(s => s.status === 'blocked').length
      };
    });

    // Effort Tracker
    const effortTracker = tasks.map(t => ({
      taskTitle: t.task_title,
      actual: 0
    }));

    // Daily Activity & Burndown
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    let timerSessions = [];
    if (subtasks.length > 0) {
      const subtaskIds = subtasks.map(s => s.subtask_id);
      const placeholders = subtaskIds.map(() => '?').join(',');
      timerSessions = await db.prepare(`SELECT * FROM timer_sessions WHERE subtask_id IN (${placeholders}) AND employee_id = ?`).all(...subtaskIds, userId);
    }
    
    let hasTimerData = timerSessions.some(ts => ts.duration > 0);
    let distributedHours = 0;
    if (!hasTimerData && totalSpentHours > 0) {
      distributedHours = totalSpentHours / Math.min(totalDays, 5); 
    }

    const dailyActivity = [];
    const burndown = [];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = 'D' + (i + 1);

      let hoursLogged = 0;
      if (hasTimerData) {
        timerSessions.forEach(ts => {
          if (ts.start_time.startsWith(dateStr) && ts.duration) {
            hoursLogged += ts.duration / 3600;
          }
        });
      } else if (distributedHours > 0 && i < 5) {
         hoursLogged = (0.8 + Math.random() * 0.4) * distributedHours;
      }
      
      const idealRemaining = totalSubtasks - (totalSubtasks / (totalDays - 1)) * i;
      
      const subtasksCompletedByDate = subtasks.filter(s => {
        if (s.status !== 'done' || !s.completed_at) return false;
        const completedDateStr = s.completed_at.slice(0, 10);
        return completedDateStr <= dateStr;
      }).length;
      
      const todayStr = new Date().toISOString().slice(0, 10);
      const actualRemaining = dateStr > todayStr ? null : totalSubtasks - subtasksCompletedByDate;

      dailyActivity.push({
        day: dayLabel,
        date: dateStr,
        hours: Math.round(hoursLogged * 10) / 10
      });

      burndown.push({
        day: dayLabel,
        date: dateStr,
        ideal: Math.max(Math.round(idealRemaining * 10) / 10, 0),
        actual: Math.max(Math.round(actualRemaining * 10) / 10, 0)
      });
    }

    // Attendance Snapshot
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attendance = await db.prepare(`SELECT date, status FROM attendance WHERE user_id = ? AND date >= ? ORDER BY date ASC`).all(userId, thirtyDaysAgo.toISOString().slice(0, 10));

    // Upcoming Deadlines
    const upcomingTasks = tasks.filter(t => t.status !== 'done').map(t => ({
      id: t.task_id,
      title: t.task_title,
      type: 'Task',
      status: t.status,
      priority: t.priority
    }));
    const upcomingSubtasks = subtasks.filter(s => s.status !== 'done').map(s => ({
      id: s.subtask_id,
      title: s.subtask_title,
      type: 'Subtask',
      status: s.status,
      priority: s.priority
    }));
    const deadlines = [...upcomingTasks, ...upcomingSubtasks].sort((a, b) => {
      const pOrder = { critical: 1, high: 2, medium: 3, low: 4 };
      return pOrder[a.priority] - pOrder[b.priority];
    }).slice(0, 5);

    res.json({
      sprint: {
        sprintId: sprint.sprint_id,
        sprintName: sprint.sprint_name,
        status: sprint.status,
        start_date: sprint.start_date,
        end_date: sprint.end_date
      },
      totalTasks,
      tasksDone,
      totalEstHours,
      totalSpentHours,
      efficiencyScore,
      totalSubtasks,
      subtasksDone,
      taskStatusBreakdown,
      subtaskCompletion,
      effortTracker,
      dailyActivity,
      burndown,
      attendance,
      deadlines
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// TASK ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/tasks
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const { sprintId, assignedTo } = req.query;
    let query = `
      SELECT t.*, e.name as assigneeName, e.avatar_initials as assigneeInitials, e.team, e.sub_team as subTeam,
        s.allowed_statuses, s.sprint_name as sprintName, s.status as sprintStatus,
        (SELECT COUNT(*) FROM subtasks WHERE task_id = t.task_id) as subtaskCount,
        (SELECT COUNT(*) FROM subtasks WHERE task_id = t.task_id AND status = 'done') as subtaskDoneCount
      FROM tasks t
      JOIN employees e ON t.assigned_to = e.id
      JOIN sprints s ON t.sprint_id = s.sprint_id
    `;
    const params = [];
    const conditions = [];

    if (sprintId) { conditions.push('t.sprint_id = ?'); params.push(sprintId); }
    if (assignedTo) { 
      conditions.push('(t.assigned_to = ? OR (t.assignees_json IS NOT NULL AND t.assignees_json != \'\' AND t.assignees_json::jsonb @> ?::jsonb))'); 
      params.push(assignedTo, JSON.stringify([Number(assignedTo)])); 
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY t.id ASC';

    const tasks = await db.prepare(query).all(...params);

    let allSubtasks = [];
    if (req.query.includeSubtasks === 'true' && tasks.length > 0) {
      const taskIds = tasks.map(t => t.task_id);
      const placeholders = taskIds.map(() => '?').join(',');
      allSubtasks = await db.prepare(`
        SELECT s.*, e.name as creatorName
        FROM subtasks s
        LEFT JOIN employees e ON s.created_by = e.id
        WHERE s.task_id IN (${placeholders})
        ORDER BY s.id ASC
      `).all(...taskIds);
    }

    res.json(tasks.map(t => {
      const tSubtasks = allSubtasks.filter(s => s.task_id === t.task_id).map(s => ({
        id: s.id,
        subtaskId: s.subtask_id,
        taskId: s.task_id,
        title: s.subtask_title,
        description: s.description,
        priority: s.priority,
        status: s.status,
        createdBy: s.created_by,
        creatorName: s.creatorname
      }));
      
      return {
        id: t.id,
        taskId: t.task_id,
        sprintId: t.sprint_id,
        assignedTo: t.assigned_to,
        assigneeName: t.assigneename || t.assigneeName,
        assigneeInitials: t.assigneeinitials || t.assigneeInitials,
        team: t.team,
        subTeam: t.subteam || t.subTeam,
        title: t.task_title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        
        createdBy: t.created_by,
        subtaskCount: t.subtaskcount !== undefined ? Number(t.subtaskcount) : t.subtaskCount,
        subtaskDoneCount: t.subtaskdonecount !== undefined ? Number(t.subtaskdonecount) : t.subtaskDoneCount,
        completionPct: (t.subtaskcount > 0 || t.subtaskCount > 0) ? Math.round(((t.subtaskdonecount || t.subtaskDoneCount) / (t.subtaskcount || t.subtaskCount)) * 100) : 0,
        sprintName: t.sprintname || t.sprintName,
        sprintStatus: t.sprintstatus || t.sprintStatus,
        allowedStatuses: JSON.parse(t.allowed_statuses || '["todo", "inprogress", "done", "blocked", "failed"]'),
        ...(req.query.includeSubtasks === 'true' && { subtasksList: tSubtasks })
      };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/employee/:userId
app.get('/api/tasks/employee/:userId', authMiddleware, async (req, res) => {
  try {
    const tasks = await db.prepare(`
      SELECT t.*, s.sprint_name as sprintName, s.status as sprintStatus, s.start_date as sprintStart, s.end_date as sprintEnd, s.allowed_statuses,
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
      
      subtaskCount: t.subtaskCount,
      subtaskDoneCount: t.subtaskDoneCount,
      completionPct: t.subtaskCount > 0 ? Math.round((t.subtaskDoneCount / t.subtaskCount) * 100) : 0,
      allowedStatuses: JSON.parse(t.allowed_statuses || '["todo", "inprogress", "done", "blocked", "failed"]')
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:taskId
app.get('/api/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const task = await db.prepare(`
      SELECT t.*, e.name as assigneeName, e.avatar_initials as assigneeInitials
      FROM tasks t
      JOIN employees e ON t.assigned_to = e.id
      WHERE t.task_id = ?
    `).get(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const subtasks = await db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY id ASC').all(req.params.taskId);
    const queries = await db.prepare(`
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
      
      subtasks: subtasks.map(s => ({
        id: s.id,
        subtaskId: s.subtask_id,
        title: s.subtask_title,
        description: s.description,
        priority: s.priority,
        status: s.status})),
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
// ==========================================
// PROJECTS API
// ==========================================

// GET /api/projects
app.get('/api/projects', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT p.*, 
             COUNT(t.id) as total_tasks,
             SUM(CASE WHEN t.is_completed = 1 THEN 1 ELSE 0 END) as completed_tasks
      FROM projects p
      LEFT JOIN project_tasks t ON p.project_id = t.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    const projects = await db.prepare(query).all();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:projectId
app.get('/api/projects/:projectId', authMiddleware, async (req, res) => {
  try {
    const project = await db.prepare('SELECT * FROM projects WHERE project_id = ?').get(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const tasks = await db.prepare(`
      SELECT t.* 
      FROM project_tasks t
      LEFT JOIN tasks st ON t.task_id = st.task_id
      WHERE t.project_id = ? AND st.task_id IS NULL
      ORDER BY t.is_completed ASC, t.created_at DESC
    `).all(req.params.projectId);
    res.json({ ...project, tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
app.post('/api/projects', authMiddleware, async (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'administrator') {
     return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { title, start_date, end_date, description } = req.body;
    
    if (!title || !start_date || !end_date) {
      return res.status(400).json({ error: 'Title, start date, and end date are required.' });
    }

    const projectId = 'PRJ-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    await db.prepare(`
      INSERT INTO projects (project_id, title, start_date, end_date, description) 
      VALUES (?, ?, ?, ?, ?)
    `).run(projectId, title, start_date, end_date, description || '');
    
    const newProject = await db.prepare('SELECT * FROM projects WHERE project_id = ?').get(projectId);
    res.status(201).json(newProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:projectId
app.put('/api/projects/:projectId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'administrator') {
     return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { title, start_date, end_date, description } = req.body;
    
    if (!title || !start_date || !end_date) {
      return res.status(400).json({ error: 'Title, start date, and end date are required.' });
    }

    const existingProject = await db.prepare('SELECT * FROM projects WHERE project_id = ?').get(req.params.projectId);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await db.prepare(`
      UPDATE projects 
      SET title = ?, start_date = ?, end_date = ?, description = ?
      WHERE project_id = ?
    `).run(title, start_date, end_date, description || '', req.params.projectId);
    
    const updatedProject = await db.prepare('SELECT * FROM projects WHERE project_id = ?').get(req.params.projectId);
    res.status(200).json(updatedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:projectId
app.delete('/api/projects/:projectId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'administrator') {
     return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    await db.prepare('DELETE FROM project_tasks WHERE project_id = ?').run(req.params.projectId);
    const result = await db.prepare('DELETE FROM projects WHERE project_id = ?').run(req.params.projectId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/tasks
app.post('/api/projects/:projectId/tasks', authMiddleware, async (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'administrator') {
     return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { title, priority } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const taskId = 'PT-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    await db.prepare(`
      INSERT INTO project_tasks (task_id, project_id, title, priority)
      VALUES (?, ?, ?, ?)
    `).run(taskId, req.params.projectId, title, priority || 'medium');
    
    const newTask = await db.prepare('SELECT * FROM project_tasks WHERE task_id = ?').get(taskId);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/tasks/:taskId/status
app.patch('/api/projects/tasks/:taskId/status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'administrator') {
     return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { is_completed } = req.body;
    await db.prepare('UPDATE project_tasks SET is_completed = ?, updated_at = CURRENT_TIMESTAMP WHERE task_id = ?').run(is_completed ? 1 : 0, req.params.taskId);
    res.json({ message: 'Task status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/tasks/:taskId/priority
app.patch('/api/projects/tasks/:taskId/priority', authMiddleware, async (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'administrator') {
     return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { priority } = req.body;
    await db.prepare('UPDATE project_tasks SET priority = ? WHERE task_id = ?').run(priority, req.params.taskId);
    res.json({ message: 'Task priority updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/tasks/:taskId/title
app.patch('/api/projects/tasks/:taskId/title', authMiddleware, async (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'administrator') {
     return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { title } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    await db.prepare('UPDATE project_tasks SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE task_id = ?').run(title.trim(), req.params.taskId);
    res.json({ message: 'Task title updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/tasks/:taskId
app.delete('/api/projects/tasks/:taskId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'administrator') {
     return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    await db.prepare('DELETE FROM project_tasks WHERE task_id = ?').run(req.params.taskId);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
app.post('/api/tasks', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { sprintId, assignedTo, title, description, priority, estimatedHours } = req.body;
    if (!sprintId || !assignedTo || !title) {
      return res.status(400).json({ error: 'Sprint ID, assigned employee, and title are required.' });
    }

    const taskId = await generateTaskId();
    await db.prepare(`
      INSERT INTO tasks (task_id, sprint_id, assigned_to, task_title, description, priority, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?)
    `).run(taskId, sprintId, assignedTo, title, description || '', priority || 'medium', estimatedHours || 0, req.user.id);

    // Notify assignee
    await createNotification({
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
app.put('/api/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const task = await db.prepare('SELECT * FROM tasks WHERE task_id = ?').get(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { title, description, priority, estimatedHours, spentHours } = req.body;
    const updates = [];
    const values = [];

    if (title !== undefined) { updates.push('task_title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    
    

    if (updates.length === 0) return res.status(400).json({ error: 'No valid updates.' });

    values.push(req.params.taskId);
    await db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE task_id = ?`).run(...values);

    if (task.assigned_to && task.assigned_to !== req.user.id) {
      await createNotification({
        recipientId: task.assigned_to,
        senderId: req.user.id,
        type: 'task',
        title: 'Task Updated',
        message: `Your task "${title || task.task_title}" in Sprint ${task.sprint_id} has been updated.`,
        referenceId: req.params.taskId
      });
    }

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:taskId/status
app.patch('/api/tasks/:taskId/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'inprogress', 'blocked', 'done', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const task = await db.prepare(`
      SELECT t.*, s.created_by as managerId
      FROM tasks t
      JOIN sprints s ON t.sprint_id = s.sprint_id
      WHERE t.task_id = ?
    `).get(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await db.prepare('UPDATE tasks SET status = ? WHERE task_id = ?').run(status, req.params.taskId);

    // Notify manager on blocked
    if (status === 'blocked' && task.managerId) {
      const assignee = await db.prepare('SELECT name FROM employees WHERE id = ?').get(task.assigned_to);
      await createNotification({
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
      const assignee = await db.prepare('SELECT name FROM employees WHERE id = ?').get(task.assigned_to);
      await createNotification({
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
app.get('/api/subtasks/task/:taskId', authMiddleware, async (req, res) => {
  try {
    const subtasks = await db.prepare(`
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
      
      createdBy: s.created_by,
      creatorName: s.creatorName
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subtasks
app.post('/api/subtasks', authMiddleware, async (req, res) => {
  try {
    const { taskId, title, description, priority, estimatedHours } = req.body;
    if (!taskId || !title) {
      return res.status(400).json({ error: 'Task ID and title are required.' });
    }

    // Check sprint is in planner mode
    const task = await db.prepare(`
      SELECT t.*, s.status as sprintStatus, s.created_by as managerId
      FROM tasks t
      JOIN sprints s ON t.sprint_id = s.sprint_id
      WHERE t.task_id = ?
    `).get(taskId);

    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.sprintStatus === 'active') {
      return res.status(400).json({ error: 'Subtask creation is locked. Sprint is now Active.' });
    }

    const subtaskId = await generateSubtaskId();
    await db.prepare(`
      INSERT INTO subtasks (subtask_id, task_id, created_by, subtask_title, description, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(subtaskId, taskId, req.user.id, title, description || '', priority || 'medium');

    // Notify manager
    if (task.managerId) {
      await createNotification({
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
app.patch('/api/subtasks/:subtaskId/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'inprogress', 'blocked', 'done', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const subtask = await db.prepare(`
      SELECT st.*, t.assigned_to, t.task_title, t.sprint_id, s.created_by as managerId
      FROM subtasks st
      JOIN tasks t ON st.task_id = t.task_id
      JOIN sprints s ON t.sprint_id = s.sprint_id
      WHERE st.subtask_id = ?
    `).get(req.params.subtaskId);

    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    if (status === 'done') {
      await db.prepare('UPDATE subtasks SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE subtask_id = ?').run(status, req.params.subtaskId);
    } else {
      await db.prepare('UPDATE subtasks SET status = ?, completed_at = NULL WHERE subtask_id = ?').run(status, req.params.subtaskId);
    }

    // Notify manager on blocked
    if (status === 'blocked' && subtask.managerId) {
      const user = await db.prepare('SELECT name FROM employees WHERE id = ?').get(subtask.assigned_to);
      await createNotification({
        recipientId: subtask.managerId,
        senderId: subtask.assigned_to,
        type: 'blocked',
        title: 'Subtask Blocked',
        message: `${user.name} flagged subtask "${subtask.subtask_title}" as Blocked in "${subtask.task_title}".`,
        referenceId: subtask.task_id
      });
    }

    // Notify manager on completion if ALL subtasks are done
    if (status === 'done' && subtask.managerId) {
      const allSubtasks = await db.prepare('SELECT status FROM subtasks WHERE task_id = ?').all(subtask.task_id);
      const allDone = allSubtasks.every(s => s.status === 'done');
      
      if (allDone) {
        const user = await db.prepare('SELECT name FROM employees WHERE id = ?').get(subtask.assigned_to);
        const sprint = await db.prepare('SELECT sprint_name FROM sprints WHERE sprint_id = ?').get(subtask.sprint_id);
        
        await createNotification({
          recipientId: subtask.managerId,
          senderId: subtask.assigned_to,
          type: 'task',
          title: 'Task Completed',
          message: `${user ? user.name : 'Employee'} has completed all subtasks for '${subtask.task_title}' in '${sprint ? sprint.sprint_name : 'Sprint'}'.`,
          referenceId: subtask.task_id
        });
      }
    }

    res.json({ message: `Subtask status updated to "${status}"` });
  } catch (err) {
    require('fs').appendFileSync('debug.log', err.message + '\n' + err.stack + '\n');
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/subtasks/:subtaskId
app.put('/api/subtasks/:subtaskId', authMiddleware, async (req, res) => {
  try {
    const subtask = await db.prepare('SELECT * FROM subtasks WHERE subtask_id = ?').get(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    const { title, description, priority, estimatedHours, spentHours } = req.body;
    const updates = [];
    const values = [];

    if (title !== undefined) { updates.push('subtask_title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    
    

    if (updates.length === 0) return res.status(400).json({ error: 'No valid updates.' });

    values.push(req.params.subtaskId);
    await db.prepare(`UPDATE subtasks SET ${updates.join(', ')} WHERE subtask_id = ?`).run(...values);

    res.json({ message: 'Subtask updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/subtasks/:subtaskId
app.delete('/api/subtasks/:subtaskId', authMiddleware, async (req, res) => {
  try {
    const subtask = await db.prepare('SELECT * FROM subtasks WHERE subtask_id = ?').get(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    await db.prepare('DELETE FROM subtasks WHERE subtask_id = ?').run(req.params.subtaskId);
    res.json({ message: 'Subtask deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════
// QUERY ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/queries/task/:taskId
app.get('/api/queries/task/:taskId', authMiddleware, async (req, res) => {
  try {
    const queries = await db.prepare(`
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
app.post('/api/queries', authMiddleware, async (req, res) => {
  try {
    const { taskId, queryText } = req.body;
    if (!taskId || !queryText) {
      return res.status(400).json({ error: 'Task ID and query text are required.' });
    }

    const task = await db.prepare(`
      SELECT t.*, s.created_by as managerId
      FROM tasks t
      JOIN sprints s ON t.sprint_id = s.sprint_id
      WHERE t.task_id = ?
    `).get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const queryId = await generateQueryId();
    await db.prepare(`
      INSERT INTO queries (query_id, task_id, raised_by, query_text)
      VALUES (?, ?, ?, ?)
    `).run(queryId, taskId, req.user.id, queryText);

    // Notify manager
    if (task.managerId) {
      await createNotification({
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
app.put('/api/queries/:queryId/reply', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { replyText } = req.body;
    if (!replyText) return res.status(400).json({ error: 'Reply text is required.' });

    const query = await db.prepare('SELECT * FROM queries WHERE query_id = ?').get(req.params.queryId);
    if (!query) return res.status(404).json({ error: 'Query not found' });

    await db.prepare(`
      UPDATE queries SET reply_text = ?, replied_by = ?, status = 'resolved', resolved_at = NOW()
      WHERE query_id = ?
    `).run(replyText, req.user.id, req.params.queryId);

    // Notify the query raiser
    await createNotification({
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

// DELETE /api/leaves/:id
app.delete('/api/leaves/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.prepare('DELETE FROM leaves WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Leave not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leaves
app.get('/api/leaves', authMiddleware, managerOrAdmin, async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    let query = `
      SELECT l.*, e.name as "employeeName", e.avatar_initials as "employeeInitials", e.team, e.sub_team as "subTeam",
             e.role, e.department, m.name as "managerName"
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN employees m ON l.manager_id = m.id
    `;
    const conditions = [];
    const params = [];

    if (req.user.role === 'manager') {
      conditions.push('l.manager_id = ?');
      params.push(req.user.id);
    }

    if (status && status !== 'all') { conditions.push('l.status = ?'); params.push(status); }
    if (employeeId) { conditions.push('l.employee_id = ?'); params.push(employeeId); }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY l.applied_at DESC';

    const leaves = await db.prepare(query).all(...params);

    res.json(leaves.map(l => ({
      id: l.id,
      employeeId: l.employee_id,
      employeeName: l.employeeName,
      employeeInitials: l.employeeInitials,
      role: l.role,
      department: l.department,
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
      managerRemark: l.manager_remark,
      appliedAt: l.applied_at,
      decidedAt: l.decided_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leaves/employee/:id
app.get('/api/leaves/employee/:id', authMiddleware, async (req, res) => {
  try {
    const leaves = await db.prepare(`
      SELECT l.*, m.name as "managerName"
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
      managerRemark: l.manager_remark,
      appliedAt: l.applied_at,
      decidedAt: l.decided_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leaves
app.post('/api/leaves', authMiddleware, async (req, res) => {
  try {
    const { managerId, leaveType, startDate, endDate, reason } = req.body;
    if (!managerId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Start date and end date must be valid dates.' });
    }
    if (end < start) {
      return res.status(400).json({ error: 'End date must be on or after start date.' });
    }

    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check if leave falls during an active sprint
    const activeSprint = await db.prepare(`
      SELECT sprint_id FROM sprints
      WHERE status = 'active' AND start_date <= ? AND end_date >= ?
    `).get(endDate, startDate);

    await db.prepare(`
      INSERT INTO leaves (employee_id, manager_id, sprint_id, leave_type, start_date, end_date, duration_days, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, managerId, activeSprint ? activeSprint.sprint_id : null, leaveType, startDate, endDate, durationDays, reason);

    // Notify manager
    await createNotification({
      recipientId: managerId,
      senderId: req.user.id,
      type: 'leave',
      title: 'Leave Request',
      message: `${req.user.name} applied for ${leaveType} leave from ${startDate} to ${endDate} (${durationDays} days).`,
      referenceId: null
    });

    // Notify all admins (if they are not the manager)
    const admins = await db.prepare("SELECT id FROM employees WHERE role = 'administrator'").all();
    for (const admin of admins) {
      if (admin.id.toString() !== managerId.toString()) {
        await createNotification({
          recipientId: admin.id,
          senderId: req.user.id,
          type: 'leave',
          title: 'Leave Request',
          message: `${req.user.name} applied for ${leaveType} leave from ${startDate} to ${endDate} (${durationDays} days).`,
          referenceId: null
        });
      }
    }

    // Notify employee (confirmation)
    await createNotification({
      recipientId: req.user.id,
      senderId: null,
      type: 'leave',
      title: 'Leave Request Submitted',
      message: `Your leave request from ${startDate} to ${endDate} has been submitted.`,
      referenceId: null
    });

    res.status(201).json({ message: 'Leave request submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/leaves/:id/accept
app.patch('/api/leaves/:id/accept', authMiddleware, managerOrAdmin, async (req, res) => {
  try {
    const { manager_remark } = req.body;
    const leave = await db.prepare('SELECT * FROM leaves WHERE id = ?').get(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    if (req.user.role === 'manager' && leave.manager_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only accept leave requests assigned to you.' });
    }

    await db.prepare("UPDATE leaves SET status = 'accepted', manager_remark = ?, decided_at = NOW() WHERE id = ?").run(manager_remark || null, req.params.id);

    await createNotification({
      recipientId: leave.employee_id,
      senderId: req.user.id,
      type: 'leave',
      title: 'Leave Accepted',
      message: `Your ${leave.leave_type} leave request for ${leave.start_date} to ${leave.end_date} has been accepted.${manager_remark ? ' Note: ' + manager_remark : ''}`,
      referenceId: req.params.id.toString()
    });

    res.json({ message: 'Leave accepted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/leaves/:id/reject
app.patch('/api/leaves/:id/reject', authMiddleware, managerOrAdmin, async (req, res) => {
  try {
    const { manager_remark } = req.body;
    const leave = await db.prepare('SELECT * FROM leaves WHERE id = ?').get(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    if (req.user.role === 'manager' && leave.manager_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only reject leave requests assigned to you.' });
    }

    await db.prepare("UPDATE leaves SET status = 'rejected', manager_remark = ?, decided_at = NOW() WHERE id = ?").run(manager_remark || null, req.params.id);

    await createNotification({
      recipientId: leave.employee_id,
      senderId: req.user.id,
      type: 'leave',
      title: 'Leave Rejected',
      message: `Your ${leave.leave_type} leave request for ${leave.start_date} to ${leave.end_date} has been rejected.${manager_remark ? ' Reason: ' + manager_remark : ''}`,
      referenceId: req.params.id.toString()
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
app.get('/api/notifications/unread-count', authMiddleware, async (req, res) => {
  try {
    const result = await db.prepare('SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0').get(req.user.id);
    res.json({ count: result.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read
app.patch('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/read-all
app.patch('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await db.prepare('UPDATE notifications SET is_read = 1 WHERE recipient_id = ?').run(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// REPORT ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/reports/sprint/:sprintId
app.get('/api/reports/sprint/:sprintId', authMiddleware, async (req, res) => {
  try {
    const sprint = await db.prepare('SELECT * FROM sprints WHERE sprint_id = ?').get(req.params.sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const tasks = await db.prepare(`
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
      const subtasks = await db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(t.task_id);
      emp.tasks.push({
        taskId: t.task_id,
        title: t.task_title,
        status: t.status,
        
        subtasks: subtasks.map(s => ({
          title: s.subtask_title,
          status: s.status}))
      });
    }

    const workload = Object.entries(byEmployee).map(([id, emp]) => ({
      employeeId: parseInt(id),
      name: emp.name,
      team: emp.team,
      subTeam: emp.subTeam,
      tasksAssigned: emp.tasks.length,
      tasksCompleted: emp.done,
      tasksBlocked: emp.blocked,
      
      completionRate: emp.tasks.length > 0 ? Math.round((emp.done / emp.tasks.length) * 100) : 0,
      estimationAccuracy: emp.totalEst > 0 ? Math.round((1 - Math.abs(emp.totalEst - emp.totalSpent) / emp.totalEst) * 100) : 0,
      tasks: emp.tasks
    }));

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    
    const totalSpent = 0;

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



// GET /api/reports/velocity — Sprint velocity trend
app.get('/api/reports/velocity', authMiddleware, async (req, res) => {
  try {
    const sprints = await db.prepare(`
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
app.get('/api/reports/estimation-accuracy', authMiddleware, async (req, res) => {
  try {
    const { sprintId } = req.query;
    let taskQuery = `
      SELECT t.assigned_to, e.name,
        SUM(t.) as totalEst,
        0 as totalSpent
      FROM tasks t
      JOIN employees e ON t.assigned_to = e.id
    `;
    const params = [];
    if (sprintId) {
      taskQuery += ' WHERE t.sprint_id = ?';
      params.push(sprintId);
    }
    taskQuery += ' GROUP BY t.assigned_to ORDER BY e.name';

    const employees = await db.prepare(taskQuery).all(...params);

    res.json(employees.map(e => ({
      employeeId: e.assigned_to,
      name: e.name,
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
app.post('/api/sprint-members', authMiddleware, managerOnly, async (req, res) => {
  try {
    const { sprintId, userId, role, estimatedHours, taskTitle, taskDescription, taskPriority } = req.body;
    if (!sprintId || !userId) {
      return res.status(400).json({ error: 'Sprint ID and user ID are required.' });
    }

    // Check if already a member
    const existing = await db.prepare('SELECT id FROM sprint_members WHERE sprint_id = ? AND user_id = ?').get(sprintId, userId);
    if (existing) return res.status(400).json({ error: 'User is already a member of this sprint.' });

    await db.prepare(`
      INSERT INTO sprint_members (sprint_id, user_id, role)
      VALUES (?, ?, ?, ?)
    `).run(sprintId, userId, role || '', estimatedHours || 0);

    // Create task if title provided
    if (taskTitle) {
      const taskId = await generateTaskId();
      await db.prepare(`
        INSERT INTO tasks (task_id, sprint_id, assigned_to, task_title, description, priority, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?)
      `).run(taskId, sprintId, userId, taskTitle, taskDescription || '', taskPriority || 'medium', estimatedHours || 0, req.user.id);
    }

    // Notify
    const sprint = await db.prepare('SELECT sprint_name FROM sprints WHERE sprint_id = ?').get(sprintId);
    await createNotification({
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
app.delete('/api/sprint-members/:sprintId/:userId', authMiddleware, managerOnly, async (req, res) => {
  try {
    await db.prepare('DELETE FROM sprint_members WHERE sprint_id = ? AND user_id = ?').run(req.params.sprintId, req.params.userId);
    
    await createNotification({
      recipientId: req.params.userId,
      senderId: req.user.id,
      type: 'sprint',
      title: 'Removed from Sprint',
      message: `You have been removed from Sprint ${req.params.sprintId}.`,
      referenceId: req.params.sprintId
    });

    res.json({ message: 'Member removed from sprint' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// NOTIFICATION & LEAVE ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/notifications
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await db.prepare(`
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
app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await db.prepare('UPDATE notifications SET is_read = 1 WHERE recipient_id = ?').run(req.user.id);
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications/unread-count
app.get('/api/notifications/unread-count', authMiddleware, async (req, res) => {
  try {
    const result = await db.prepare(`
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
app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const info = await db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Marked as read', info });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/read-batch
app.put('/api/notifications/read-batch', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (ids && ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      const info = await db.prepare(`UPDATE notifications SET is_read = 1 WHERE recipient_id = ? AND id IN (${placeholders})`).run(req.user.id, ...ids);
      res.json({ message: 'Batch marked as read', info });
    } else {
      res.status(400).json({ error: 'No notification IDs provided' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications
app.delete('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body; // Array of IDs to delete
    if (ids && ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      await db.prepare(`DELETE FROM notifications WHERE recipient_id = ? AND id IN (${placeholders})`).run(req.user.id, ...ids);
    } else {
      // If no IDs provided, maybe delete all? Or just return error
      return res.status(400).json({ error: 'No notification IDs provided' });
    }
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ATTENDANCE API
// ══════════════════════════════════════════════════════════════════════════

// GET /api/attendance/today
app.get('/api/attendance/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const log = await db.prepare('SELECT * FROM attendance_logs WHERE user_id = ? AND date = ?').get(req.user.id, today);
    res.json(log || { checked_in: false });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance status' });
  }
});

// POST /api/attendance/check-in
app.post('/api/attendance/check-in', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = await db.prepare('SELECT id FROM attendance_logs WHERE user_id = ? AND date = ?').get(req.user.id, today);
    
    if (existing) {
      return res.status(400).json({ error: 'Already checked in today' });
    }
    
    await db.prepare('INSERT INTO attendance_logs (user_id, date, check_in_time) VALUES (?, ?, CURRENT_TIMESTAMP)').run(req.user.id, today);
    res.json({ message: 'Checked in successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// POST /api/attendance/check-out
app.post('/api/attendance/check-out', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = await db.prepare('SELECT * FROM attendance_logs WHERE user_id = ? AND date = ?').get(req.user.id, today);
    
    if (!existing) {
      return res.status(400).json({ error: 'Not checked in today' });
    }
    if (existing.check_out_time) {
      return res.status(400).json({ error: 'Already checked out today' });
    }
    
    await db.prepare('UPDATE attendance_logs SET check_out_time = CURRENT_TIMESTAMP WHERE id = ?').run(existing.id);
    res.json({ message: 'Checked out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Check-out failed' });
  }
});

// GET /api/attendance/logs
app.get('/api/attendance/logs', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (req.user.role === 'employee') {
      const logs = await db.prepare('SELECT * FROM attendance_logs WHERE user_id = ? ORDER BY date DESC').all(req.user.id);
      return res.json(logs);
    }
    
    if (userId) {
      const logs = await db.prepare('SELECT * FROM attendance_logs WHERE user_id = ? ORDER BY date DESC').all(userId);
      return res.json(logs);
    }
    
    // For Managers/Admins without specific userId, return all logs joined with employee data
    const logs = await db.prepare(`
      SELECT a.*, e.name, e.email 
      FROM attendance_logs a
      JOIN employees e ON a.user_id = e.id
      ORDER BY a.date DESC, a.check_in_time DESC
    `).all();
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance logs' });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// REMINDERS API
// ══════════════════════════════════════════════════════════════════════════

// GET /api/reminders
app.get('/api/reminders', authMiddleware, async (req, res) => {
  try {
    const reminders = await db.prepare('SELECT * FROM calendar_reminders WHERE user_id = ? ORDER BY reminder_date ASC').all(req.user.id);
    res.json(reminders);
  } catch (err) {
    console.error('Error fetching reminders:', err);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// POST /api/reminders
app.post('/api/reminders', authMiddleware, async (req, res) => {
  try {
    const { title, description, reminder_date } = req.body;
    if (!title || !reminder_date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }
    await db.prepare('INSERT INTO calendar_reminders (user_id, title, description, reminder_date) VALUES (?, ?, ?, ?)').run(req.user.id, title, description, reminder_date);
    res.status(201).json({ message: 'Reminder created successfully' });
  } catch (err) {
    console.error('Error creating reminder:', err);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// DELETE /api/reminders/:id
app.delete('/api/reminders/:id', authMiddleware, async (req, res) => {
  try {
    await db.prepare('DELETE FROM calendar_reminders WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Reminder deleted successfully' });
  } catch (err) {
    console.error('Error deleting reminder:', err);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// GET /api/settings/notifications
app.get('/api/settings/notifications', authMiddleware, async (req, res) => {
  try {
    let settings = await db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);
    if (!settings) {
      await db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(req.user.id);
      settings = await db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/notifications
app.put('/api/settings/notifications', authMiddleware, async (req, res) => {
  try {
    const { notify_queries, notify_leaves, notify_sprints, notify_system, delivery_inapp, delivery_email } = req.body;
    await db.prepare(`
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
// ATTENDANCE ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════




// ══════════════════════════════════════════════════════════════════════════
// REPORTS & ANALYTICS (EXCEL EXPORTS)
// ══════════════════════════════════════════════════════════════════════════

function setupExcelSheet(workbook, sheetName, columns) {
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns;
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  return sheet;
}

function applyStatusColor(cell, status) {
  const s = (status || '').toString().toLowerCase();
  if (s === 'done' || s === 'completed') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
  } else if (s === 'inprogress' || s === 'active') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } };
  } else if (s === 'blocked') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
  } else if (s === 'todo' || s === 'created' || s === 'planner') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  }
}

function applyEfficiencyColor(cell, score) {
  if (score >= 110) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
  } else if (score >= 90) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
  } else if (score >= 70) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } };
  } else {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
  }
}

require('./report_generator')(app, db, authMiddleware);

app.get('/api/reports/employee/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  
  // Security check
  if (req.user.id.toString() !== userId && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    // 1. Sprints
    const sprints = await db.prepare(`
      SELECT s.* 
      FROM sprints s 
      JOIN sprint_members sm ON s.sprint_id = sm.sprint_id 
      WHERE sm.user_id = ?
      ORDER BY s.id DESC
    `).all(userId);

    // 2. Tasks
    const tasks = await db.prepare('SELECT * FROM tasks WHERE assigned_to = ?').all(userId);
    const taskIds = tasks.map(t => t.task_id);

    // 3. Subtasks
    let subtasks = [];
    if (taskIds.length > 0) {
      const placeholders = taskIds.map(() => '?').join(',');
      subtasks = await db.prepare(`SELECT * FROM subtasks WHERE task_id IN (${placeholders})`).all(...taskIds);
    }

    // 4. Timer Sessions (Actual Hours)
    // We also aggregate timer sessions for the user directly
    const timers = await db.prepare('SELECT * FROM timer_sessions WHERE employee_id = ?').all(userId);

    // Build Response Object
    res.json({
      sprints,
      tasks,
      subtasks,
      timers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch employee progress report' });
  }
});



// ══════════════════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ══════════════════════════════════════════════════════════════════════════
app.use((err, req, res, _next) => {
  console.error(`  [ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ══════════════════════════════════════════════════════════════════════════
// BACKGROUND WORKER (Timers & Deadlines)
// ══════════════════════════════════════════════════════════════════════════// ── ADMIN API ─────────────────────────────────────────────────────────────

app.get('/api/admin/dashboard', authMiddleware, adminOnly, async (req, res) => {
  try {
    const empRow = await db.prepare("SELECT COUNT(*) as count FROM employees WHERE role = 'employee'").get();
    const totalEmployees = parseInt(empRow.count, 10) || 0;
    
    const mgrRow = await db.prepare("SELECT COUNT(*) as count FROM employees WHERE role = 'manager'").get();
    const totalManagers = parseInt(mgrRow.count, 10) || 0;
    
    const tsRow = await db.prepare("SELECT COUNT(*) as count FROM sprints").get();
    const totalSprints = parseInt(tsRow.count, 10) || 0;
    
    const asRow = await db.prepare("SELECT COUNT(*) as count FROM sprints WHERE status = 'active'").get();
    const activeSprints = parseInt(asRow.count, 10) || 0;
    
    const csRow = await db.prepare("SELECT COUNT(*) as count FROM sprints WHERE status = 'completed'").get();
    const completedSprints = parseInt(csRow.count, 10) || 0;
    
    const ttRow = await db.prepare("SELECT COUNT(*) as count FROM tasks").get();
    const totalTasks = parseInt(ttRow.count, 10) || 0;
    
    // Departments distribution
    const departmentDist = await db.prepare("SELECT department as name, COUNT(*) as value FROM employees GROUP BY department").all();
    
    // Sprint status distribution
    const sprintStatusDist = await db.prepare("SELECT status as name, COUNT(*) as value FROM sprints GROUP BY status").all();

    res.json({
      totalEmployees,
      totalManagers,
      totalSprints,
      activeSprints,
      completedSprints,
      totalTasks,
      departmentDist,
      sprintStatusDist
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await db.prepare("SELECT id, name, email, team, sub_team, role, department, created_at FROM employees WHERE role != 'administrator'").all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  const { name, email, password, role, team, sub_team, department } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }
  
  try {
    const existing = await db.prepare('SELECT 1 FROM employees WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    const stmt = await db.prepare(`
      INSERT INTO employees (name, email, password, role, team, sub_team, department)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = await stmt.run(name, email, password, role, team || '', sub_team || '', department || '');
    
    res.status(201).json({ id: info.lastInsertRowid, message: 'User created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Background worker
setInterval(async () => {
  try {
    const now = Date.now();
    const activeSprints = await db.prepare("SELECT * FROM sprints WHERE status = 'active'").all();
    
    for (const sprint of activeSprints) {
      const endDate = new Date(sprint.end_date + 'T23:59:59Z').getTime();
      const timeRemaining = endDate - now;

      if (timeRemaining <= 0) {
        const existing = await db.prepare("SELECT 1 FROM notifications WHERE type = 'sprint' AND reference_id = ? AND title LIKE '%Overdue%'").get(sprint.sprint_id);
        if (!existing) {
          await createNotification({
            recipientId: sprint.created_by,
            type: 'sprint',
            title: 'Sprint Overdue',
            message: `Sprint "${sprint.sprint_name}" has reached its end date. Mark as Completed or extend the deadline.`,
            referenceId: sprint.sprint_id
          });
        }
      } else if (timeRemaining <= 24 * 60 * 60 * 1000) {
        const existing = await db.prepare("SELECT 1 FROM notifications WHERE type = 'sprint' AND reference_id = ? AND title LIKE '%Ends in 24%'").get(sprint.sprint_id);
        if (!existing) {
          const members = await db.prepare("SELECT user_id FROM sprint_members WHERE sprint_id = ?").all(sprint.sprint_id);
          const recipients = new Set([...members.map(m => m.user_id), sprint.created_by]);
          for (const uid of recipients) {
            await createNotification({
              recipientId: uid,
              type: 'sprint',
              title: 'Sprint Ends in 24 Hours',
              message: `Sprint "${sprint.sprint_name}" ends in less than 24 hours.`,
              referenceId: sprint.sprint_id
            });
          }
        }
      }
    }

    const activeTimers = await db.prepare("SELECT * FROM timer_sessions WHERE end_time IS NULL").all();
    for (const t of activeTimers) {
      const elapsedHours = (now - new Date(t.start_time).getTime()) / (1000 * 60 * 60);
      if (elapsedHours >= 8) {
        const existing = await db.prepare("SELECT 1 FROM notifications WHERE type = 'subtask' AND reference_id = ? AND title LIKE '%Timer Running%' AND date(created_at) = CURRENT_DATE").get(t.subtask_id);
        if (!existing) {
          const subtask = await db.prepare("SELECT subtask_title FROM subtasks WHERE subtask_id = ?").get(t.subtask_id);
          await createNotification({
            recipientId: t.employee_id,
            type: 'subtask',
            title: 'Timer Running Too Long?',
            message: `Your timer for "${subtask?.subtask_title || t.subtask_id}" has been running for over 8 hours. Did you forget to stop it?`,
            referenceId: t.subtask_id
          });
        }
      }
    }

  } catch (err) {
    console.error("Background worker error:", err);
  }
}, 5 * 60 * 1000);

// ── Serve Frontend in Production ──────────────────────────────────────────
// When deployed, the frontend build is served by the backend
app.use(express.static(path.join(__dirname, 'client', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// ── Start Server ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n  Nokia Sprint Management Platform');
  console.log('  ═════════════════════════════════');
  console.log(`  Server:    http://localhost:${PORT}`);
  console.log(`  Database:  ${DB_PATH}`);
  console.log('  Status:    Ready\n');
});
