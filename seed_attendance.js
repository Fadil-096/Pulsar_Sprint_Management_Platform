const { Pool } = require('pg');

class PGStatement {
  constructor(pool, sql) {
    this.pool = pool;
    this.sql = sql;
  }
  
  _convert(sql) {
    let i = 1;
    return sql.replace(/\?/g, () => '$' + (i++));
  }
  
  async get(...params) {
    let flatParams = Array.isArray(params[0]) ? params[0] : params;
    if (params.length === 1 && Array.isArray(params[0])) flatParams = params[0];
    else flatParams = params;
    
    const res = await this.pool.query(this._convert(this.sql), flatParams);
    return res.rows[0] || undefined;
  }

  async all(...params) {
    let flatParams = Array.isArray(params[0]) ? params[0] : params;
    if (params.length === 1 && Array.isArray(params[0])) flatParams = params[0];
    else flatParams = params;
    
    const res = await this.pool.query(this._convert(this.sql), flatParams);
    return res.rows;
  }

  async run(...params) {
    let flatParams = Array.isArray(params[0]) ? params[0] : params;
    if (params.length === 1 && Array.isArray(params[0])) flatParams = params[0];
    else flatParams = params;
    
    const res = await this.pool.query(this._convert(this.sql), flatParams);
    return { changes: res.rowCount, lastInsertRowid: null };
  }
}

class PGDatabaseWrapper {
  constructor(config) {
    this.pool = new Pool(config);
  }
  prepare(sql) {
    return new PGStatement(this.pool, sql);
  }
}

const DB_PATH = 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db';
const db = new PGDatabaseWrapper({ connectionString: DB_PATH });

async function seed() {
  try {
    const employees = await db.prepare("SELECT id FROM employees WHERE role = 'employee' OR role = 'manager'").all();
    console.log(`Found ${employees.length} employees to seed attendance for.`);

    const today = new Date();
    let count = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      // Skip weekends
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      
      const dateStr = d.toISOString().split('T')[0];
      
      for (const emp of employees) {
        // Randomize check in time between 8:30 and 9:30 AM
        const checkInHour = 8;
        const checkInMinute = Math.floor(Math.random() * 60) + 30; // 30 to 89
        const inH = checkInHour + Math.floor(checkInMinute / 60);
        const inM = checkInMinute % 60;
        
        const checkInTime = new Date(d);
        checkInTime.setHours(inH, inM, 0, 0);

        // Randomize check out time between 4:30 and 6:00 PM (16:30 to 18:00)
        const outH = 16 + Math.floor(Math.random() * 2);
        const outM = Math.floor(Math.random() * 60);
        const checkOutTime = new Date(d);
        checkOutTime.setHours(outH, outM, 0, 0);

        // Randomly skip some days to make it realistic
        if (Math.random() > 0.9) continue;

        // Ensure no duplicate entry
        const existing = await db.prepare('SELECT id FROM attendance_logs WHERE user_id = ? AND date = ?').get(emp.id, dateStr);
        
        if (!existing) {
          // If it's today and random says so, maybe they haven't checked out yet
          let finalOutTime = checkOutTime.toISOString();
          if (i === 0 && Math.random() > 0.5) {
            finalOutTime = null; // Still checked in
          }

          await db.prepare('INSERT INTO attendance_logs (user_id, date, check_in_time, check_out_time) VALUES (?, ?, ?, ?)').run(
            emp.id,
            dateStr,
            checkInTime.toISOString(),
            finalOutTime
          );
          count++;
        }
      }
    }
    
    console.log(`Successfully inserted ${count} synthetic attendance records!`);
  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

seed();
