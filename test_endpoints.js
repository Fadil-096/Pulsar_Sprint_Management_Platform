const http = require('http');

const endpoints = [
  '/api/sprints',
  '/api/tasks',
  '/api/employees',
  '/api/leaves',
  '/api/backlog',
  '/api/projects',
  '/api/queries',
  '/api/notifications',
  '/api/users',
  '/api/dashboard/stats',
  '/api/system/settings'
];

async function runTests() {
  console.log('Logging in as admin...');
  const loginData = JSON.stringify({ email: 'admin@nokia.com', password: 'admin123', role: 'administrator' });
  
  const token = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data).token);
        } else {
          reject(new Error(`Login failed with status ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  console.log('Login successful. Token acquired. Testing endpoints...\n');
  let hasErrors = false;

  for (const endpoint of endpoints) {
    const success = await new Promise(resolve => {
      http.get({
        hostname: 'localhost',
        port: 3000,
        path: endpoint,
        headers: { 'Authorization': `Bearer ${token}` }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 500) {
            console.error(`❌ FAIL: ${endpoint} -> ${res.statusCode}`);
            console.error(data);
            resolve(false);
          } else {
            console.log(`✅ PASS: ${endpoint} -> ${res.statusCode}`);
            resolve(true);
          }
        });
      }).on('error', (err) => {
        console.error(`❌ ERROR: ${endpoint} -> ${err.message}`);
        resolve(false);
      });
    });
    if (!success) hasErrors = true;
  }

  if (hasErrors) {
    console.error('\nTests completed with failures.');
    process.exit(1);
  } else {
    console.log('\nAll endpoints passed successfully.');
  }
}

runTests().catch(console.error);
