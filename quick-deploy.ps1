Write-Host "🚂 Quick Deploy to Railway Production" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Step 1: Build the project
Write-Host ""
Write-Host "1. Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix errors and try again." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green

# Step 2: Commit changes (if any)
Write-Host ""
Write-Host "2. Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "Fix backend API endpoints and ID consistency for frontend integration"
if ($LASTEXITCODE -ne 0) {
    Write-Host "No changes to commit" -ForegroundColor Gray
}

# Step 3: Deploy to Railway
Write-Host ""
Write-Host "3. Deploying to Railway..." -ForegroundColor Yellow
railway up
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful" -ForegroundColor Green
} else {
    Write-Host "⚠️ Railway CLI deployment failed" -ForegroundColor Yellow
    Write-Host "Please deploy manually via Railway dashboard" -ForegroundColor Yellow
}

# Step 4: Get Railway URL
Write-Host ""
Write-Host "4. Getting Railway URL..." -ForegroundColor Yellow
railway domain
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please check Railway dashboard for your URL" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎉 Deployment process complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Wait 2-3 minutes for deployment to complete"
Write-Host "2. Run: node test-production-api.js"
Write-Host "3. Update frontend VITE_API_BASE_URL to your Railway URL"
Write-Host "4. Test frontend with production backend"