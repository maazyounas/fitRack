async function testFlow() {
  try {
    const baseUrl = 'http://localhost:4000/api';

    console.log('3. Logging in...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'scripttest2@test.com',
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    console.log('Login response:', loginData);
  } catch (error) {
    console.error('Error:', error);
  }
}

testFlow();
