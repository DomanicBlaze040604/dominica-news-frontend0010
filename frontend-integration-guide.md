# 🔗 Frontend Integration Guide

## 🚀 Backend Server Status
- **✅ Server Running**: `http://localhost:8080`
- **✅ Database Connected**: MongoDB Atlas
- **✅ Sample Data**: 6 articles, 7 categories, 6 authors
- **✅ CORS Configured**: Multiple origins allowed

## 📡 API Endpoints Available

### **Public Endpoints (No Auth Required)**
```javascript
// Articles
GET http://localhost:8080/api/articles              // All articles (6 found)
GET http://localhost:8080/api/articles/breaking     // Breaking news (1 found)
GET http://localhost:8080/api/articles/featured     // Featured articles (2 found)
GET http://localhost:8080/api/articles/:slug        // Single article by slug

// Categories
GET http://localhost:8080/api/categories            // All categories (7 found)
GET http://localhost:8080/api/categories/:slug      // Single category

// Authors
GET http://localhost:8080/api/authors               // All authors (6 found)

// Settings (Public)
GET http://localhost:8080/api/settings              // Site settings
GET http://localhost:8080/api/settings/social-media // Social media links
GET http://localhost:8080/api/settings/contact      // Contact information

// Health Check
GET http://localhost:8080/api/health                // Server health
```

### **Admin Endpoints (Auth Required)**
```javascript
// Authentication
POST http://localhost:8080/api/auth/login           // Admin login
GET  http://localhost:8080/api/auth/me              // Get current user

// Article Management
POST http://localhost:8080/api/articles             // Create article
PUT  http://localhost:8080/api/articles/:id         // Update article
DELETE http://localhost:8080/api/articles/:id       // Delete article

// Category Management
POST http://localhost:8080/api/categories           // Create category
PUT  http://localhost:8080/api/categories/:id       // Update category
DELETE http://localhost:8080/api/categories/:id     // Delete category

// Settings Management
PUT http://localhost:8080/api/settings              // Update general settings
PUT http://localhost:8080/api/settings/social-media // Update social media
PUT http://localhost:8080/api/settings/contact      // Update contact info
PUT http://localhost:8080/api/settings/seo          // Update SEO settings
```

## 🔐 Admin Credentials
```javascript
{
  "email": "admin@dominicanews.com",
  "password": "Pass@12345"
}
```

## 🌐 CORS Configuration
The backend now accepts requests from:
- `http://localhost:3000` (React default)
- `http://localhost:8080` (Alternative local)
- `https://dominicanews-d2aa9.web.app` (Production)

## 📝 Sample Data Available

### Categories (7 total):
1. Politics
2. Tourism  
3. Sports
4. Technology
5. Education
6. Lifestyle
7. Breaking News

### Articles (6 total):
1. "Prime Minister Announces New Infrastructure Development Plan" (Breaking)
2. "Dominica Named Top Eco-Tourism Destination in Caribbean" (Featured)
3. "Dominican Athletes Prepare for Commonwealth Games"
4. "New High-Speed Internet Initiative Launched Across Dominica"
5. "New STEM Program Launched in Dominican Schools"
6. "Traditional Dominican Cuisine Festival Celebrates Local Heritage" (Featured)

### Authors (6 total):
1. Maria Rodriguez (Politics)
2. James Thompson (Tourism)
3. Sarah Williams (Sports)
4. David Chen (Technology)
5. Lisa Martinez (Education)
6. Michael Joseph (Lifestyle)

## 🔧 Frontend Integration Steps

### 1. Update API Base URL
```javascript
// In your frontend API configuration
const API_BASE_URL = 'http://localhost:8080/api';
```

### 2. Test Connection
```javascript
// Test if backend is accessible
fetch('http://localhost:8080/api/health')
  .then(response => response.json())
  .then(data => console.log('Backend connected:', data))
  .catch(error => console.error('Backend connection failed:', error));
```

### 3. Fetch Articles
```javascript
// Get all articles
fetch('http://localhost:8080/api/articles')
  .then(response => response.json())
  .then(data => {
    console.log('Articles found:', data.data.length);
    console.log('Articles:', data.data);
  });
```

### 4. Fetch Categories
```javascript
// Get all categories
fetch('http://localhost:8080/api/categories')
  .then(response => response.json())
  .then(data => {
    console.log('Categories found:', data.data.length);
    console.log('Categories:', data.data);
  });
```

### 5. Admin Login
```javascript
// Login as admin
fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@dominicanews.com',
    password: 'Pass@12345'
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    const token = data.data.token;
    localStorage.setItem('adminToken', token);
    console.log('Admin login successful');
  }
});
```

## 🐛 Troubleshooting

### If articles/categories don't show:
1. Check browser console for CORS errors
2. Verify API base URL is correct
3. Test endpoints directly: `http://localhost:8080/api/articles`

### If admin panel doesn't work:
1. Check if login is successful
2. Verify JWT token is being sent in headers
3. Check for authentication errors in network tab

### Common Issues:
- **CORS Error**: Backend allows localhost:3000, localhost:8080, and production URL
- **Port Conflict**: Backend is running on port 8080
- **Network Error**: Check if backend server is running

## 📞 Quick Test Commands
```bash
# Test if server is running
curl http://localhost:8080/api/health

# Test articles endpoint
curl http://localhost:8080/api/articles

# Test categories endpoint  
curl http://localhost:8080/api/categories
```

The backend is fully functional and ready for frontend integration!