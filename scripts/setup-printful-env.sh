#!/bin/bash
# Setup script for Printful API environment variables

# Instructions for how to use this script:
# 1. Replace YOUR_PRINTFUL_API_KEY with your actual Printful API key
# 2. Replace YOUR_WEBHOOK_SECRET with your Printful webhook secret (if you have one)
# 3. Run this script with: source setup-printful-env.sh

# Printful API Key (Required)
export PRINTFUL_API_KEY="YOUR_PRINTFUL_API_KEY"

# Printful Webhook Secret (Optional - only needed when setting up webhooks)
export PUBLIC_PRINTFUL_WEBHOOK_SECRET="YOUR_WEBHOOK_SECRET"

# For Cloudflare Wrangler (if using Cloudflare for deployment)
echo "Adding environment variables to wrangler.toml..."
if [ -f wrangler.toml ]; then
  # Check if variables already exist in the file
  if ! grep -q "PRINTFUL_API_KEY" wrangler.toml; then
    echo -e "\n# Printful API Integration" >> wrangler.toml
    echo "PRINTFUL_API_KEY = \"${PRINTFUL_API_KEY}\"" >> wrangler.toml
    echo "PUBLIC_PRINTFUL_WEBHOOK_SECRET = \"${PUBLIC_PRINTFUL_WEBHOOK_SECRET}\"" >> wrangler.toml
    echo "Added Printful variables to wrangler.toml"
  else
    echo "Printful variables already exist in wrangler.toml"
  fi
else
  echo "wrangler.toml not found. Skipping..."
fi

echo "====================================="
echo "Environment variables set up!"
echo "Printful API Key: ${PRINTFUL_API_KEY:0:5}..."
echo "====================================="
echo "To use these variables in your development environment, run:"
echo "source setup-printful-env.sh"
echo "=====================================" 