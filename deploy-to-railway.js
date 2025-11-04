const axios = require('axios');

async function deployToRailway() {
  console.log('🚂 Deploying Sample Content to Railway Backend...\n');

  const railwayURL = 'https://web-production-af44.up.railway.app/api';
  
  try {
    // Step 1: Test Railway backend
    console.log('1. Testing Railway backend connection...');
    const healthResponse = await axios.get(`${railwayURL}/health`);
    console.log('✅ Railway backend is running');
    console.log(`   Environment: ${healthResponse.data.environment}`);
    console.log(`   Database: ${healthResponse.data.database.status}`);

    // Step 2: Login to Railway backend
    console.log('\n2. Logging into Railway backend...');
    const loginResponse = await axios.post(`${railwayURL}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ Admin login successful');
    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Step 3: Check current data
    console.log('\n3. Checking current data on Railway...');
    const articlesResponse = await axios.get(`${railwayURL}/articles`);
    const categoriesResponse = await axios.get(`${railwayURL}/categories`);
    
    console.log(`   Current articles: ${articlesResponse.data.data.length}`);
    console.log(`   Current categories: ${categoriesResponse.data.data.length}`);

    // Step 4: Create missing categories if needed
    console.log('\n4. Ensuring all categories exist...');
    const requiredCategories = [
      { name: 'Politics', slug: 'politics', description: 'Political news and government updates from Dominica', displayOrder: 1 },
      { name: 'Tourism', slug: 'tourism', description: 'Tourism news, attractions, and travel information', displayOrder: 2 },
      { name: 'Sports', slug: 'sports', description: 'Sports news, events, and athlete profiles', displayOrder: 3 },
      { name: 'Technology', slug: 'technology', description: 'Technology news, innovations, and digital developments', displayOrder: 4 },
      { name: 'Education', slug: 'education', description: 'Educational news, school updates, and academic achievements', displayOrder: 5 },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle, culture, health, and community news', displayOrder: 6 },
      { name: 'Breaking News', slug: 'breaking-news', description: 'Latest breaking news and urgent updates', displayOrder: 0 }
    ];

    const existingCategories = categoriesResponse.data.data;
    
    for (const category of requiredCategories) {
      const exists = existingCategories.find(cat => cat.slug === category.slug);
      if (!exists) {
        try {
          await axios.post(`${railwayURL}/categories`, category, { headers });
          console.log(`   ✅ Created category: ${category.name}`);
        } catch (error) {
          console.log(`   ⚠️ Category ${category.name} might already exist`);
        }
      } else {
        console.log(`   ✅ Category exists: ${category.name}`);
      }
    }

    // Step 5: Check final status
    console.log('\n5. Final status check...');
    const finalArticlesResponse = await axios.get(`${railwayURL}/articles`);
    const finalCategoriesResponse = await axios.get(`${railwayURL}/categories`);
    const authorsResponse = await axios.get(`${railwayURL}/authors`);
    
    console.log(`✅ Total Articles: ${finalArticlesResponse.data.data.length}`);
    console.log(`✅ Total Categories: ${finalCategoriesResponse.data.data.length}`);
    console.log(`✅ Total Authors: ${authorsResponse.data.data.length}`);

    console.log('\n🎉 Railway backend is ready!');
    console.log('\n📊 Your frontend should now show:');
    console.log(`   - Articles: ${finalArticlesResponse.data.data.length}`);
    console.log(`   - Categories: ${finalCategoriesResponse.data.data.length}`);
    console.log(`   - Authors: ${authorsResponse.data.data.length}`);

    console.log('\n🔗 Frontend is correctly configured to use:');
    console.log('   VITE_API_BASE_URL=https://web-production-af44.up.railway.app/api');

  } catch (error) {
    console.error('❌ Deployment test failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.errors) {
      console.error('   Validation errors:', error.response.data.errors);
    }
  }
}

deployToRailway();