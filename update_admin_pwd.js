const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db' });

pool.query("UPDATE employees SET password = 'NokiaAdmin@2026!' WHERE email = 'admin@nokia.com'")
  .then(() => { 
    console.log('Password updated successfully'); 
    pool.end(); 
  })
  .catch(e => console.error(e));
