const axios = require('axios');

const PRODUCTION_URL = 'https://web-production-af44.up.railway.app/api';

async function postDeploymentTest() {
  console.log('🧪 POST-DEPLOYMENT TEST');
  console.log('======================');
  console.log(`🌐 Testing: ${PRODUCTION_URL}\n`);

  let allTestsPassed = true;

  try {
    // Test 1: Health check
    console.log('1. Health Check...');
    const health = await axios.get(`${PRODUCTION_URL}/health`, { timeout: 15000 });
    if (health.data.status === 'ok') {
      console.log('✅ Health: OK');
    } else {
      console.log('❌ Health: Failed');
      allTestsPassed = false;
    }

    // Test 2: Articles endpoint (basic)
    console.log('\n2. Basic Articles Endpoint...');
    const articles = await axios.get(`${PRODUCTION_URL}/articles`, { timeout: 15000 });
    console.log(`✅ Articles: ${articles.data.data.length} found`);

    // Test 3: Latest articles endpoint (NEW - this should work after deployment)
    console.log('\n3. Latest Articles Endpoint (CRITICAL)...');
    try {
      const latest = await axios.get(`${PRODUCTION_URL}/articles/latest?limit=6`, { timeout: 15000 });
      console.log(`✅ Latest Articles: ${latest.data.data.length} found`);
      console.log('   🎉 NEW ENDPOINT WORKING - DEPLOYMENT SUCCESSFUL!');
    } catch (error) {
      console.log('❌ Latest Articles: Failed');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      console.log('   🚨 DEPLOYMENT NOT COMPLETE - Latest code not deployed yet');
      allTestsPassed = false;
    }

    // Test 4: Categories
    console.log('\n4. Categories...');
    const categories = await axios.get(`${PRODUCTION_URL}/categories`, { timeout: 15000 });
    console.log(`✅ Categories: ${categories.data.data.length} found`);

    // Test 5: Admin endpoints
    console.log('\n5. Admin Endpoints...');
    const adminArticles = await axios.get(`${PRODUCTION_URL}/admin/articles`, { timeout: 15000 });
    const adminCategories = await axios.get(`${PRODUCTION_URL}/admin/categories`, { timeout: 15000 });
    console.log(`✅ Admin Articles: ${adminArticles.data.data.length} found`);
    console.log(`✅ Admin Categories: ${adminCategories.data.data.length} found`);

    // Test 6: Admin authentication
    console.log('\n6. Admin Authentication...');
    const login = await axios.post(`${PRODUCTION_URL}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    }, { timeout: 15000 });
    
    if (login.data.success) {
      console.log('✅ Admin Login: Working');
      
      // Test content creation
      console.log('\n7. Content Creation Test...');
      const token = login.data.data.token;
      const timestamp = Date.now();
      
      try {
        const newCategory = await axios.post(`${PRODUCTION_URL}/admin/categories`, {
          name: `Deploy Test ${timestamp}`,
          description: 'Category created to test post-deployment functionality'
        }, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        });
        
        if (newCategory.data.success) {
          console.log('✅ Content Creation: Working');
          console.log(`   Created: ${newCategory.data.data.name}`);
          console.log(`   Auto-slug: ${newCategory.data.data.slug}`);
        } else {
          console.log('❌ Content Creation: Failed');
          allTestsPassed = false;
        }
      } catch (error) {
        console.log('❌ Content Creation: Failed');
        console.log(`   Error: ${error.response?.data?.message || error.message}`);
        allTestsPassed = false;
      }
    } else {
      console.log('❌ Admin Login: Failed');
      allTestsPassed = false;
    }

    // Test 7: Settings
    console.log('\n8. Settings & Social Media...');
    const settings = await axios.get(`${PRODUCTION_URL}/settings`, { timeout: 15000 });
    const socialMedia = await axios.get(`${PRODUCTION_URL}/settings/social-media`, { timeout: 15000 });
    console.log(`✅ Settings: ${settings.data.success ? 'Working' : 'Failed'}`);
    console.log(`✅ Social Media: ${socialMedia.data.success ? 'Working' : 'Failed'}`);

    // Final Results
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED - DEPLOYMENT SUCCESSFUL!');
      console.log('\n✅ PRODUCTION BACKEND IS READY FOR FRONTEND!');
      console.log(`\n🔗 Frontend Integration:`);
      console.log(`   VITE_API_BASE_URL=${PRODUCTION_URL}`);
      console.log('\n📋 Frontend Testing:');
      console.log('   1. Update frontend .env file');
      console.log('   2. Clear browser cache (Ctrl+Shift+R)');
      console.log('   3. Restart frontend dev server');
      console.log('   4. Test homepage - should load articles');
      console.log('   5. Test admin panel - should work perfectly');
    } else {
      console.log('🚨 SOME TESTS FAILED - CHECK DEPLOYMENT');
      console.log('\n❌ DEPLOYMENT NOT COMPLETE');
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Check Railway deployment logs');
      console.log('   2. Wait additional 2-3 minutes');
      console.log('   3. Run this test again');
      console.log('   4. Verify all environment variables are set');
    }

  } catch (error) {
    console.error('\n❌ DEPLOYMENT TEST FAILED:', error.message);
    console.error('\n🚨 PRODUCTION API NOT ACCESSIBLE');
    console.error('\n🔧 Check:');
    console.error('   1. Railway deployment status');
    console.error('   2. Service is running');
    console.error('   3. URL is correct');
    console.error('   4. Environment variables are set');
  }
}

postDeploymentTest();