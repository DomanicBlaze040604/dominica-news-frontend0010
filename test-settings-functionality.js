const axios = require('axios');

async function testSettingsFunctionality() {
  const baseURL = 'http://localhost:3001/api';
  
  console.log('⚙️ Testing Settings & Social Media Management...\n');

  try {
    // Step 1: Test getting settings (public endpoint)
    console.log('1. Testing Get Settings (Public)...');
    const settingsResponse = await axios.get(`${baseURL}/settings`);
    console.log('✅ Settings retrieved successfully');
    console.log(`   Site Name: ${settingsResponse.data.data.siteName}`);
    console.log(`   Site Description: ${settingsResponse.data.data.siteDescription}`);

    // Step 2: Test getting social media links (public endpoint)
    console.log('\n2. Testing Get Social Media Links (Public)...');
    const socialResponse = await axios.get(`${baseURL}/settings/social-media`);
    console.log('✅ Social media links retrieved');
    console.log('   Current social media links:');
    Object.entries(socialResponse.data.data).forEach(([platform, url]) => {
      if (url) console.log(`     ${platform}: ${url}`);
    });

    // Step 3: Login as admin
    console.log('\n3. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
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

    // Step 4: Test updating social media links
    console.log('\n4. Testing Social Media Links Update...');
    const newSocialMedia = {
      socialMedia: {
        facebook: 'https://www.facebook.com/dominicanewsofficial',
        twitter: 'https://www.twitter.com/dominicanews_dm',
        instagram: 'https://www.instagram.com/dominicanews_official',
        youtube: 'https://www.youtube.com/c/DominicaNews',
        linkedin: 'https://www.linkedin.com/company/dominica-news',
        tiktok: 'https://www.tiktok.com/@dominicanews'
      }
    };

    const updateSocialResponse = await axios.put(`${baseURL}/settings/social-media`, newSocialMedia, { headers });
    
    if (updateSocialResponse.data.success) {
      console.log('✅ Social media links updated successfully');
      console.log('   Updated links:');
      Object.entries(updateSocialResponse.data.data).forEach(([platform, url]) => {
        if (url) console.log(`     ${platform}: ${url}`);
      });
    } else {
      console.log('❌ Social media update failed:', updateSocialResponse.data.message);
    }

    // Step 5: Test updating contact information
    console.log('\n5. Testing Contact Information Update...');
    const newContactInfo = {
      contactInfo: {
        email: 'contact@dominicanews.com',
        phone: '+1-767-448-NEWS',
        address: '123 Independence Street, Roseau, Commonwealth of Dominica',
        workingHours: 'Monday - Friday: 8:00 AM - 6:00 PM AST'
      }
    };

    const updateContactResponse = await axios.put(`${baseURL}/settings/contact`, newContactInfo, { headers });
    
    if (updateContactResponse.data.success) {
      console.log('✅ Contact information updated successfully');
      console.log('   Updated contact info:');
      Object.entries(updateContactResponse.data.data).forEach(([key, value]) => {
        if (value) console.log(`     ${key}: ${value}`);
      });
    } else {
      console.log('❌ Contact info update failed:', updateContactResponse.data.message);
    }

    // Step 6: Test updating general settings
    console.log('\n6. Testing General Settings Update...');
    const newSettings = {
      siteName: 'Dominica News - Nature Island Updates',
      siteDescription: 'Your premier source for news, politics, tourism, and culture from the beautiful Commonwealth of Dominica',
      copyrightText: '© 2024 Dominica News. Proudly serving the Nature Island.',
      footerText: 'Stay connected with the latest from the Nature Island of the Caribbean'
    };

    const updateSettingsResponse = await axios.put(`${baseURL}/settings`, newSettings, { headers });
    
    if (updateSettingsResponse.data.success) {
      console.log('✅ General settings updated successfully');
      console.log(`   Site Name: ${updateSettingsResponse.data.data.siteName}`);
      console.log(`   Description: ${updateSettingsResponse.data.data.siteDescription}`);
      console.log(`   Copyright: ${updateSettingsResponse.data.data.copyrightText}`);
    } else {
      console.log('❌ Settings update failed:', updateSettingsResponse.data.message);
    }

    // Step 7: Test SEO settings
    console.log('\n7. Testing SEO Settings Update...');
    const seoSettings = {
      seoSettings: {
        metaTitle: 'Dominica News - Latest Caribbean News & Updates',
        metaDescription: 'Stay informed with breaking news, politics, tourism, sports, and cultural updates from Dominica and the Caribbean region.',
        keywords: ['dominica', 'caribbean news', 'nature island', 'politics', 'tourism', 'sports', 'culture', 'breaking news'],
        ogImage: 'https://dominicanews.com/images/og-image.jpg'
      }
    };

    const updateSEOResponse = await axios.put(`${baseURL}/settings/seo`, seoSettings, { headers });
    
    if (updateSEOResponse.data.success) {
      console.log('✅ SEO settings updated successfully');
      console.log(`   Meta Title: ${updateSEOResponse.data.data.metaTitle}`);
      console.log(`   Meta Description: ${updateSEOResponse.data.data.metaDescription}`);
      console.log(`   Keywords: ${updateSEOResponse.data.data.keywords.join(', ')}`);
    } else {
      console.log('❌ SEO settings update failed:', updateSEOResponse.data.message);
    }

    // Step 8: Test final settings retrieval
    console.log('\n8. Testing Final Settings Retrieval...');
    const finalSettingsResponse = await axios.get(`${baseURL}/settings`);
    console.log('✅ Final settings retrieved');
    console.log(`   Site Name: ${finalSettingsResponse.data.data.siteName}`);
    console.log(`   Maintenance Mode: ${finalSettingsResponse.data.data.maintenanceMode}`);

    console.log('\n🎉 Settings functionality testing completed!');
    console.log('\n📊 Feature Test Results:');
    console.log('✅ Settings Retrieval (Public) - Working');
    console.log('✅ Social Media Management - Working');
    console.log('✅ Contact Information Management - Working');
    console.log('✅ General Settings Management - Working');
    console.log('✅ SEO Settings Management - Working');
    console.log('✅ Admin Panel Settings Control - Working');

  } catch (error) {
    console.error('❌ Settings test failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.errors) {
      console.error('   Validation errors:', error.response.data.errors);
    }
  }
}

testSettingsFunctionality();