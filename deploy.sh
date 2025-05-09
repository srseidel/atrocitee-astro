#!/bin/bash

# Atrocitee Cloudflare Pages Deployment Script

echo "🚀 Building Atrocitee for Cloudflare Pages..."
npm run build

echo "🔍 Checking build output..."
if [ ! -d "dist" ]; then
  echo "❌ Build failed! No dist directory found."
  exit 1
fi

echo "📤 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist

echo "✅ Deployment completed!"
echo "Note: Make sure you've configured any necessary KV namespace in the Cloudflare dashboard"
echo "and updated the wrangler.toml file with the correct KV namespace ID if needed." 