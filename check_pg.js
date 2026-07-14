const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'nokiasprint',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subtasks'").then(res => console.log('subtasks', res.rows)).catch(console.error);
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'").then(res => console.log('notifications', res.rows)).catch(console.error);
