const axios = require('axios');

async function debugArticleCreation() {
  const baseURL = 'http://localhost:8080/api';
  
  console.log('🔍 Debugging Article Creation Issue...\n');

  try {
    // Login first
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    });
    
    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Get existing categories and authors
    console.log('1. Getting existing categories and authors...');
    const categories = await axios.get(`${baseURL}/categories`);
    const authors = await axios.get(`${baseURL}/authors`);
    
    console.log(`   Categories: ${categories.data.data.length} found`);
    console.log(`   Authors: ${authors.data.data.length} found`);
    
    if (categories.data.data.length > 0) {
      console.log(`   First category: ${categories.data.data[0].name} (ID: ${categories.data.data[0]._id})`);
    }
    
    if (authors.data.data.length > 0) {
      console.log(`   First author: ${authors.data.data[0].name} (ID: ${authors.data.data[0]._id})`);
    }

    // Try creating article with existing category and author
    console.log('\n2. Creating article with existing category and author...');
    const articleData = {
      title: 'Debug Test Article',
      content: 'This is a test article to debug the creation issue.',
      excerpt: 'Debug test article',
      category: categories.data.data[0]._id,
      author: authors.data.data[0]._id,
      status: 'published'
    };
    
    console.log('   Article data:', {
      title: articleData.title,
      category: articleData.category,
      author: articleData.author,
      status: articleData.status
    });
    
    const articleResponse = await axios.post(`${baseURL}/admin/articles`, articleData, { headers });
    
    console.log(`✅ Article creation: ${articleResponse.data.success ? 'Success' : 'Failed'}`);
    if (articleResponse.data.success) {
      console.log(`   Created: ${articleResponse.data.data.title}`);
      console.log(`   Slug: ${articleResponse.data.data.slug}`);
    } else {
      console.log(`   Error: ${articleResponse.data.message}`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.error('   Validation errors:', error.response.data.errors);
    }
  }
}

debugArticleCreation();