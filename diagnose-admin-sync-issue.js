const axios = require('axios');

const PRODUCTION_URL = 'https://web-production-af44.up.railway.app/api';

async function diagnoseAdminSyncIssue() {
  console.log('🔍 DIAGNOSING ADMIN PANEL SYNC ISSUE');
  console.log('====================================\n');

  try {
    // Test 1: Compare main frontend vs admin panel data
    console.log('1. Comparing Main Frontend vs Admin Panel Data...\n');
    
    // Main frontend endpoints
    const mainArticles = await axios.get(`${PRODUCTION_URL}/articles`, { timeout: 15000 });
    const mainCategories = await axios.get(`${PRODUCTION_URL}/categories`, { timeout: 15000 });
    const mainAuthors = await axios.get(`${PRODUCTION_URL}/authors`, { timeout: 15000 });
    
    console.log('📊 MAIN FRONTEND DATA:');
    console.log(`   Articles: ${mainArticles.data.data.length}`);
    console.log(`   Categories: ${mainCategories.data.data.length}`);
    console.log(`   Authors: ${mainAuthors.data.data.length}`);
    
    // Admin panel endpoints
    const adminArticles = await axios.get(`${PRODUCTION_URL}/admin/articles`, { timeout: 15000 });
    const adminCategories = await axios.get(`${PRODUCTION_URL}/admin/categories`, { timeout: 15000 });
    const adminAuthors = await axios.get(`${PRODUCTION_URL}/admin/authors`, { timeout: 15000 });
    
    console.log('\n🔐 ADMIN PANEL DATA:');
    console.log(`   Articles: ${adminArticles.data.data.length}`);
    console.log(`   Categories: ${adminCategories.data.data.length}`);
    console.log(`   Authors: ${adminAuthors.data.data.length}`);
    
    // Check for discrepancies
    console.log('\n🔍 DATA SYNC ANALYSIS:');
    if (mainArticles.data.data.length !== adminArticles.data.data.length) {
      console.log('❌ ARTICLES SYNC ISSUE: Different counts between main and admin');
    } else {
      console.log('✅ Articles: Counts match');
    }
    
    if (mainCategories.data.data.length !== adminCategories.data.data.length) {
      console.log('❌ CATEGORIES SYNC ISSUE: Different counts between main and admin');
    } else {
      console.log('✅ Categories: Counts match');
    }
    
    if (mainAuthors.data.data.length !== adminAuthors.data.data.length) {
      console.log('❌ AUTHORS SYNC ISSUE: Different counts between main and admin');
    } else {
      console.log('✅ Authors: Counts match');
    }

    // Test 2: Check data structure differences
    console.log('\n2. Checking Data Structure Differences...\n');
    
    if (mainCategories.data.data.length > 0 && adminCategories.data.data.length > 0) {
      const mainCat = mainCategories.data.data[0];
      const adminCat = adminCategories.data.data[0];
      
      console.log('📋 MAIN CATEGORY STRUCTURE:');
      console.log(`   ID: ${mainCat.id || mainCat._id || 'MISSING'}`);
      console.log(`   Name: ${mainCat.name}`);
      console.log(`   Slug: ${mainCat.slug}`);
      console.log(`   Fields: ${Object.keys(mainCat).join(', ')}`);
      
      console.log('\n🔐 ADMIN CATEGORY STRUCTURE:');
      console.log(`   ID: ${adminCat.id || adminCat._id || 'MISSING'}`);
      console.log(`   Name: ${adminCat.name}`);
      console.log(`   Slug: ${adminCat.slug}`);
      console.log(`   Fields: ${Object.keys(adminCat).join(', ')}`);
    }

    // Test 3: Test admin authentication and operations
    console.log('\n3. Testing Admin Operations...\n');
    
    const loginResponse = await axios.post(`${PRODUCTION_URL}/auth/login`, {
      email: 'admin@dominicanews.com',
      password: 'Pass@12345'
    }, { timeout: 15000 });
    
    if (!loginResponse.data.success) {
      console.log('❌ ADMIN LOGIN FAILED');
      return;
    }
    
    console.log('✅ Admin login successful');
    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test creating a category
    console.log('\n4. Testing Category Creation...\n');
    const timestamp = Date.now();
    const testCategoryData = {
      name: `Sync Test ${timestamp}`,
      description: 'Testing admin panel sync'
    };
    
    try {
      const createResponse = await axios.post(`${PRODUCTION_URL}/admin/categories`, testCategoryData, { 
        headers, 
        timeout: 15000 
      });
      
      if (createResponse.data.success) {
        console.log('✅ Category creation successful');
        console.log(`   Created: ${createResponse.data.data.name}`);
        console.log(`   ID: ${createResponse.data.data.id || createResponse.data.data._id}`);
        
        // Immediately check if it appears in both endpoints
        console.log('\n5. Checking Immediate Sync...\n');
        
        const newMainCategories = await axios.get(`${PRODUCTION_URL}/categories`, { timeout: 15000 });
        const newAdminCategories = await axios.get(`${PRODUCTION_URL}/admin/categories`, { timeout: 15000 });
        
        console.log(`📊 After creation - Main: ${newMainCategories.data.data.length} categories`);
        console.log(`🔐 After creation - Admin: ${newAdminCategories.data.data.length} categories`);
        
        // Check if the new category appears in both
        const mainHasNew = newMainCategories.data.data.some(cat => cat.name === testCategoryData.name);
        const adminHasNew = newAdminCategories.data.data.some(cat => cat.name === testCategoryData.name);
        
        console.log(`✅ New category in main endpoint: ${mainHasNew ? 'YES' : 'NO'}`);
        console.log(`✅ New category in admin endpoint: ${adminHasNew ? 'YES' : 'NO'}`);
        
        if (mainHasNew && adminHasNew) {
          console.log('✅ SYNC WORKING: Category appears in both endpoints');
        } else {
          console.log('❌ SYNC ISSUE: Category missing from one or both endpoints');
        }
        
      } else {
        console.log('❌ Category creation failed');
        console.log(`   Error: ${createResponse.data.message}`);
      }
      
    } catch (error) {
      console.log('❌ Category creation error');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // Test 6: Check article opening
    console.log('\n6. Testing Article Opening...\n');
    
    if (mainArticles.data.data.length > 0) {
      const sampleArticle = mainArticles.data.data[0];
      console.log(`Testing article: "${sampleArticle.title}"`);
      console.log(`Slug: ${sampleArticle.slug}`);
      
      try {
        const articleDetail = await axios.get(`${PRODUCTION_URL}/articles/${sampleArticle.slug}`, { timeout: 15000 });
        if (articleDetail.data.success) {
          console.log('✅ Article opens correctly');
          console.log(`   Title: ${articleDetail.data.data.title}`);
          console.log(`   Author: ${articleDetail.data.data.author ? articleDetail.data.data.author.name : 'Missing'}`);
          console.log(`   Category: ${articleDetail.data.data.category ? articleDetail.data.data.category.name : 'Missing'}`);
        } else {
          console.log('❌ Article opening failed');
        }
      } catch (error) {
        console.log('❌ Article opening error');
        console.log(`   Error: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎯 DIAGNOSIS COMPLETE');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.response?.data || error.message);
  }
}

diagnoseAdminSyncIssue();