const axios = require('axios');

async function testLogin() {
  const baseUrl = 'http://localhost:4000/api';

  const testCredentials = [
    { identifier: 'demo.user@fitrack.test', password: 'DemoUser123!' },
    { identifier: 'maazyounas@gmail.com', password: 'Maazyounas@123' },
    { identifier: 'ahmed.khan@fitrack.dev', password: 'DemoUser@123' },
  ];

  console.log('\n🔍 Testing login endpoint...\n');
  console.log(`API Base URL: ${baseUrl}`);
  console.log(`Backend should be running on localhost:4000\n`);

  for (const cred of testCredentials) {
    try {
      console.log(`Testing: ${cred.identifier}`);
      const response = await axios.post(`${baseUrl}/auth/login`, {
        identifier: cred.identifier,
        password: cred.password,
      });
      console.log(`✅ SUCCESS! Response:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.log(`❌ FAILED - Status: ${error.response.status}`);
        console.log(`   Error: ${JSON.stringify(error.response.data)}`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`❌ Cannot connect to backend at localhost:4000`);
        console.log(`   Make sure backend is running: cd backend && npm run dev`);
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    console.log('');
  }
}

testLogin();
