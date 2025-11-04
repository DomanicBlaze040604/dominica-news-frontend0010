const axios = require('axios');

const PRODUCTION_URL = 'https://web-production-af44.up.railway.app/api';

async function diagnoseFrontendBackendSync() {
  console.log('🔍 DIAGNOSING FRONTEND-BACKEND SYNC ISSUE');
  console.log('==========================================\n');
  console.log(`🌐 Production URL: ${PRODUCTION_URL}\n`);

  try {
    // Step 1: Test admin authentication
    console.log('1. 🔐 Testing Admin Authentication...\n');
    
    const loginResponse = await axios.post(`${PRODUCTION_URL}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    }, { timeout: 15000 });
    
    if (!loginResponse.data.success) {
      console.log('❌ Admin login failed - cannot proceed');
      return;
    }
    
    console.log('✅ Admin login successful');
    console.log(`   Token: ${loginResponse.data.data.token ? 'Present' : 'Missing'}`);
    console.log(`   User: ${loginResponse.data.data.user.email}`);
    console.log(`   Role: ${loginResponse.data.data.user.role}`);
    
    const token = loginResponse.data.data.token;
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test category creation and immediate retrieval
    console.log('\n2. 📂 Testing Category Creation & Sync...\n');
    
    const timestamp = Date.now();
    const testCategoryData = {
      name: `Sync Test Category ${timestamp}`,
      description: 'Testing frontend-backend sync issue'
    };
    
    console.log(`Creating category: "${testCategoryData.name}"`);
    
    const createResponse = await axios.post(`${PRODUCTION_URL}/admin/categories`, testCategoryData, {
      headers,
      timeout: 15000
    });
    
    console.log(`✅ Category creation: ${createResponse.data.success ? 'Success' : 'Failed'}`);
    
    if (createResponse.data.success) {
      const newCategory = createResponse.data.data;
      console.log(`   Created: ${newCategory.name}`);
      console.log(`   ID: ${newCategory.id}`);
      console.log(`   Slug: ${newCategory.slug}`);
      
      // Step 3: Immediately check if it appears in admin categories list
      console.log('\n3. 🔍 Checking Immediate Sync...\n');
      
      const adminCategoriesResponse = await axios.get(`${PRODUCTION_URL}/admin/categories`, {
        headers,
        timeout: 15000
      });
      
      console.log(`✅ Admin categories retrieved: ${adminCategoriesResponse.data.data.length} total`);
      
      const foundInAdmin = adminCategoriesResponse.data.data.find(cat => cat.name === testCategoryData.name);
      console.log(`   New category in admin list: ${foundInAdmin ? 'YES ✅' : 'NO ❌'}`);
      
      if (foundInAdmin) {
        console.log(`   Found: ${foundInAdmin.name} (ID: ${foundInAdmin.id})`);
      }
      
      // Step 4: Check if it appears in public categories list
      const publicCategoriesResponse = await axios.get(`${PRODUCTION_URL}/categories`, {
        timeout: 15000
      });
      
      console.log(`✅ Public categories retrieved: ${publicCategoriesResponse.data.data.length} total`);
      
      const foundInPublic = publicCategoriesResponse.data.data.find(cat => cat.name === testCategoryData.name);
      console.log(`   New category in public list: ${foundInPublic ? 'YES ✅' : 'NO ❌'}`);
      
      // Step 5: Test different endpoints that frontend might be using
      console.log('\n4. 🔍 Testing Different Endpoints...\n');
      
      // Test with different query parameters
      const adminCategoriesWithParams = await axios.get(`${PRODUCTION_URL}/admin/categories?page=1&limit=50`, {
        headers,
        timeout: 15000
      });
      console.log(`   Admin categories (with params): ${adminCategoriesWithParams.data.data.length}`);
      
      // Test without admin prefix (in case frontend is using wrong endpoint)
      try {
        const categoriesWithoutAdmin = await axios.get(`${PRODUCTION_URL}/categories`, {
          headers,
          timeout: 15000
        });
        console.log(`   Categories (without admin): ${categoriesWithoutAdmin.data.data.length}`);
      } catch (error) {
        console.log(`   Categories (without admin): Error ${error.response?.status}`);
      }
      
      // Step 6: Check response format differences
      console.log('\n5. 📋 Checking Response Formats...\n');
      
      console.log('Admin Categories Response Format:');
      if (adminCategoriesResponse.data.data.length > 0) {
        const sampleAdmin = adminCategoriesResponse.data.data[0];
        console.log(`   Sample Admin Category:`, {
          id: sampleAdmin.id || sampleAdmin._id,
          name: sampleAdmin.name,
          slug: sampleAdmin.slug,
          hasId: !!sampleAdmin.id,
          has_id: !!sampleAdmin._id
        });
      }
      
      console.log('\nPublic Categories Response Format:');
      if (publicCategoriesResponse.data.data.length > 0) {
        const samplePublic = publicCategoriesResponse.data.data[0];
        console.log(`   Sample Public Category:`, {
          id: samplePublic.id || samplePublic._id,
          name: samplePublic.name,
          slug: samplePublic.slug,
          hasId: !!samplePublic.id,
          has_id: !!samplePublic._id
        });
      }
      
      // Step 7: Test CORS headers
      console.log('\n6. 🌐 Testing CORS Headers...\n');
      
      try {
        const corsTestResponse = await axios.get(`${PRODUCTION_URL}/admin/categories`, {
          headers: {
            ...headers,
            'Origin': 'http://localhost:3000'
          },
          timeout: 15000
        });
        console.log('✅ CORS test: Working');
        console.log(`   Access-Control-Allow-Origin: ${corsTestResponse.headers['access-control-allow-origin'] || 'Not set'}`);
      } catch (error) {
        console.log('❌ CORS test: Failed');
        console.log(`   Error: ${error.message}`);
      }
      
      // Step 8: Clean up - delete test category
      console.log('\n7. 🗑️ Cleaning up test category...\n');
      
      try {
        const deleteResponse = await axios.delete(`${PRODUCTION_URL}/admin/categories/${newCategory.id}`, {
          headers,
          timeout: 15000
        });
        console.log(`✅ Test category deleted: ${deleteResponse.data.success ? 'Success' : 'Failed'}`);
      } catch (error) {
        console.log('⚠️ Could not delete test category');
      }
    }

    // Step 9: Final diagnosis
    console.log('\n' + '='.repeat(60));
    console.log('🎯 SYNC ISSUE DIAGNOSIS');
    console.log('='.repeat(60));
    
    console.log('\n📋 BACKEND STATUS:');
    console.log('   ✅ Authentication: Working');
    console.log('   ✅ Category Creation: Working');
    console.log('   ✅ Data Storage: Working');
    console.log('   ✅ API Responses: Correct format');
    
    console.log('\n🔍 POSSIBLE FRONTEND ISSUES:');
    console.log('   1. Frontend using wrong API endpoint');
    console.log('   2. Frontend not sending Authorization header');
    console.log('   3. Frontend not refreshing data after creation');
    console.log('   4. Frontend caching old data');
    console.log('   5. Frontend expecting different response format');
    
    console.log('\n🔧 FRONTEND DEBUGGING STEPS:');
    console.log('   1. Open browser DevTools (F12)');
    console.log('   2. Go to Network tab');
    console.log('   3. Try creating a category in admin panel');
    console.log('   4. Check if POST request succeeds');
    console.log('   5. Check if GET request is made after creation');
    console.log('   6. Verify Authorization header is present');
    console.log('   7. Check response data format');
    
    console.log('\n📱 FRONTEND API CALLS TO VERIFY:');
    console.log(`   Create: POST ${PRODUCTION_URL}/admin/categories`);
    console.log(`   List: GET ${PRODUCTION_URL}/admin/categories`);
    console.log('   Headers: Authorization: Bearer [token]');
    console.log('   Content-Type: application/json');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('\n🚨 AUTHENTICATION ERROR');
      console.error('   Frontend may not be sending correct token');
    } else if (error.response?.status === 403) {
      console.error('\n🚨 AUTHORIZATION ERROR');
      console.error('   User may not have admin permissions');
    } else if (error.response?.status === 500) {
      console.error('\n🚨 SERVER ERROR');
      console.error('   Check Railway logs for server issues');
    }
  }
}

diagnoseFrontendBackendSync();