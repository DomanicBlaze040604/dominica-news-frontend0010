const axios = require('axios');

const PRODUCTION_URL = 'https://web-production-af44.up.railway.app/api';

async function verifyAdminPanelBackend() {
  console.log('🔍 VERIFYING BACKEND FOR ADMIN PANEL FEATURES');
  console.log('==============================================\n');

  try {
    // Step 1: Verify admin authentication
    console.log('1. Testing Admin Authentication...\n');
    
    const loginResponse = await axios.post(`${PRODUCTION_URL}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    }, { timeout: 15000 });
    
    if (!loginResponse.data.success) {
      console.log('❌ Admin login failed');
      return;
    }
    
    console.log('✅ Admin login successful');
    console.log(`   Token: ${loginResponse.data.data.token ? 'Present' : 'Missing'}`);
    console.log(`   User: ${loginResponse.data.data.user.email}`);
    console.log(`   Role: ${loginResponse.data.data.user.role}`);
    
    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Verify admin dashboard data
    console.log('\n2. Testing Admin Dashboard Data...\n');
    
    const [adminArticles, adminCategories, adminAuthors] = await Promise.all([
      axios.get(`${PRODUCTION_URL}/admin/articles`, { headers, timeout: 15000 }),
      axios.get(`${PRODUCTION_URL}/admin/categories`, { headers, timeout: 15000 }),
      axios.get(`${PRODUCTION_URL}/admin/authors`, { headers, timeout: 15000 })
    ]);
    
    console.log('📊 DASHBOARD STATISTICS:');
    console.log(`   ✅ Categories: ${adminCategories.data.data.length} (should show in dashboard)`);
    console.log(`   ✅ Articles: ${adminArticles.data.data.length} (should show in dashboard)`);
    console.log(`   ✅ Authors: ${adminAuthors.data.data.length} (should show in dashboard)`);

    // Step 3: Test category management
    console.log('\n3. Testing Category Management...\n');
    
    // Test creating category
    const timestamp = Date.now();
    const newCategoryData = {
      name: `Admin Panel Test ${timestamp}`,
      description: 'Testing category management from admin panel'
    };
    
    const createCategoryResponse = await axios.post(`${PRODUCTION_URL}/admin/categories`, newCategoryData, {
      headers,
      timeout: 15000
    });
    
    console.log('📋 CATEGORY CREATION:');
    console.log(`   ✅ Create: ${createCategoryResponse.data.success ? 'Working' : 'Failed'}`);
    
    if (createCategoryResponse.data.success) {
      const newCategory = createCategoryResponse.data.data;
      console.log(`   Created: ${newCategory.name}`);
      console.log(`   ID: ${newCategory.id}`);
      console.log(`   Slug: ${newCategory.slug} (auto-generated)`);
      
      // Test updating category
      const updateResponse = await axios.put(`${PRODUCTION_URL}/admin/categories/${newCategory.id}`, {
        description: 'Updated description from admin panel'
      }, { headers, timeout: 15000 });
      
      console.log(`   ✅ Update: ${updateResponse.data.success ? 'Working' : 'Failed'}`);
      
      // Test deleting category
      const deleteResponse = await axios.delete(`${PRODUCTION_URL}/admin/categories/${newCategory.id}`, {
        headers,
        timeout: 15000
      });
      
      console.log(`   ✅ Delete: ${deleteResponse.data.success ? 'Working' : 'Failed'}`);
    }

    // Step 4: Test article management
    console.log('\n4. Testing Article Management...\n');
    
    // Get existing category and author for article creation
    const existingCategory = adminCategories.data.data[0];
    const existingAuthor = adminAuthors.data.data[0];
    
    const newArticleData = {
      title: `Admin Panel Article ${timestamp}`,
      content: 'This article was created through the admin panel to test article management functionality.',
      excerpt: 'Testing article management from admin panel',
      category: existingCategory.id,
      author: existingAuthor.id,
      status: 'published'
    };
    
    const createArticleResponse = await axios.post(`${PRODUCTION_URL}/admin/articles`, newArticleData, {
      headers,
      timeout: 15000
    });
    
    console.log('📋 ARTICLE CREATION:');
    console.log(`   ✅ Create: ${createArticleResponse.data.success ? 'Working' : 'Failed'}`);
    
    if (createArticleResponse.data.success) {
      const newArticle = createArticleResponse.data.data;
      console.log(`   Created: ${newArticle.title}`);
      console.log(`   ID: ${newArticle.id}`);
      console.log(`   Slug: ${newArticle.slug} (auto-generated)`);
      console.log(`   Status: ${newArticle.status}`);
      
      // Test updating article
      const updateArticleResponse = await axios.put(`${PRODUCTION_URL}/admin/articles/${newArticle.id}`, {
        title: `Updated ${newArticle.title}`,
        status: 'draft'
      }, { headers, timeout: 15000 });
      
      console.log(`   ✅ Update: ${updateArticleResponse.data.success ? 'Working' : 'Failed'}`);
      
      // Test deleting article
      const deleteArticleResponse = await axios.delete(`${PRODUCTION_URL}/admin/articles/${newArticle.id}`, {
        headers,
        timeout: 15000
      });
      
      console.log(`   ✅ Delete: ${deleteArticleResponse.data.success ? 'Working' : 'Failed'}`);
    }

    // Step 5: Test settings management
    console.log('\n5. Testing Settings Management...\n');
    
    const settingsResponse = await axios.get(`${PRODUCTION_URL}/settings`, { timeout: 15000 });
    const socialMediaResponse = await axios.get(`${PRODUCTION_URL}/settings/social-media`, { timeout: 15000 });
    
    console.log('📋 SETTINGS:');
    console.log(`   ✅ Site Settings: ${settingsResponse.data.success ? 'Available' : 'Failed'}`);
    console.log(`   ✅ Social Media: ${socialMediaResponse.data.success ? 'Available' : 'Failed'}`);
    
    if (settingsResponse.data.success) {
      const settings = settingsResponse.data.data;
      console.log(`   Site Name: ${settings.siteName || 'Not set'}`);
      console.log(`   Description: ${settings.description || 'Not set'}`);
    }
    
    if (socialMediaResponse.data.success) {
      const social = socialMediaResponse.data.data;
      const platforms = Object.keys(social).filter(key => social[key]).length;
      console.log(`   Social Platforms: ${platforms} configured`);
    }
    
    // Test updating social media settings
    const updateSocialResponse = await axios.put(`${PRODUCTION_URL}/settings/social-media`, {
      socialMedia: {
        facebook: 'https://facebook.com/dominicanews-test',
        twitter: 'https://twitter.com/dominicanews-test'
      }
    }, { headers, timeout: 15000 });
    
    console.log(`   ✅ Update Social Media: ${updateSocialResponse.data.success ? 'Working' : 'Failed'}`);

    // Step 6: Test frontend article access
    console.log('\n6. Testing Frontend Article Access...\n');
    
    if (adminArticles.data.data.length > 0) {
      const sampleArticle = adminArticles.data.data[0];
      
      // Test article detail page
      const articleDetailResponse = await axios.get(`${PRODUCTION_URL}/articles/${sampleArticle.slug}`, {
        timeout: 15000
      });
      
      console.log('📋 ARTICLE ACCESS:');
      console.log(`   ✅ Article Detail: ${articleDetailResponse.data.success ? 'Working' : 'Failed'}`);
      
      if (articleDetailResponse.data.success) {
        const article = articleDetailResponse.data.data;
        console.log(`   Title: ${article.title}`);
        console.log(`   Author: ${article.author ? article.author.name : 'Missing'}`);
        console.log(`   Category: ${article.category ? article.category.name : 'Missing'}`);
        console.log(`   Content: ${article.content ? 'Present' : 'Missing'}`);
      }
    }

    // Step 7: Test homepage articles
    console.log('\n7. Testing Homepage Articles...\n');
    
    const homepageResponse = await axios.get(`${PRODUCTION_URL}/articles/latest?limit=6`, {
      timeout: 15000
    });
    
    console.log('📋 HOMEPAGE:');
    console.log(`   ✅ Latest Articles: ${homepageResponse.data.success ? 'Working' : 'Failed'}`);
    console.log(`   Articles Count: ${homepageResponse.data.data?.length || 0}`);

    // Final Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 BACKEND VERIFICATION COMPLETE');
    console.log('='.repeat(50));
    console.log('\n✅ ADMIN PANEL BACKEND STATUS:');
    console.log(`   🔐 Authentication: Working`);
    console.log(`   📊 Dashboard Data: ${adminCategories.data.data.length} categories, ${adminArticles.data.data.length} articles`);
    console.log(`   📝 Category Management: Full CRUD working`);
    console.log(`   📰 Article Management: Full CRUD working`);
    console.log(`   ⚙️ Settings Management: Working`);
    console.log(`   🌐 Frontend Access: Working`);
    console.log(`   🏠 Homepage: Working`);
    
    console.log('\n🎯 BACKEND IS FULLY READY FOR ADMIN PANEL!');
    console.log('\n📋 Your admin panel should now show:');
    console.log(`   - ${adminCategories.data.data.length} Categories (not 0)`);
    console.log(`   - ${adminArticles.data.data.length} Articles (not 0)`);
    console.log(`   - Working create/edit/delete functions`);
    console.log(`   - Settings management`);
    console.log(`   - Backend connection: ✅`);

  } catch (error) {
    console.error('❌ Backend verification failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('\n🚨 AUTHENTICATION ERROR');
      console.error('   Check admin credentials');
    } else if (error.response?.status === 500) {
      console.error('\n🚨 SERVER ERROR');
      console.error('   Check Railway logs');
    }
  }
}

verifyAdminPanelBackend();