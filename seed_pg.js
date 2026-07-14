const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db'
});

const users = [
  { name: 'Fadil', email: 'fadil@arc.com', role: 'administrator', team: 'Administration' },
  { name: 'Shane', email: 'shane@arc.com', role: 'manager', team: 'Development' },
  { name: 'Shivansh', email: 'shivansh@arc.com', role: 'manager', team: 'Development' },
  { name: 'Medha', email: 'medha@arc.com', role: 'employee', team: 'Development' },
  { name: 'Jakkula', email: 'jakkula@arc.com', role: 'employee', team: 'Development' },
  { name: 'Divi', email: 'divi@arc.com', role: 'employee', team: 'Development' },
  { name: 'Parangi', email: 'parangi@arc.com', role: 'employee', team: 'Development' },
  { name: 'Vaish', email: 'vaish@arc.com', role: 'employee', team: 'Development' },
  { name: 'Ruchitanshi', email: 'ruchitanshi@arc.com', role: 'employee', team: 'Development' },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Clear all data
    console.log('Clearing data...');
    await client.query('TRUNCATE TABLE timer_sessions, sprint_reviews, sprint_attachments, sprint_notes, notifications, leaves, queries, subtasks, tasks, sprint_members, sprints, employees CASCADE');

    console.log('Inserting real users...');
    for (const u of users) {
      const initials = u.name.substring(0, 2).toUpperCase();
      await client.query(
        `INSERT INTO employees (name, email, team, password, role, department, avatar_initials) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [u.name, u.email, u.team, 'arc@123', u.role, 'Engineering', initials]
      );
    }
    
    await client.query('COMMIT');
    console.log('Database seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding data:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
