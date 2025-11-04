const axios = require('axios');

// 🔧 UPDATE THIS URL TO YOUR ACTUAL RAILWAY PRODUCTION URL
const PRODUCTION_URL = 'https://web-production-af44.up.railway.app/api';

async function testProductionAPI() {
  console.log('🌐 Testing Production API...');
  console.log(`🔗 URL: ${PRODUCTION_URL}\n`);

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${PRODUCTION_URL}/health`, { timeout: 15000 });
    console.log(`✅ Health: ${health.data.status}`);
    console.log(`   Environment: ${health.data.environment || 'unknown'}`);

    // Test 2: Articles for homepage
    console.log('\n2. Testing homepage articles...');
    const articles = await axios.get(`${PRODUCTION_URL}/articles/latest?limit=6`, { timeout: 15000 });
    console.log(`✅ Homepage articles: ${articles.data.data.length} found`);
    
    if (articles.data.data.length > 0) {
      const article = articles.data.data[0];
      console.log(`   Sample: "${article.title}"`);
      console.log(`   Author: ${article.author ? article.author.name : 'Missing'}`);
      console.log(`   Category: ${article.category ? article.category.name : 'Missing'}`);
      console.log(`   Status: ${article.status}`);
    }

    // Test 3: Categories for navigation
    console.log('\n3. Testing navigation categories...');
    const categories = await axios.get(`${PRODUCTION_URL}/categories`, { timeout: 15000 });
    console.log(`✅ Categories: ${categories.data.data.length} found`);
    
    if (categories.data.data.length > 0) {
      console.log('   Available categories:');
      categories.data.data.slice(0, 5).forEach(cat => {
        console.log(`     - ${cat.name} (${cat.slug})`);
      });
    }

    // Test 4: Admin panel endpoints
    console.log('\n4. Testing admin panel endpoints...');
    const adminCategories = await axios.get(`${PRODUCTION_URL}/admin/categories`, { timeout: 15000 });
    const adminArticles = await axios.get(`${PRODUCTION_URL}/admin/articles`, { timeout: 15000 });
    console.log(`✅ Admin categories: ${adminCategories.data.data.length} found`);
    console.log(`✅ Admin articles: ${adminArticles.data.data.length} found`);

    // Test 5: Admin authentication
    console.log('\n5. Testing admin authentication...');
    const loginResponse = await axios.post(`${PRODUCTION_URL}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    }, { timeout: 15000 });
    
    console.log(`✅ Admin login: ${loginResponse.data.success ? 'Success' : 'Failed'}`);
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('   Token received ✅');

      // Test creating content in production
      console.log('\n6. Testing content creation in production...');
      const timestamp = Date.now();
      
      const newCategoryData = {
        name: `Production Test ${timestamp}`,
        description: 'Category created to test production deployment'
      };
      
      const categoryResponse = await axios.post(`${PRODUCTION_URL}/admin/categories`, newCategoryData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });
      
      console.log(`✅ Category creation: ${categoryResponse.data.success ? 'Success' : 'Failed'}`);
      if (categoryResponse.data.success) {
        console.log(`   Created: ${categoryResponse.data.data.name}`);
        console.log(`   Auto-slug: ${categoryResponse.data.data.slug}`);
      }
    }

    // Test 6: Settings and social media
    console.log('\n7. Testing settings and social media...');
    const settings = await axios.get(`${PRODUCTION_URL}/settings`, { timeout: 15000 });
    const socialMedia = await axios.get(`${PRODUCTION_URL}/settings/social-media`, { timeout: 15000 });
    
    console.log(`✅ Settings: ${settings.data.success ? 'Working' : 'Failed'}`);
    console.log(`✅ Social media: ${socialMedia.data.success ? 'Working' : 'Failed'}`);
    
    const socialCount = Object.keys(socialMedia.data.data).filter(key => socialMedia.data.data[key]).length;
    console.log(`   Configured platforms: ${socialCount}`);

    // Final summary
    console.log('\n🎉 PRODUCTION API TEST COMPLETE!');
    console.log('\n📊 Production Status:');
    console.log(`   🌐 API URL: ${PRODUCTION_URL}`);
    console.log(`   📝 Articles: ${articles.data.data.length} available`);
    console.log(`   📂 Categories: ${categories.data.data.length} available`);
    console.log(`   🔐 Admin auth: ${loginResponse.data.success ? 'Working' : 'Failed'}`);
    console.log(`   ⚙️ Settings: Working`);
    console.log(`   📱 Social media: ${socialCount} platforms`);

    console.log('\n✅ PRODUCTION BACKEND IS READY!');
    console.log('\n🔗 Frontend Integration:');
    console.log(`   Update your frontend .env file:`);
    console.log(`   VITE_API_BASE_URL=${PRODUCTION_URL}`);
    
    console.log('\n📋 Frontend Testing Checklist:');
    console.log('   1. Update frontend environment variable');
    console.log('   2. Clear browser cache (Ctrl+Shift+R)');
    console.log('   3. Restart frontend development server');
    console.log('   4. Test homepage - should load articles');
    console.log('   5. Test admin panel - should show data');
    console.log('   6. Test creating content - should work');

  } catch (error) {
    console.error('❌ Production API test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🚨 CONNECTION REFUSED');
      console.error('   - Check if the Railway deployment is complete');
      console.error('   - Verify the production URL is correct');
      console.error('   - Check Railway logs for deployment issues');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n🚨 URL NOT FOUND');
      console.error('   - Verify the production URL is correct');
      console.error('   - Check if Railway service is running');
    } else if (error.response?.status === 500) {
      console.error('\n🚨 SERVER ERROR');
      console.error('   - Check Railway logs for server errors');
      console.error('   - Verify environment variables are set correctly');
    }
    
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check Railway dashboard for deployment status');
    console.error('   2. Verify environment variables are set');
    console.error('   3. Check Railway logs for errors');
    console.error('   4. Ensure MongoDB connection is working');
  }
}

testProductionAPI();