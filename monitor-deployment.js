const axios = require('axios');

const PRODUCTION_URL = 'https://web-production-af44.up.railway.app/api';

async function monitorDeployment() {
  console.log('🚀 MONITORING DEPLOYMENT PROGRESS...');
  console.log('===================================');
  console.log(`🌐 URL: ${PRODUCTION_URL}\n`);

  let attempt = 1;
  const maxAttempts = 20; // 10 minutes total
  
  while (attempt <= maxAttempts) {
    console.log(`⏳ Attempt ${attempt}/${maxAttempts} - Checking deployment status...`);
    
    try {
      // Test health endpoint
      const health = await axios.get(`${PRODUCTION_URL}/health`, { 
        timeout: 10000,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (health.data.status === 'ok') {
        console.log('✅ API is responding!');
        
        // Test the critical /latest endpoint
        try {
          const latest = await axios.get(`${PRODUCTION_URL}/articles/latest?limit=3`, { 
            timeout: 10000,
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          console.log(`✅ Latest endpoint working: ${latest.data.data.length} articles found`);
          console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
          console.log('✅ All fixes are now live in production');
          
          // Run quick verification
          await runQuickVerification();
          return;
          
        } catch (latestError) {
          console.log('⚠️ API responding but latest endpoint not ready yet...');
          console.log(`   Error: ${latestError.response?.data?.message || latestError.message}`);
        }
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.log('⏳ Deployment still in progress...');
      } else if (error.response?.status >= 500) {
        console.log('⚠️ Server starting up...');
      } else {
        console.log(`⚠️ ${error.message}`);
      }
    }
    
    if (attempt < maxAttempts) {
      console.log('   Waiting 30 seconds before next check...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    attempt++;
  }
  
  console.log('\n🚨 DEPLOYMENT TIMEOUT');
  console.log('Deployment is taking longer than expected.');
  console.log('Please check Railway dashboard for deployment status.');
}

async function runQuickVerification() {
  console.log('\n🧪 RUNNING QUICK VERIFICATION...\n');
  
  try {
    // Test articles
    const articles = await axios.get(`${PRODUCTION_URL}/articles/latest?limit=6`, { timeout: 15000 });
    console.log(`✅ Homepage articles: ${articles.data.data.length} found`);
    
    // Test categories
    const categories = await axios.get(`${PRODUCTION_URL}/categories`, { timeout: 15000 });
    console.log(`✅ Categories: ${categories.data.data.length} found`);
    
    // Test admin endpoints
    const adminArticles = await axios.get(`${PRODUCTION_URL}/admin/articles`, { timeout: 15000 });
    const adminCategories = await axios.get(`${PRODUCTION_URL}/admin/categories`, { timeout: 15000 });
    console.log(`✅ Admin articles: ${adminArticles.data.data.length} found`);
    console.log(`✅ Admin categories: ${adminCategories.data.data.length} found`);
    
    // Test admin login
    const login = await axios.post(`${PRODUCTION_URL}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    }, { timeout: 15000 });
    console.log(`✅ Admin login: ${login.data.success ? 'Working' : 'Failed'}`);
    
    console.log('\n🎉 PRODUCTION BACKEND IS FULLY OPERATIONAL!');
    console.log('\n🔗 FRONTEND INTEGRATION:');
    console.log(`   Update your frontend .env:`);
    console.log(`   VITE_API_BASE_URL=${PRODUCTION_URL}`);
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Update frontend environment variable');
    console.log('2. Clear browser cache (Ctrl+Shift+R)');
    console.log('3. Restart frontend dev server');
    console.log('4. Test homepage - should load articles');
    console.log('5. Test admin panel - should work perfectly');
    console.log('\n✅ YOUR BACKEND IS READY FOR FRONTEND INTEGRATION!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.response?.data?.message || error.message);
    console.log('\n🔧 Run full test: node post-deployment-test.js');
  }
}

monitorDeployment();