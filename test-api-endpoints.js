const axios = require('axios');

async function testAPIEndpoints() {
  const baseURL = 'http://localhost:8080/api';
  
  console.log('🚀 Testing Article System API Endpoints...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log(`✅ Health check: ${healthResponse.data.status}`);

    // Test 2: Get Articles (should work without auth)
    console.log('\n2. Testing Get Articles...');
    const articlesResponse = await axios.get(`${baseURL}/articles`);
    console.log(`✅ Articles endpoint: ${articlesResponse.status} - Found ${articlesResponse.data.data?.length || 0} articles`);

    // Test 3: Get Breaking News
    console.log('\n3. Testing Breaking News...');
    const breakingResponse = await axios.get(`${baseURL}/articles/breaking`);
    console.log(`✅ Breaking news: ${breakingResponse.status} - Found ${breakingResponse.data.data?.length || 0} breaking articles`);

    // Test 4: Get Featured Articles
    console.log('\n4. Testing Featured Articles...');
    const featuredResponse = await axios.get(`${baseURL}/articles/featured`);
    console.log(`✅ Featured articles: ${featuredResponse.status} - Found ${featuredResponse.data.data?.length || 0} featured articles`);

    // Test 5: Get Authors
    console.log('\n5. Testing Authors...');
    const authorsResponse = await axios.get(`${baseURL}/authors`);
    console.log(`✅ Authors endpoint: ${authorsResponse.status} - Found ${authorsResponse.data.data?.length || 0} authors`);

    console.log('\n🎉 All API endpoints are working!');
    console.log('\n📊 Summary:');
    console.log('✅ Health Check - Working');
    console.log('✅ Articles Listing - Working');
    console.log('✅ Breaking News - Working');
    console.log('✅ Featured Articles - Working');
    console.log('✅ Authors Listing - Working');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running. Please start the server first with: npm run dev');
    } else {
      console.error('❌ API test failed:', error.response?.data || error.message);
    }
  }
}

testAPIEndpoints();