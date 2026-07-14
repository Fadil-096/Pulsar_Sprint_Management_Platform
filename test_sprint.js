const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db' });
pool.query(`
      SELECT DISTINCT s.sprint_id, s.sprint_name, s.status, s.end_date, s.start_date
      FROM sprints s
      LEFT JOIN sprint_members sm ON s.sprint_id = sm.sprint_id AND sm.user_id = $1
      LEFT JOIN tasks t ON s.sprint_id = t.sprint_id AND t.assigned_to = $2
      WHERE sm.user_id = $3 OR t.assigned_to = $4
      ORDER BY s.start_date DESC
`, [2, 2, 2, 2]).then(res => {
  console.log('Sprints:', res.rows);
  process.exit(0);
}).catch(console.error);
