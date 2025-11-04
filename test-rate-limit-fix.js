const axios = require('axios');

async function testRateLimitFix() {
  console.log('🔧 Testing Rate Limit Fix...\n');

  const railwayURL = 'https://web-production-af44.up.railway.app/api';
  
  try {
    // Test multiple rapid requests to simulate frontend behavior
    console.log('1. Testing multiple rapid requests...');
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.get(`${railwayURL}/articles`).catch(error => ({
          error: true,
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        }))
      );
    }
    
    const results = await Promise.all(promises);
    
    const successful = results.filter(r => !r.error).length;
    const rateLimited = results.filter(r => r.error && r.status === 429).length;
    const otherErrors = results.filter(r => r.error && r.status !== 429).length;
    
    console.log(`✅ Successful requests: ${successful}/10`);
    console.log(`❌ Rate limited (429): ${rateLimited}/10`);
    console.log(`⚠️ Other errors: ${otherErrors}/10`);
    
    if (rateLimited === 0) {
      console.log('🎉 Rate limiting issue appears to be fixed!');
    } else {
      console.log('⚠️ Still experiencing rate limiting issues');
    }

    // Test settings endpoint specifically
    console.log('\n2. Testing settings endpoint...');
    try {
      const settingsResponse = await axios.get(`${railwayURL}/settings`);
      console.log('✅ Settings endpoint working');
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('❌ Settings endpoint still rate limited');
      } else {
        console.log('❌ Settings endpoint error:', error.response?.status);
      }
    }

    // Test categories endpoint
    console.log('\n3. Testing categories endpoint...');
    try {
      const categoriesResponse = await axios.get(`${railwayURL}/categories`);
      console.log(`✅ Categories endpoint working: ${categoriesResponse.data.data.length} categories`);
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('❌ Categories endpoint still rate limited');
      } else {
        console.log('❌ Categories endpoint error:', error.response?.status);
      }
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Deploy the updated backend to Railway');
    console.log('2. Clear frontend browser cache');
    console.log('3. Test the frontend again');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRateLimitFix();