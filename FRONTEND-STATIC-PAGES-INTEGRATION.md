# 📱 Frontend Static Pages Integration Guide

## 🎯 Your Frontend Already Has Static Pages Section!

Since your frontend already has a static pages section in the admin panel that wasn't working, here's exactly what you need to update to make it work:

## 🔧 Frontend API Integration

### 1. Update API Base URL (if needed)
Make sure your frontend is using the correct production API URL:
```javascript
// In your frontend .env file
VITE_API_BASE_URL=https://web-production-af44.up.railway.app/api
```

### 2. Admin Panel Static Pages API Calls

Your existing frontend static pages admin section should use these endpoints:

#### Get All Static Pages (Admin)
```javascript
// For admin pages list with pagination
const getStaticPages = async (page = 1, limit = 10, search = '') => {
  const response = await fetch(`${API_BASE_URL}/admin/static-pages?page=${page}&limit=${limit}&search=${search}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Create Static Page
```javascript
const createStaticPage = async (pageData) => {
  const response = await fetch(`${API_BASE_URL}/admin/static-pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: pageData.title,
      content: pageData.content,
      metaTitle: pageData.metaTitle,
      metaDescription: pageData.metaDescription,
      keywords: pageData.keywords,
      isPublished: pageData.isPublished,
      showInMenu: pageData.showInMenu,
      menuOrder: pageData.menuOrder,
      template: pageData.template || 'default'
    })
  });
  return response.json();
};
```

#### Update Static Page
```javascript
const updateStaticPage = async (pageId, pageData) => {
  const response = await fetch(`${API_BASE_URL}/admin/static-pages/${pageId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pageData)
  });
  return response.json();
};
```

#### Delete Static Page
```javascript
const deleteStaticPage = async (pageId) => {
  const response = await fetch(`${API_BASE_URL}/admin/static-pages/${pageId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

#### Toggle Page Status
```javascript
const togglePageStatus = async (pageId) => {
  const response = await fetch(`${API_BASE_URL}/admin/static-pages/${pageId}/toggle-status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 3. Public Frontend Integration

#### Get Menu Pages for Navigation
```javascript
const getMenuPages = async () => {
  const response = await fetch(`${API_BASE_URL}/static-pages/menu`);
  return response.json();
};

// Use in your navigation component
useEffect(() => {
  getMenuPages().then(data => {
    if (data.success) {
      setMenuPages(data.data); // Array of pages to show in menu
    }
  });
}, []);
```

#### Get Single Page by Slug
```javascript
const getPageBySlug = async (slug) => {
  const response = await fetch(`${API_BASE_URL}/static-pages/slug/${slug}`);
  return response.json();
};

// Use in your page component
useEffect(() => {
  getPageBySlug(params.slug).then(data => {
    if (data.success) {
      setPage(data.data);
    }
  });
}, [params.slug]);
```

## 🎨 Template Support

Your backend supports 5 templates:
- `default` - Standard page layout
- `about` - About us page layout
- `contact` - Contact page layout
- `privacy` - Privacy policy layout
- `terms` - Terms of service layout

## 📊 Expected Data Structure

### Static Page Object
```javascript
{
  id: "6909d8c497f44107ec3f751f",
  title: "About Us",
  slug: "about-us",
  content: "<h1>About Us</h1><p>Content here...</p>",
  metaTitle: "About Us - Dominica News",
  metaDescription: "Learn about Dominica News...",
  keywords: ["about", "dominica", "news"],
  isPublished: true,
  showInMenu: true,
  menuOrder: 1,
  template: "about",
  createdAt: "2025-11-04T10:15:32.123Z",
  updatedAt: "2025-11-04T10:15:32.123Z"
}
```

### API Response Format
```javascript
{
  success: true,
  data: [...], // Array of pages or single page
  pagination: { // Only for admin list endpoints
    current: 1,
    pages: 3,
    total: 25,
    limit: 10
  }
}
```

## 🔧 Frontend Form Fields

Your admin form should include these fields:

### Basic Fields
- `title` (required) - Page title
- `content` (required) - HTML content
- `slug` (optional) - Auto-generated from title

### SEO Fields
- `metaTitle` (optional) - SEO meta title
- `metaDescription` (optional) - SEO meta description
- `keywords` (optional) - Array of keywords

### Settings Fields
- `isPublished` (boolean) - Published status
- `showInMenu` (boolean) - Show in navigation menu
- `menuOrder` (number) - Order in menu
- `template` (select) - Page template

### Template Options
```javascript
const templateOptions = [
  { value: 'default', label: 'Default' },
  { value: 'about', label: 'About Page' },
  { value: 'contact', label: 'Contact Page' },
  { value: 'privacy', label: 'Privacy Policy' },
  { value: 'terms', label: 'Terms of Service' }
];
```

## 🚀 After Deployment

Once you deploy the backend changes:

1. **Test Admin Panel**: Your existing static pages section should start working
2. **Create Sample Pages**: Use the admin panel to create About, Contact, etc.
3. **Test Navigation**: Menu pages should appear in your site navigation
4. **Test Public Pages**: Individual pages should be accessible by slug

## 📋 Troubleshooting

If your frontend static pages section still doesn't work after deployment:

1. **Check API URL**: Ensure you're using the correct production URL
2. **Check Authentication**: Verify JWT token is being sent with admin requests
3. **Check Console**: Look for JavaScript errors in browser console
4. **Check Network**: Verify API calls are reaching the correct endpoints
5. **Clear Cache**: Clear browser cache and restart frontend dev server

## ✅ Success Indicators

Your static pages will be working when:
- Admin panel shows list of static pages (not empty)
- You can create/edit/delete pages through admin interface
- Pages appear in your website navigation menu
- Individual pages are accessible via their slugs
- SEO meta tags are properly set

**Your frontend should now have a fully functional static pages management system!** 🎉