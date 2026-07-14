require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subtasks'").then(res => console.log('subtasks', res.rows)).catch(console.error);
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'").then(res => { console.log('notifications', res.rows); pool.end(); }).catch(console.error);
