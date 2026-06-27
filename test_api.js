async function test() {
  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aditya.patel@nokia.com',
        password: 'nokia@123',
        role: 'employee'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Logged in, token:", token.substring(0, 10) + '...');

    const todayRes = await fetch('http://localhost:3000/api/attendance/today', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Today status:", todayRes.status);
    const text = await todayRes.text();
    console.log("Today text:", text.substring(0, 50));

  } catch (err) {
    console.error("Error:", err);
  }
}

test();
