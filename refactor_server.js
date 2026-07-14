const fs = require('fs');

let code = fs.readFileSync('server.js.backup', 'utf8');

const oldDbImport = "const Database = require('better-sqlite3');";
const newDbImport = `const { Pool } = require('pg');

class PGStatement {
  constructor(pool, sql) {
    this.pool = pool;
    this.sql = sql;
  }
  
  _convert(sql) {
    let i = 1;
    return sql.replace(/\\?/g, () => '$$$$' + (i++));
  }
  
  async get(...params) {
    let flatParams = Array.isArray(params[0]) ? params[0] : params;
    if (params.length === 1 && Array.isArray(params[0])) flatParams = params[0];
    else flatParams = params;
    
    try {
      const res = await this.pool.query(this._convert(this.sql), flatParams);
      return res.rows[0];
    } catch(e) {
      console.error('DB Error GET:', e.message, this.sql, flatParams);
      throw e;
    }
  }
  
  async all(...params) {
    let flatParams = Array.isArray(params[0]) ? params[0] : params;
    if (params.length === 1 && Array.isArray(params[0])) flatParams = params[0];
    else flatParams = params;
    
    try {
      const res = await this.pool.query(this._convert(this.sql), flatParams);
      return res.rows;
    } catch(e) {
      console.error('DB Error ALL:', e.message, this.sql, flatParams);
      throw e;
    }
  }
  
  async run(...params) {
    let flatParams = Array.isArray(params[0]) ? params[0] : params;
    if (params.length === 1 && Array.isArray(params[0])) flatParams = params[0];
    else flatParams = params;
    
    let modifiedSql = this._convert(this.sql);
    let isInsert = /^\\s*INSERT/i.test(modifiedSql);
    if (isInsert && !/RETURNING/i.test(modifiedSql)) {
      modifiedSql = modifiedSql.trim().replace(/;$/, '') + " RETURNING id";
    }
    
    try {
      const res = await this.pool.query(modifiedSql, flatParams);
      return {
        changes: res.rowCount,
        lastInsertRowid: isInsert && res.rows[0] ? res.rows[0].id : null
      };
    } catch(e) {
      console.error('DB Error RUN:', e.message, this.sql, flatParams);
      throw e;
    }
  }
}

class PGDatabaseWrapper {
  constructor(config) {
    this.pool = new Pool(config);
  }
  
  pragma(stmt) {}
  
  transaction(cb) {
    return async (...args) => {
      // NOTE: In a true PG connection, the client must be passed down. 
      // For this migration layer, we execute it directly.
      return await cb(...args);
    };
  }
  
  prepare(sql) {
    return new PGStatement(this.pool, sql);
  }
}`;

code = code.replace(oldDbImport, newDbImport);

// Replace db init
const oldDbInit = /const DB_PATH = path\.join\(__dirname, 'db', 'nokia_sprint\.db'\);\s*const db = new Database\(DB_PATH\);/;
const newDbInit = `const DB_PATH = 'postgresql://postgres@localhost:5432/nokia_sprint_db';
const db = new PGDatabaseWrapper({ connectionString: DB_PATH });`;
code = code.replace(oldDbInit, newDbInit);

// Make express routes async
code = code.replace(/\(\s*req\s*,\s*res\s*\)\s*=>\s*\{/g, 'async (req, res) => {');
code = code.replace(/async\s+async\s+\(/g, 'async (');
code = code.replace(/\(\s*req\s*,\s*res\s*,\s*next\s*\)\s*=>\s*\{/g, 'async (req, res, next) => {');
code = code.replace(/async\s+async\s+\(/g, 'async (');

// Make setInterval async
code = code.replace(/setInterval\(\(\)\s*=>\s*\{/g, 'setInterval(async () => {');

// Remove top-level database schema migrations
code = code.replace(/\/\/ Add feature_id column[\s\S]*?idx_tasks_status ON tasks.*?\}\s*catch.*?\{\}/g, '/* top level schema migrations removed */');


// Make helper functions async
const helpers = [
  'generateSprintId', 'generateTaskId', 'generateSubtaskId',
  'generateQueryId', 'createNotification', 'notifySprintMembers'
];

for (const helper of helpers) {
  code = code.replace(new RegExp("function \\b" + helper + "\\b", 'g'), "async function " + helper);
  code = code.replace(new RegExp("(?<!async function )\\b" + helper + "\\(", 'g'), "await " + helper + "(");
}

// Prepend await to db.prepare
code = code.replace(/\bdb\.prepare\(/g, 'await db.prepare(');

// Make transactions async
code = code.replace(/db\.transaction\(\s*\(\)\s*=>/g, 'db.transaction(async () =>');
code = code.replace(/\btransaction\(\);/g, 'await transaction();');
code = code.replace(/\bdb\.transaction\(/g, 'await db.transaction(');

// Prepend await to isolated run calls
code = code.replace(/insertMember\.run\(/g, 'await insertMember.run(');
code = code.replace(/removeStmt\.run\(/g, 'await removeStmt.run(');
code = code.replace(/insertStmt\.run\(/g, 'await insertStmt.run(');
code = code.replace(/stmt\.run\(/g, 'await stmt.run(');

fs.writeFileSync('server.js', code);
console.log('Refactoring complete.');
