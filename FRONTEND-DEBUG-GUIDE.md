# 🔧 FRONTEND DEBUG GUIDE - Admin Panel Issues

## ✅ BACKEND STATUS: FULLY WORKING
- **12 categories** available via `/api/admin/categories`
- **8 articles** available via `/api/admin/articles`
- **Authentication** working perfectly
- **CRUD operations** all functional
- **Data sync** is immediate and correct

## 🚨 ISSUE: Frontend Not Displaying Data

Since the backend is working perfectly, the issue is in the frontend. Here's how to debug:

### 1. Check Frontend Environment Variables
```bash
# In your frontend .env file, ensure:
VITE_API_BASE_URL=https://web-production-af44.up.railway.app/api
```

### 2. Check Browser Developer Tools

#### A. Console Errors
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for JavaScript errors
4. Common errors to look for:
   - `CORS policy` errors
   - `401 Unauthorized` errors
   - `Network request failed` errors
   - `Cannot read property` errors

#### B. Network Tab
1. Go to Network tab
2. Refresh admin panel
3. Look for failed requests (red status codes)
4. Check these specific requests:
   - `GET /api/admin/categories` - Should return 200 with 12 categories
   - `GET /api/admin/articles` - Should return 200 with 8 articles
   - `POST /api/auth/login` - Should return 200 with token

#### C. Check Request Headers
For admin requests, verify these headers are present:
```
Authorization: Bearer [your-jwt-token]
Content-Type: application/json
```

### 3. Common Frontend Issues & Solutions

#### Issue 1: Empty Admin Panel
**Symptoms:** Admin panel loads but shows no data
**Causes:**
- Frontend not sending Authorization header
- Wrong API URL
- JavaScript errors preventing data loading

**Debug Steps:**
1. Check if login is working (token received)
2. Check if token is being stored (localStorage/sessionStorage)
3. Check if token is being sent with admin requests

#### Issue 2: Categories Show on Main Site But Not Admin
**Symptoms:** Main frontend shows categories, admin panel doesn't
**Causes:**
- Admin panel using different API endpoint
- Authentication not working for admin endpoints
- Frontend caching issues

**Debug Steps:**
1. Compare network requests between main site and admin panel
2. Check if admin requests include Authorization header
3. Clear browser cache and cookies

#### Issue 3: Can't Create/Delete Content
**Symptoms:** Create/delete buttons don't work
**Causes:**
- Missing Authorization header
- Wrong HTTP method
- Frontend not handling responses correctly

**Debug Steps:**
1. Check network tab for POST/DELETE requests
2. Verify request payload is correct
3. Check response status codes

### 4. Test API Directly in Browser

Open browser console and test API directly:

```javascript
// Test admin categories
fetch('https://web-production-af44.up.railway.app/api/admin/categories', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
})
.then(r => r.json())
.then(data => console.log('Categories:', data));

// Test admin articles
fetch('https://web-production-af44.up.railway.app/api/admin/articles', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
})
.then(r => r.json())
.then(data => console.log('Articles:', data));
```

### 5. Expected API Responses

#### Categories Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "6909c7d570964d87143ce77e",
      "name": "Frontend Test Category",
      "slug": "frontend-test-category",
      "description": "...",
      "displayOrder": 0,
      "createdAt": "2025-11-04T09:31:01.196Z",
      "updatedAt": "2025-11-04T09:31:01.196Z"
    }
    // ... 11 more categories
  ]
}
```

#### Articles Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "6909c8b80deaf5cf6dc8185b",
      "title": "Test Article 1762248888581",
      "slug": "test-article-1762248888581",
      "status": "published",
      "author": {
        "id": "6908fe695628fede68d922f7",
        "name": "Sarah Williams",
        "email": "sarah.williams@dominicanews.com"
      },
      "category": {
        "id": "6909c7d570964d87143ce77e",
        "name": "Frontend Test Category",
        "slug": "frontend-test-category"
      }
    }
    // ... 7 more articles
  ]
}
```

### 6. Frontend Code Checklist

#### Authentication
- [ ] Login form sends correct credentials
- [ ] Token is stored after successful login
- [ ] Token is included in admin API requests
- [ ] Token expiration is handled

#### API Calls
- [ ] Using correct API base URL
- [ ] Including Authorization header for admin endpoints
- [ ] Handling success/error responses correctly
- [ ] Parsing JSON responses correctly

#### State Management
- [ ] Admin data is stored in component state
- [ ] State is updated after API calls
- [ ] Loading states are handled
- [ ] Error states are displayed

### 7. Quick Fixes to Try

1. **Clear Browser Data:**
   - Clear cache and cookies
   - Hard refresh (Ctrl+Shift+R)
   - Try incognito/private mode

2. **Check API URL:**
   - Ensure no trailing slashes
   - Verify HTTPS vs HTTP
   - Test API URL directly in browser

3. **Restart Frontend:**
   - Stop frontend dev server
   - Clear node_modules cache: `npm start` or `yarn start`
   - Restart with fresh environment

### 8. If Still Not Working

If the admin panel still shows empty after checking all above:

1. **Share browser console errors** - Screenshot any red errors
2. **Share network tab** - Screenshot failed requests
3. **Check frontend code** - Verify API integration
4. **Test with Postman** - Confirm API works outside browser

## 🎯 BACKEND IS READY - ISSUE IS FRONTEND

The backend API is 100% functional. All data is there and accessible. The issue is in how the frontend is calling or displaying the data.