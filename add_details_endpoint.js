const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'server.js');
let content = fs.readFileSync(file, 'utf8');

const newEndpoint = `
// GET /api/team/employee/:id/details
app.get('/api/team/employee/:id/details', authMiddleware, managerOnly, (req, res) => {
  try {
    const empId = req.params.id;
    
    // 1. User Info
    const employee = db.prepare('SELECT id, name, email, role, avatar_initials as initials, department, team, sub_team as subTeam FROM employees WHERE id = ?').get(empId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    // 2. Attendance (Current Month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const attendance = db.prepare('SELECT date, status FROM attendance WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC').all(empId, startOfMonth, endOfMonth);
    const attStats = { present: 0, absent: 0, onLeave: 0 };
    attendance.forEach(a => {
      if (a.status === 'Present') attStats.present++;
      else if (a.status === 'Absent') attStats.absent++;
      else attStats.onLeave++;
    });

    // 3. Active Sprints & Tasks
    const activeSprints = db.prepare(\`
      SELECT s.sprint_id, s.sprint_name 
      FROM sprint_members sm
      JOIN sprints s ON sm.sprint_id = s.sprint_id
      WHERE sm.user_id = ? AND s.status = 'active'
    \`).all(empId);

    const activeSprintIds = activeSprints.map(s => s.sprint_id);
    let sprintTasks = [];
    if (activeSprintIds.length > 0) {
      sprintTasks = db.prepare(\`
        SELECT task_id, task_title, status, priority, estimated_hours
        FROM tasks 
        WHERE assigned_to = ? AND sprint_id IN (\${activeSprintIds.map(() => '?').join(',')})
        ORDER BY created_at DESC
      \`).all(empId, ...activeSprintIds);
    }

    // 4. All Tasks Metrics (Lifetime or active)
    const allTasks = db.prepare('SELECT status FROM tasks WHERE assigned_to = ?').all(empId);
    const metrics = {
      totalTasks: allTasks.length,
      tasksDone: allTasks.filter(t => t.status === 'done').length
    };

    // 5. Recent Activity
    const activities = [];
    
    // Tasks created/assigned
    const recentTasks = db.prepare('SELECT task_title, created_at FROM tasks WHERE assigned_to = ? ORDER BY created_at DESC LIMIT 5').all(empId);
    recentTasks.forEach(t => activities.push({ action: \`Assigned task "\${t.task_title}"\`, timestamp: t.created_at }));

    // Leaves
    const recentLeaves = db.prepare('SELECT leave_type, status, applied_at FROM leaves WHERE employee_id = ? ORDER BY applied_at DESC LIMIT 5').all(empId);
    recentLeaves.forEach(l => activities.push({ action: \`Applied for \${l.leave_type} leave (\${l.status})\`, timestamp: l.applied_at }));

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

`;

content = content.replace('// GET /api/users/:id — Single user', newEndpoint + '// GET /api/users/:id — Single user');

fs.writeFileSync(file, content);
console.log('server.js updated with new details endpoint');
