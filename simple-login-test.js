const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing admin login...');
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    });
    
    console.log('Login response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Login successful!');
      console.log('Token:', response.data.data.token.substring(0, 20) + '...');
    } else {
      console.log('❌ Login failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data || error.message);
  }
}

testLogin();