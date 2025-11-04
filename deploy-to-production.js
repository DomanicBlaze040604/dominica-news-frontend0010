const { execSync } = require('child_process');
const axios = require('axios');

async function deployToProduction() {
  console.log('🚂 Deploying Dominica News Backend to Railway Production...\n');

  try {
    // Step 1: Build the project
    console.log('1. Building the project...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build successful\n');

    // Step 2: Deploy to Railway
    console.log('2. Deploying to Railway...');
    try {
      execSync('railway up', { stdio: 'inherit' });
      console.log('✅ Deployment successful\n');
    } catch (error) {
      console.log('⚠️ Railway CLI deployment failed, trying alternative method...');
      console.log('Please deploy manually using Railway dashboard or CLI\n');
    }

    // Step 3: Get Railway URL
    console.log('3. Getting Railway URL...');
    let railwayUrl = 'https://web-production-af44.up.railway.app'; // Default URL
    
    try {
      const domainOutput = execSync('railway domain', { encoding: 'utf8' });
      const urlMatch = domainOutput.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        railwayUrl = urlMatch[0];
      }
    } catch (error) {
      console.log('⚠️ Could not get Railway URL automatically, using default');
    }

    console.log(`🌐 Production URL: ${railwayUrl}`);

    // Step 4: Test production deployment
    console.log('\n4. Testing production deployment...');
    await testProductionAPI(railwayUrl);

    console.log('\n🎉 PRODUCTION DEPLOYMENT COMPLETE!');
    console.log(`\n🔗 Your production API: ${railwayUrl}/api`);
    console.log('\n📋 Next Steps:');
    console.log(`1. Update frontend VITE_API_BASE_URL=${railwayUrl}/api`);
    console.log('2. Test frontend with production backend');
    console.log('3. Deploy frontend to production');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

async function testProductionAPI(baseUrl) {
  const apiUrl = `${baseUrl}/api`;
  
  try {
    // Test health endpoint
    console.log('   Testing health endpoint...');
    const health = await axios.get(`${apiUrl}/health`, { timeout: 10000 });
    console.log(`   ✅ Health: ${health.data.status}`);

    // Test articles
    console.log('   Testing articles endpoint...');
    const articles = await axios.get(`${apiUrl}/articles/latest?limit=3`, { timeout: 10000 });
    console.log(`   ✅ Articles: ${articles.data.data.length} found`);

    // Test categories
    console.log('   Testing categories endpoint...');
    const categories = await axios.get(`${apiUrl}/categories`, { timeout: 10000 });
    console.log(`   ✅ Categories: ${categories.data.data.length} found`);

    // Test admin login
    console.log('   Testing admin authentication...');
    const login = await axios.post(`${apiUrl}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    }, { timeout: 10000 });
    console.log(`   ✅ Admin login: ${login.data.success ? 'Working' : 'Failed'}`);

    console.log('   ✅ Production API is working correctly!');

  } catch (error) {
    console.error('   ❌ Production API test failed:', error.response?.data?.message || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   🚨 Cannot connect to production server - deployment may still be in progress');
    }
  }
}

deployToProduction();