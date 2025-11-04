const axios = require('axios');

const PRODUCTION_URL = 'https://web-production-af44.up.railway.app/api';

async function debugBreakingNewsProduction() {
  console.log('🔍 DEBUGGING BREAKING NEWS ON PRODUCTION');
  console.log('========================================\n');

  try {
    // Test breaking news endpoints
    console.log('1. Testing breaking news endpoints...\n');
    
    try {
      const activeBreaking = await axios.get(`${PRODUCTION_URL}/breaking-news/active`, { timeout: 10000 });
      console.log('✅ Active breaking news endpoint: Working');
      console.log(`   Response: ${JSON.stringify(activeBreaking.data)}`);
    } catch (error) {
      console.log('❌ Active breaking news endpoint: Failed');
      console.log(`   Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    try {
      const allBreaking = await axios.get(`${PRODUCTION_URL}/breaking-news`, { timeout: 10000 });
      console.log('✅ All breaking news endpoint: Working');
      console.log(`   Response: ${JSON.stringify(allBreaking.data)}`);
    } catch (error) {
      console.log('❌ All breaking news endpoint: Failed');
      console.log(`   Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Test with authentication
    console.log('\n2. Testing with admin authentication...\n');
    
    const loginResponse = await axios.post(`${PRODUCTION_URL}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    }, { timeout: 10000 });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      const headers = { Authorization: `Bearer ${token}` };
      
      try {
        const createBreaking = await axios.post(`${PRODUCTION_URL}/breaking-news`, {
          text: 'Test breaking news from production debug',
          isActive: true
        }, { headers, timeout: 10000 });
        
        console.log('✅ Create breaking news: Working');
        console.log(`   Created: ${createBreaking.data.news?.text || 'Unknown'}`);
      } catch (error) {
        console.log('❌ Create breaking news: Failed');
        console.log(`   Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugBreakingNewsProduction();