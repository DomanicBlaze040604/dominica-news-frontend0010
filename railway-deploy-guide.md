# 🚂 Railway Deployment Guide

## Quick Deploy to Railway

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Initialize Railway Project
```bash
railway init
```

### 4. Set Environment Variables on Railway
```bash
railway variables set MONGODB_URI="mongodb+srv://dominica_admin:Hobfy5OCmXlSzPNO@cluster0.ek7bhnt.mongodb.net/dominica-news?retryWrites=true&w=majority&appName=Cluster0"
railway variables set JWT_SECRET="sbse-zyada-secret-key"
railway variables set JWT_EXPIRES_IN="24h"
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="https://dominicanews-d2aa9.web.app"
railway variables set ADMIN_EMAIL="admin@dominicanews.com"
railway variables set ADMIN_PASSWORD="Pass@12345"
railway variables set ADMIN_NAME="Admin User"
```

### 5. Deploy
```bash
railway up
```

### 6. Get Railway URL
```bash
railway domain
```

## Alternative: Update Railway Environment Variables via Web

1. Go to https://railway.app
2. Select your project
3. Go to Variables tab
4. Update the environment variables listed above
5. Redeploy the service