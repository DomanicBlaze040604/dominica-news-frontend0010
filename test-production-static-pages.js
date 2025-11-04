const axios = require('axios');

const PRODUCTION_URL = 'https://web-production-af44.up.railway.app/api';

async function testProductionStaticPages() {
  console.log('🌐 TESTING STATIC PAGES ON PRODUCTION');
  console.log('=====================================\n');
  console.log(`🔗 Production URL: ${PRODUCTION_URL}\n`);

  try {
    // Test 1: Check if static pages endpoints exist
    console.log('1. 📄 Testing Static Pages Endpoints...\n');
    
    try {
      const publicPagesResponse = await axios.get(`${PRODUCTION_URL}/static-pages`, { timeout: 15000 });
      console.log(`✅ Static Pages Endpoint: Working`);
      console.log(`   Found: ${publicPagesResponse.data.data.length} pages`);
      
      if (publicPagesResponse.data.data.length > 0) {
        console.log('   Available pages:');
        publicPagesResponse.data.data.forEach(page => {
          console.log(`     - ${page.title} (${page.slug})`);
        });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Static Pages Endpoint: NOT DEPLOYED YET');
        console.log('   Route not found - need to deploy latest changes');
      } else {
        console.log(`❌ Static Pages Endpoint: Error ${error.response?.status}`);
      }
    }

    // Test 2: Check admin static pages
    console.log('\n2. 🔐 Testing Admin Static Pages...\n');
    
    // Login first
    const loginResponse = await axios.post(`${PRODUCTION_URL}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    }, { timeout: 15000 });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      const headers = { Authorization: `Bearer ${token}` };
      
      try {
        const adminPagesResponse = await axios.get(`${PRODUCTION_URL}/admin/static-pages`, { 
          headers, 
          timeout: 15000 
        });
        console.log(`✅ Admin Static Pages: Working`);
        console.log(`   Total pages: ${adminPagesResponse.data.data.length}`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('❌ Admin Static Pages: NOT DEPLOYED YET');
          console.log('   Admin routes not found - need to deploy latest changes');
        } else {
          console.log(`❌ Admin Static Pages: Error ${error.response?.status}`);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 DEPLOYMENT STATUS');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Production test failed:', error.message);
  }
}

testProductionStaticPages();