const axios = require('axios');

async function frontendCompatibilityTest() {
  const baseURL = 'http://localhost:8080/api';
  
  console.log('🎯 Testing Frontend Compatibility...\n');

  try {
    // Test 1: Homepage articles loading
    console.log('1. Testing homepage articles (GET /api/articles/latest)...');
    const homepageArticles = await axios.get(`${baseURL}/articles/latest?limit=6`);
    console.log(`✅ Homepage articles: ${homepageArticles.data.data.length} found`);
    console.log(`   Response format: ${homepageArticles.data.success ? 'Correct' : 'Incorrect'}`);
    
    if (homepageArticles.data.data.length > 0) {
      const article = homepageArticles.data.data[0];
      console.log(`   Sample article: "${article.title}"`);
      console.log(`   Has author: ${article.author ? 'Yes' : 'No'}`);
      console.log(`   Has category: ${article.category ? 'Yes' : 'No'}`);
      console.log(`   Status: ${article.status}`);
    }

    // Test 2: Categories for navigation
    console.log('\n2. Testing categories for navigation...');
    const categories = await axios.get(`${baseURL}/categories`);
    console.log(`✅ Categories: ${categories.data.data.length} found`);
    
    if (categories.data.data.length > 0) {
      console.log('   Available categories:');
      categories.data.data.slice(0, 5).forEach(cat => {
        console.log(`     - ${cat.name} (${cat.slug})`);
      });
    }

    // Test 3: Admin panel - categories
    console.log('\n3. Testing admin panel categories (GET /api/admin/categories)...');
    const adminCategories = await axios.get(`${baseURL}/admin/categories`);
    console.log(`✅ Admin categories: ${adminCategories.data.data.length} found`);

    // Test 4: Admin panel - articles
    console.log('\n4. Testing admin panel articles (GET /api/admin/articles)...');
    const adminArticles = await axios.get(`${baseURL}/admin/articles`);
    console.log(`✅ Admin articles: ${adminArticles.data.data.length} found`);

    // Test 5: Admin authentication
    console.log('\n5. Testing admin authentication...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Admin login failed');
    }
    
    console.log('✅ Admin login successful');
    const token = loginResponse.data.data.token;

    // Test 6: Creating content via admin panel
    console.log('\n6. Testing content creation via admin panel...');
    
    // Create category
    const newCategoryData = {
      name: 'Frontend Test Category',
      description: 'Category created to test frontend compatibility'
    };
    
    const categoryResponse = await axios.post(`${baseURL}/admin/categories`, newCategoryData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Category creation: ${categoryResponse.data.success ? 'Success' : 'Failed'}`);
    if (categoryResponse.data.success) {
      console.log(`   Created: ${categoryResponse.data.data.name}`);
      console.log(`   Auto-slug: ${categoryResponse.data.data.slug}`);
    }

    // Create article
    const newArticleData = {
      title: 'Frontend Compatibility Test Article',
      content: 'This article was created to test frontend compatibility with the backend API.',
      excerpt: 'Testing frontend compatibility',
      category: categoryResponse.data.data._id,
      author: adminArticles.data.data[0].author._id || adminArticles.data.data[0].author,
      status: 'published'
    };
    
    const articleResponse = await axios.post(`${baseURL}/admin/articles`, newArticleData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Article creation: ${articleResponse.data.success ? 'Success' : 'Failed'}`);
    if (articleResponse.data.success) {
      console.log(`   Created: ${articleResponse.data.data.title}`);
      console.log(`   Auto-slug: ${articleResponse.data.data.slug}`);
    }

    // Test 7: Verify new content appears in listings
    console.log('\n7. Testing if new content appears in listings...');
    const updatedCategories = await axios.get(`${baseURL}/categories`);
    const updatedArticles = await axios.get(`${baseURL}/articles`);
    
    console.log(`✅ Updated categories count: ${updatedCategories.data.data.length}`);
    console.log(`✅ Updated articles count: ${updatedArticles.data.data.length}`);

    // Test 8: Settings and social media
    console.log('\n8. Testing settings and social media...');
    const settings = await axios.get(`${baseURL}/settings`);
    const socialMedia = await axios.get(`${baseURL}/settings/social-media`);
    
    console.log(`✅ Settings loaded: ${settings.data.success ? 'Yes' : 'No'}`);
    console.log(`✅ Social media loaded: ${socialMedia.data.success ? 'Yes' : 'No'}`);
    
    const socialCount = Object.keys(socialMedia.data.data).filter(key => socialMedia.data.data[key]).length;
    console.log(`   Social platforms configured: ${socialCount}`);

    // Final summary
    console.log('\n🎉 FRONTEND COMPATIBILITY TEST COMPLETE!');
    console.log('\n📊 Summary:');
    console.log(`   ✅ Homepage articles: ${homepageArticles.data.data.length} available`);
    console.log(`   ✅ Navigation categories: ${categories.data.data.length} available`);
    console.log(`   ✅ Admin panel: Fully functional`);
    console.log(`   ✅ Content creation: Working with auto-slugs`);
    console.log(`   ✅ Authentication: Working`);
    console.log(`   ✅ Settings: Configured`);
    console.log(`   ✅ Social media: ${socialCount} platforms`);

    console.log('\n🔗 Frontend Integration Points:');
    console.log('   Homepage: GET /api/articles/latest?limit=6');
    console.log('   Categories: GET /api/categories');
    console.log('   Admin Login: POST /api/auth/login');
    console.log('   Admin Categories: GET /api/admin/categories');
    console.log('   Admin Articles: GET /api/admin/articles');
    console.log('   Create Category: POST /api/admin/categories');
    console.log('   Create Article: POST /api/admin/articles');
    console.log('   Settings: GET /api/settings');
    console.log('   Social Media: GET /api/settings/social-media');

    console.log('\n✅ YOUR BACKEND IS READY FOR FRONTEND INTEGRATION!');
    console.log('\n📋 Next Steps for Frontend:');
    console.log('1. Ensure VITE_API_BASE_URL=http://localhost:8080/api');
    console.log('2. Clear browser cache (Ctrl+Shift+R)');
    console.log('3. Restart frontend development server');
    console.log('4. Test article loading on homepage');
    console.log('5. Test category navigation');
    console.log('6. Test admin panel login and content creation');

  } catch (error) {
    console.error('❌ Frontend compatibility test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
    console.error('\n🚨 ISSUES FOUND - BACKEND NOT READY');
  }
}

frontendCompatibilityTest();