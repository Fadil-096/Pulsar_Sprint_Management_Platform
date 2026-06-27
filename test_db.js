const sqlite3 = require('better-sqlite3');
const path = require('path');
const db = new sqlite3(path.join(__dirname, 'db', 'nokia_sprint.db'));

// Let's directly execute the query from server.js to see if it returns metrics
try {
    const timeRange = 'this_month';
    let dateCondition = '';
    let params = [];
    let attCondition = '';
    let attParams = [];

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    dateCondition = 'AND created_at >= ? AND created_at <= ?';
    params.push(`${start} 00:00:00`, `${end} 23:59:59`);
    attCondition = 'AND date >= ? AND date <= ?';
    attParams.push(start, end);

    // 1. Get all employees
    const employees = db.prepare(`SELECT id, name, email, role, avatar_initials as initials, department, team, sub_team as subTeam FROM employees`).all();
    console.log(`Found ${employees.length} employees`);

    // 2. Gather task metrics
    const tasksQuery = `
      SELECT assigned_to, status, estimated_hours, spent_hours
      FROM tasks 
      WHERE 1=1 ${dateCondition}
    `;
    const tasks = db.prepare(tasksQuery).all(...params);
    console.log(`Found ${tasks.length} tasks`);

    // 3. Gather attendance metrics
    const attendance = db.prepare(`SELECT user_id, status FROM attendance WHERE 1=1 ${attCondition}`).all(...attParams);

    // 4. Gather active sprints
    const activeSprints = db.prepare(`
      SELECT sm.user_id, s.sprint_id, s.sprint_name, s.status 
      FROM sprint_members sm
      JOIN sprints s ON sm.sprint_id = s.sprint_id
      WHERE s.status IN ('active')
    `).all();

    // Map data
    const result = employees.map(emp => {
      const empTasks = tasks.filter(t => t.assigned_to === emp.id);
      const totalTasks = empTasks.length;
      const tasksDone = empTasks.filter(t => t.status === 'done').length;
      const totalEstHours = empTasks.reduce((sum, t) => sum + t.estimated_hours, 0);
      const totalSpentHours = empTasks.reduce((sum, t) => sum + t.spent_hours, 0);

      const empAtt = attendance.filter(a => a.user_id === emp.id);
      const present = empAtt.filter(a => a.status === 'Present' || a.status === 'Half-Day' || a.status === 'Late').length;
      const absent = empAtt.filter(a => a.status === 'Absent').length;

      const empSprints = activeSprints
        .filter(s => s.user_id === emp.id)
        .map(s => ({ id: s.sprint_id, name: s.sprint_name, status: s.status }));

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
        attendance: {
          present,
          absent,
          total: empAtt.length
        },
        activeSprints: empSprints
      };
    });

    console.log("Sample employee result:", JSON.stringify(result[0], null, 2));

} catch (err) {
    console.error("Error:", err);
}
