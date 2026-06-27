const fs = require('fs');

async function test() {
  try {
    const creds = fs.readFileSync('./public/credentials.txt', 'utf8');
    const managerEmail = creds.split('\n').find(l => l.includes('Manager')).match(/Email: (.*) \|/)[1].trim();

    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: managerEmail,
        password: 'password123',
        role: 'manager'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    if (!token) {
      console.log('Login failed:', loginData);
      return;
    }

    const statsRes = await fetch('http://localhost:3000/api/team/stats?timeRange=this_month', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const statsText = await statsRes.text();
    console.log('Status Code:', statsRes.status);
    console.log(statsText.slice(0, 500) + '...');
  } catch (err) {
    console.error(err);
  }
}
test();
