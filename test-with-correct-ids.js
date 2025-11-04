const axios = require('axios');

async function testWithCorrectIds() {
  const baseURL = 'http://localhost:8080/api';
  
  console.log('🔍 Testing with Correct ID Fields...\n');

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
      const firstCategory = categories.data.data[0];
      console.log(`   First category: ${firstCategory.name}`);
      console.log(`   Category _id: ${firstCategory._id}`);
      console.log(`   Category id: ${firstCategory.id}`);
    }
    
    if (authors.data.data.length > 0) {
      const firstAuthor = authors.data.data[0];
      console.log(`   First author: ${firstAuthor.name}`);
      console.log(`   Author _id: ${firstAuthor._id}`);
      console.log(`   Author id: ${firstAuthor.id}`);
    }

    // Find a category that has an ID
    const categoryWithId = categories.data.data.find(cat => cat.id || cat._id);
    const authorWithId = authors.data.data.find(auth => auth.id || auth._id);
    
    if (!categoryWithId || !authorWithId) {
      throw new Error('Could not find category or author with valid ID');
    }

    // Try creating article with correct ID fields
    console.log('\\n2. Creating article with correct ID fields...');
    const articleData = {
      title: 'Correct ID Test Article',
      content: 'This article tests using the correct ID fields for category and author.',
      excerpt: 'Testing correct ID usage',
      category: categoryWithId.id || categoryWithId._id,
      author: authorWithId.id || authorWithId._id,
      status: 'published'
    };
    
    console.log('   Using IDs:', {
      category: articleData.category,
      author: articleData.author
    });
    
    const articleResponse = await axios.post(`${baseURL}/admin/articles`, articleData, { headers });
    
    console.log(`✅ Article creation: ${articleResponse.data.success ? 'Success' : 'Failed'}`);
    if (articleResponse.data.success) {
      console.log(`   Created: ${articleResponse.data.data.title}`);
      console.log(`   Slug: ${articleResponse.data.data.slug}`);
    } else {
      console.log(`   Error: ${articleResponse.data.message}`);
    }

    // Test 3: Verify the article appears in listings
    console.log('\\n3. Verifying article appears in listings...');
    const allArticles = await axios.get(`${baseURL}/articles`);
    const latestArticles = await axios.get(`${baseURL}/articles/latest`);
    
    console.log(`✅ Total articles: ${allArticles.data.data.length}`);
    console.log(`✅ Latest articles: ${latestArticles.data.data.length}`);

    console.log('\\n🎉 ID FIELD TEST COMPLETE!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.error('   Validation errors:', error.response.data.errors);
    }
  }
}

testWithCorrectIds();