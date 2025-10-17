#!/bin/bash

# Deploy Script untuk Sumber Jaya App
# Vercel Production Deployment

echo "🚀 Starting deployment to Vercel..."
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found!"
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel"
    echo "🔑 Please login first:"
    vercel login
fi

# Deploy to production
echo ""
echo "🚀 Deploying to production..."
echo ""

vercel --prod --yes

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Check URL yang diberikan oleh Vercel"
echo "2. Set environment variable REACT_APP_API_URL di Vercel Dashboard"
echo "3. Test aplikasi dengan login: hengky / hengky123"
echo ""
echo "🎉 Done!"

