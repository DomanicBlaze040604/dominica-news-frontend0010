const axios = require('axios');

async function testAPIDirect() {
  const baseURL = 'http://localhost:8080/api';
  
  console.log('🧪 Testing API endpoints directly...\n');

  try {
    // Test health
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${baseURL}/health`);
    console.log(`✅ Health: ${health.data.status}`);

    // Test articles
    console.log('\n2. Testing articles endpoint...');
    const articles = await axios.get(`${baseURL}/articles`);
    console.log(`✅ Articles: ${articles.data.data.length} found`);
    console.log(`   Status: ${articles.data.success}`);
    if (articles.data.data.length > 0) {
      console.log(`   Sample: ${articles.data.data[0].title}`);
    }

    // Test latest articles (new endpoint)
    console.log('\n3. Testing latest articles endpoint...');
    const latest = await axios.get(`${baseURL}/articles/latest?limit=6`);
    console.log(`✅ Latest: ${latest.data.data.length} found`);

    // Test categories
    console.log('\n4. Testing categories endpoint...');
    const categories = await axios.get(`${baseURL}/categories`);
    console.log(`✅ Categories: ${categories.data.data.length} found`);
    console.log(`   Status: ${categories.data.success}`);
    if (categories.data.data.length > 0) {
      console.log(`   Sample: ${categories.data.data[0].name}`);
    }

    // Test authors
    console.log('\n5. Testing authors endpoint...');
    const authors = await axios.get(`${baseURL}/authors`);
    console.log(`✅ Authors: ${authors.data.data.length} found`);

    // Test admin endpoints
    console.log('\n6. Testing admin endpoints...');
    const adminArticles = await axios.get(`${baseURL}/admin/articles`);
    console.log(`✅ Admin Articles: ${adminArticles.data.data.length} found`);

    const adminCategories = await axios.get(`${baseURL}/admin/categories`);
    console.log(`✅ Admin Categories: ${adminCategories.data.data.length} found`);

    // Test admin login
    console.log('\n7. Testing admin login...');
    const login = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    });
    console.log(`✅ Admin login: ${login.data.success}`);

    if (login.data.success) {
      const token = login.data.data.token;
      console.log('   Token received ✅');

      // Test creating category with admin token
      console.log('\n8. Testing category creation...');
      const newCategory = await axios.post(`${baseURL}/admin/categories`, {
        name: 'Test Category API',
        description: 'Testing category creation via API'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Category creation: ${newCategory.data.success}`);
      if (newCategory.data.success) {
        console.log(`   Created: ${newCategory.data.data.name} (${newCategory.data.data.slug})`);
      }
    }

    console.log('\n🎉 All API tests completed successfully!');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
  }
}

testAPIDirect();