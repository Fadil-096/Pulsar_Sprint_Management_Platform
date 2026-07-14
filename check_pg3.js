const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db' });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subtasks'").then(res => console.log('subtasks', res.rows)).catch(console.error);
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'").then(res => { console.log('notifications', res.rows); pool.end(); }).catch(console.error);
