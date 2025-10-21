#!/bin/bash

echo "🚀 Preparing Sumber Jaya App for Deployment"
echo "============================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📝 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git repository already exists"
fi

echo ""
echo "📋 Files ready for deployment:"
echo ""
echo "Backend Files:"
echo "  ✅ backend/server.js"
echo "  ✅ backend/package.json"
echo "  ✅ backend/database.sql"
echo "  ✅ backend/railway.json"
echo ""
echo "Frontend Files:"
echo "  ✅ frontend/src/App.js"
echo "  ✅ frontend/src/services/api.js"
echo "  ✅ frontend/package.json"
echo "  ✅ frontend/public/"
echo ""

# Stage all files
echo "📦 Staging all files..."
git add .

echo ""
echo "✅ All files staged and ready!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Create GitHub repository:"
echo "   → Go to https://github.com/new"
echo "   → Name: sumber-jaya-app"
echo "   → Keep it PRIVATE"
echo "   → DON'T initialize with README"
echo ""
echo "2️⃣  Commit and push:"
echo "   git commit -m \"Ready for deployment\""
echo "   git branch -M main"
echo "   git remote add origin https://github.com/YOUR_USERNAME/sumber-jaya-app.git"
echo "   git push -u origin main"
echo ""
echo "3️⃣  Deploy to Railway (Backend + Database):"
echo "   → https://railway.app"
echo "   → New Project → Deploy from GitHub"
echo "   → Add MySQL database"
echo "   → Import backend/database.sql"
echo ""
echo "4️⃣  Deploy to Vercel (Frontend):"
echo "   → https://vercel.com"
echo "   → Import Project → Select repo"
echo "   → Root Directory: frontend"
echo "   → Add env: REACT_APP_API_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Full guide: See README.md or DEPLOYMENT.md"
echo ""

