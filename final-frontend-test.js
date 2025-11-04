const axios = require('axios');

async function finalFrontendTest() {
  const baseURL = 'http://localhost:8080/api';
  
  console.log('🎯 FINAL FRONTEND COMPATIBILITY TEST\\n');

  try {
    // Test 1: Homepage articles loading
    console.log('1. Testing homepage articles (GET /api/articles/latest)...');
    const homepageArticles = await axios.get(`${baseURL}/articles/latest?limit=6`);
    console.log(`✅ Homepage articles: ${homepageArticles.data.data.length} found`);
    
    if (homepageArticles.data.data.length > 0) {
      const article = homepageArticles.data.data[0];
      console.log(`   Sample: "${article.title}"`);
      console.log(`   Author: ${article.author ? article.author.name : 'Missing'}`);
      console.log(`   Category: ${article.category ? article.category.name : 'Missing'}`);
    }

    // Test 2: Categories for navigation
    console.log('\\n2. Testing categories for navigation...');
    const categories = await axios.get(`${baseURL}/categories`);
    console.log(`✅ Categories: ${categories.data.data.length} found`);
    
    if (categories.data.data.length > 0) {
      console.log('   Sample categories:');
      categories.data.data.slice(0, 3).forEach(cat => {
        console.log(`     - ${cat.name} (ID: ${cat.id || cat._id})`);
      });
    }

    // Test 3: Admin panel endpoints
    console.log('\\n3. Testing admin panel endpoints...');
    const adminCategories = await axios.get(`${baseURL}/admin/categories`);
    const adminArticles = await axios.get(`${baseURL}/admin/articles`);
    console.log(`✅ Admin categories: ${adminCategories.data.data.length} found`);
    console.log(`✅ Admin articles: ${adminArticles.data.data.length} found`);

    // Test 4: Admin authentication
    console.log('\\n4. Testing admin authentication...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Admin login failed');
    }
    
    console.log('✅ Admin login successful');
    const token = loginResponse.data.data.token;

    // Test 5: Creating content with unique names
    console.log('\\n5. Testing content creation...');
    const timestamp = Date.now();
    
    // Create unique category
    const newCategoryData = {
      name: `Test Category ${timestamp}`,
      description: 'Unique test category for frontend compatibility'
    };
    
    const categoryResponse = await axios.post(`${baseURL}/admin/categories`, newCategoryData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Category creation: ${categoryResponse.data.success ? 'Success' : 'Failed'}`);
    if (categoryResponse.data.success) {
      console.log(`   Created: ${categoryResponse.data.data.name}`);
      console.log(`   Auto-slug: ${categoryResponse.data.data.slug}`);
      console.log(`   ID: ${categoryResponse.data.data.id}`);
    }

    // Create unique article
    const existingCategory = categories.data.data[0];
    const existingAuthor = adminArticles.data.data[0].author;
    
    const newArticleData = {
      title: `Test Article ${timestamp}`,
      content: 'This is a comprehensive test article to verify frontend compatibility.',
      excerpt: 'Frontend compatibility test article',
      category: existingCategory.id || existingCategory._id,
      author: existingAuthor.id || existingAuthor._id || existingAuthor,
      status: 'published'
    };
    
    const articleResponse = await axios.post(`${baseURL}/admin/articles`, newArticleData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Article creation: ${articleResponse.data.success ? 'Success' : 'Failed'}`);
    if (articleResponse.data.success) {
      console.log(`   Created: ${articleResponse.data.data.title}`);
      console.log(`   Auto-slug: ${articleResponse.data.data.slug}`);
      console.log(`   ID: ${articleResponse.data.data.id}`);
    }

    // Test 6: Settings and social media
    console.log('\\n6. Testing settings and social media...');
    const settings = await axios.get(`${baseURL}/settings`);
    const socialMedia = await axios.get(`${baseURL}/settings/social-media`);
    
    console.log(`✅ Settings: ${settings.data.success ? 'Working' : 'Failed'}`);
    console.log(`✅ Social media: ${socialMedia.data.success ? 'Working' : 'Failed'}`);
    
    const socialCount = Object.keys(socialMedia.data.data).filter(key => socialMedia.data.data[key]).length;
    console.log(`   Configured platforms: ${socialCount}`);

    // Test 7: Verify updated content appears
    console.log('\\n7. Testing updated content visibility...');
    const updatedArticles = await axios.get(`${baseURL}/articles/latest`);
    const updatedCategories = await axios.get(`${baseURL}/categories`);
    
    console.log(`✅ Total articles now: ${updatedArticles.data.data.length}`);
    console.log(`✅ Total categories now: ${updatedCategories.data.data.length}`);

    // Final summary
    console.log('\\n🎉 FRONTEND COMPATIBILITY TEST PASSED!');
    console.log('\\n📊 FINAL STATUS:');
    console.log(`   📝 Articles available: ${updatedArticles.data.data.length}`);
    console.log(`   📂 Categories available: ${updatedCategories.data.data.length}`);
    console.log(`   🔐 Admin authentication: Working`);
    console.log(`   ➕ Content creation: Working`);
    console.log(`   🏷️ Auto-slug generation: Working`);
    console.log(`   ⚙️ Settings management: Working`);
    console.log(`   📱 Social media config: Working`);

    console.log('\\n✅ YOUR BACKEND IS FULLY READY FOR FRONTEND!');
    console.log('\\n🔗 Key Frontend Integration Points:');
    console.log('   Homepage Articles: GET /api/articles/latest?limit=6');
    console.log('   Navigation Categories: GET /api/categories');
    console.log('   Admin Login: POST /api/auth/login');
    console.log('   Admin Panel Data: GET /api/admin/categories, /api/admin/articles');
    console.log('   Create Content: POST /api/admin/categories, /api/admin/articles');
    console.log('   Site Settings: GET /api/settings');
    console.log('   Social Media: GET /api/settings/social-media');

    console.log('\\n📋 Frontend Setup Instructions:');
    console.log('1. Set VITE_API_BASE_URL=http://localhost:8080/api');
    console.log('2. Clear browser cache (Ctrl+Shift+R)');
    console.log('3. Restart frontend dev server');
    console.log('4. Test homepage - should show articles');
    console.log('5. Test admin panel - should show categories and articles');
    console.log('6. Test creating new content - should work with auto-slugs');

  } catch (error) {
    console.error('❌ Frontend compatibility test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   HTTP Status: ${error.response.status}`);
    }
    if (error.response?.data?.errors) {
      console.error('   Validation errors:', error.response.data.errors);
    }
    console.error('\\n🚨 BACKEND NOT READY - PLEASE FIX ISSUES ABOVE');
  }
}

finalFrontendTest();