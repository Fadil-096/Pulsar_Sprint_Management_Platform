const fs = require('fs');

const endpointCode = `
app.get('/api/reports/employee/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  
  // Security check
  if (req.user.id.toString() !== userId && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    // 1. Sprints
    const sprints = db.prepare(\`
      SELECT s.* 
      FROM sprints s 
      JOIN sprint_members sm ON s.sprint_id = sm.sprint_id 
      WHERE sm.user_id = ?
      ORDER BY s.id DESC
    \`).all(userId);

    // 2. Tasks
    const tasks = db.prepare('SELECT * FROM tasks WHERE assigned_to = ?').all(userId);
    const taskIds = tasks.map(t => t.task_id);

    // 3. Subtasks
    let subtasks = [];
    if (taskIds.length > 0) {
      const placeholders = taskIds.map(() => '?').join(',');
      subtasks = db.prepare(\`SELECT * FROM subtasks WHERE task_id IN (\${placeholders})\`).all(...taskIds);
    }

    // 4. Timer Sessions (Actual Hours)
    // We also aggregate timer sessions for the user directly
    const timers = db.prepare('SELECT * FROM timer_sessions WHERE employee_id = ?').all(userId);

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
`;

let serverCode = fs.readFileSync('server.js', 'utf8');

if (!serverCode.includes('/api/reports/employee/:userId')) {
  const attachPoint = '// ══════════════════════════════════════════════════════════════════════════\n// SPA FALLBACK';
  serverCode = serverCode.replace(attachPoint, endpointCode + '\n' + attachPoint);
  fs.writeFileSync('server.js', serverCode);
  console.log("Updated server.js");
} else {
  console.log("Endpoint already exists.");
}
