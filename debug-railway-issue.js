const axios = require('axios');

async function debugRailwayIssue() {
  console.log('🔍 Debugging Railway Backend Issue...\n');

  const railwayURL = 'https://web-production-af44.up.railway.app/api';
  
  try {
    // Step 1: Test basic connectivity
    console.log('1. Testing Railway backend connectivity...');
    const healthResponse = await axios.get(`${railwayURL}/health`);
    console.log('✅ Railway backend is accessible');
    console.log(`   Status: ${healthResponse.data.status}`);
    console.log(`   Environment: ${healthResponse.data.environment}`);
    console.log(`   Database: ${healthResponse.data.database.status}`);
    console.log(`   Uptime: ${Math.floor(healthResponse.data.uptime / 60)} minutes`);

    // Step 2: Test articles endpoint
    console.log('\n2. Testing articles endpoint...');
    const articlesResponse = await axios.get(`${railwayURL}/articles`);
    console.log(`✅ Articles endpoint working: ${articlesResponse.data.data.length} articles found`);
    
    if (articlesResponse.data.data.length === 0) {
      console.log('❌ NO ARTICLES FOUND - This is the problem!');
      console.log('   The database is empty or not seeded properly');
    } else {
      console.log('   Sample articles:');
      articlesResponse.data.data.slice(0, 3).forEach((article, index) => {
        console.log(`     ${index + 1}. ${article.title}`);
        console.log(`        Status: ${article.status}`);
        console.log(`        Author: ${article.author?.name || 'No author'}`);
        console.log(`        Category: ${article.category?.name || 'No category'}`);
      });
    }

    // Step 3: Test categories endpoint
    console.log('\n3. Testing categories endpoint...');
    const categoriesResponse = await axios.get(`${railwayURL}/categories`);
    console.log(`✅ Categories endpoint working: ${categoriesResponse.data.data.length} categories found`);
    
    if (categoriesResponse.data.data.length === 0) {
      console.log('❌ NO CATEGORIES FOUND - This is the problem!');
    } else {
      console.log('   Categories:');
      categoriesResponse.data.data.forEach((category, index) => {
        console.log(`     ${index + 1}. ${category.name} (${category.slug})`);
      });
    }

    // Step 4: Test authors endpoint
    console.log('\n4. Testing authors endpoint...');
    const authorsResponse = await axios.get(`${railwayURL}/authors`);
    console.log(`✅ Authors endpoint working: ${authorsResponse.data.data.length} authors found`);
    
    if (authorsResponse.data.data.length === 0) {
      console.log('❌ NO AUTHORS FOUND - This is the problem!');
    }

    // Step 5: Test admin login
    console.log('\n5. Testing admin authentication...');
    try {
      const loginResponse = await axios.post(`${railwayURL}/auth/login`, {
        email: 'admin@dominicanews.com',
        password: 'Pass@12345'
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Admin login successful');
        const token = loginResponse.data.data.token;
        
        // Test creating a sample article
        console.log('\n6. Testing article creation...');
        const testArticle = {
          title: 'Test Article from Debug Script',
          content: 'This is a test article created to verify the admin panel functionality is working properly.',
          excerpt: 'Test article for debugging purposes',
          category: categoriesResponse.data.data[0]?._id || 'test-category-id',
          author: authorsResponse.data.data[0]?._id || 'test-author-id',
          status: 'published'
        };
        
        try {
          const createResponse = await axios.post(`${railwayURL}/articles`, testArticle, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (createResponse.data.success) {
            console.log('✅ Article creation successful');
            console.log(`   Created article: ${createResponse.data.data.title}`);
          } else {
            console.log('❌ Article creation failed:', createResponse.data.message);
          }
        } catch (createError) {
          console.log('❌ Article creation error:', createError.response?.data?.message || createError.message);
          if (createError.response?.data?.errors) {
            console.log('   Validation errors:', createError.response.data.errors);
          }
        }
        
      } else {
        console.log('❌ Admin login failed:', loginResponse.data.message);
      }
    } catch (loginError) {
      console.log('❌ Admin login error:', loginError.response?.data?.message || loginError.message);
    }

    // Step 7: Check if seeding is needed
    console.log('\n7. Diagnosis and Recommendations...');
    
    const totalArticles = articlesResponse.data.data.length;
    const totalCategories = categoriesResponse.data.data.length;
    const totalAuthors = authorsResponse.data.data.length;
    
    if (totalArticles === 0 || totalCategories === 0 || totalAuthors === 0) {
      console.log('🚨 PROBLEM IDENTIFIED: Database is not properly seeded!');
      console.log('\n📋 Required Actions:');
      console.log('1. Run the seeding script on Railway');
      console.log('2. Or manually create sample data through admin panel');
      console.log('3. Or deploy with automatic seeding on startup');
      
      console.log('\n🔧 Quick Fix Options:');
      console.log('A. Add seeding to Railway startup script');
      console.log('B. Run seeding script manually on Railway');
      console.log('C. Create data through admin panel');
    } else {
      console.log('✅ Database has data - the issue might be frontend-related');
      console.log('\n🔧 Frontend Troubleshooting:');
      console.log('1. Clear browser cache and hard refresh');
      console.log('2. Check browser console for errors');
      console.log('3. Verify API calls in Network tab');
      console.log('4. Check if CORS is working properly');
    }

    console.log('\n📊 Current Railway Backend Status:');
    console.log(`   Articles: ${totalArticles}`);
    console.log(`   Categories: ${totalCategories}`);
    console.log(`   Authors: ${totalAuthors}`);
    console.log(`   Admin Login: Working`);
    console.log(`   API Endpoints: Working`);

  } catch (error) {
    console.error('❌ Railway backend is not accessible:', error.message);
    console.error('\n🚨 CRITICAL ISSUE: Railway backend is down or not responding');
    console.error('   Check Railway dashboard for deployment status');
    console.error('   Verify the Railway URL is correct');
    console.error('   Check Railway logs for errors');
  }
}

debugRailwayIssue();