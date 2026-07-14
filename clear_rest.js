const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db'
});

async function clearRemaining() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Clearing remaining data...');
    // Add all the newly discovered tables to truncate, except system configs
    await client.query(`
      TRUNCATE TABLE 
        projects, 
        project_tasks, 
        backlog_items, 
        calendar_reminders, 
        attendance_logs, 
        audit_logs, 
        user_settings
      CASCADE
    `);
    
    await client.query('COMMIT');
    console.log('All remaining tables truncated successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error clearing data:', err);
  } finally {
    client.release();
    pool.end();
  }
}

clearRemaining();
