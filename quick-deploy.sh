#!/bin/bash

echo "🚂 Quick Deploy to Railway Production"
echo "====================================="

# Step 1: Build the project
echo ""
echo "1. Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi
echo "✅ Build successful"

# Step 2: Commit changes (if any)
echo ""
echo "2. Committing changes..."
git add .
git commit -m "Fix backend API endpoints and ID consistency for frontend integration" || echo "No changes to commit"

# Step 3: Deploy to Railway
echo ""
echo "3. Deploying to Railway..."
railway up
if [ $? -eq 0 ]; then
    echo "✅ Deployment successful"
else
    echo "⚠️ Railway CLI deployment failed"
    echo "Please deploy manually via Railway dashboard"
fi

# Step 4: Get Railway URL
echo ""
echo "4. Getting Railway URL..."
railway domain || echo "Please check Railway dashboard for your URL"

echo ""
echo "🎉 Deployment process complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Wait 2-3 minutes for deployment to complete"
echo "2. Run: node test-production-api.js"
echo "3. Update frontend VITE_API_BASE_URL to your Railway URL"
echo "4. Test frontend with production backend"