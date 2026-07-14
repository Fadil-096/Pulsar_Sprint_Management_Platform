const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db' });
pool.query('SELECT sprint_id, sprint_name, status FROM sprints WHERE sprint_name ILIKE \'%Testing - 012%\'').then(res => {
  console.log('Sprint:', res.rows);
  process.exit(0);
}).catch(console.error);
