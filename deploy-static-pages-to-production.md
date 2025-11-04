# 🚀 Deploy Static Pages to Production

## 📋 Deployment Checklist

### 1. Build and Commit Changes
```bash
# Build the project
npm run build

# Commit all static pages changes
git add .
git commit -m "Add complete static pages CRUD functionality with admin panel integration"

# Push to main branch (triggers Railway deployment)
git push origin main
```

### 2. Wait for Railway Deployment
- Go to https://railway.app
- Check your project deployment status
- Wait for "Build successful" and "Deployment live" (2-3 minutes)

### 3. Seed Static Pages on Production
After deployment is complete, run:
```bash
# Test if static pages endpoints are available
node test-production-static-pages.js

# If endpoints are working but no pages exist, seed them:
# (You'll need to modify the seed script to use production DB)
```

### 4. Verify Production Deployment
```bash
# Test all static pages functionality
node test-production-static-pages.js
```

## 🔧 Production Database Seeding

Since the static pages are new, you'll need to seed them on production. Here are two options:

### Option A: Manual Creation via Admin Panel
1. Login to your admin panel
2. Go to Static Pages section
3. Create the pages manually:
   - About Us
   - Contact Us
   - Privacy Policy
   - Terms of Service
   - Advertise With Us

### Option B: Seed Script for Production
Create pages programmatically using the API:

```javascript
// This will be done automatically once deployed
const pages = [
  { title: 'About Us', slug: 'about-us', content: '...', template: 'about' },
  { title: 'Contact Us', slug: 'contact-us', content: '...', template: 'contact' },
  // ... etc
];
```

## 📱 Frontend Integration

Once deployed, your frontend static pages section should work with these API calls:

### Admin Panel Integration
```javascript
// Get all static pages for admin
fetch('https://web-production-af44.up.railway.app/api/admin/static-pages', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

// Create new static page
fetch('https://web-production-af44.up.railway.app/api/admin/static-pages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'New Page',
    content: 'Page content...',
    isPublished: true,
    showInMenu: true
  })
})
```

### Public Frontend Integration
```javascript
// Get menu pages for navigation
fetch('https://web-production-af44.up.railway.app/api/static-pages/menu')

// Get single page by slug
fetch('https://web-production-af44.up.railway.app/api/static-pages/slug/about-us')
```

## ✅ Expected Results After Deployment

Your admin panel should show:
- Static Pages section working
- Ability to create/edit/delete pages
- Menu management functionality
- Template selection
- SEO settings for pages

Your public website should have:
- Dynamic navigation menu
- About Us page
- Contact Us page
- Privacy Policy page
- Terms of Service page