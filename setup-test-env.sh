#!/bin/bash
# Test Environment Setup Script
# This script helps you set up your test environment for Stripe and Printful testing

echo "🧪 Atrocitee Test Environment Setup"
echo "=================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "⚠️  .env file already exists"
fi

echo ""
echo "🔑 Environment Variables Setup"
echo "=============================="

echo "Please set up the following environment variables in your .env file:"
echo ""

echo "1. STRIPE TEST KEYS:"
echo "   - Go to: https://dashboard.stripe.com/test/apikeys"
echo "   - Copy your test keys (they start with sk_test_ and pk_test_)"
echo "   - Add to .env:"
echo "     STRIPE_SECRET_KEY=sk_test_your_secret_key_here"
echo "     PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here"
echo ""

echo "2. PRINTFUL API KEY:"
echo "   - Go to: https://www.printful.com/dashboard/store"
echo "   - Navigate to Settings > API"
echo "   - Generate or copy your API key"
echo "   - Add to .env:"
echo "     PRINTFUL_API_KEY=your_printful_api_key_here"
echo ""

echo "3. ENABLE TEST MODE:"
echo "   - Add to .env:"
echo "     PRINTFUL_SANDBOX_MODE=true"
echo "     ENABLE_TEST_MODE=true"
echo "     PUBLIC_SHOW_DEBUG=true"
echo ""

echo "4. SUPABASE (if not already configured):"
echo "   - Go to: https://app.supabase.com/project/your-project/settings/api"
echo "   - Add to .env:"
echo "     PUBLIC_SUPABASE_URL=your_supabase_url"
echo "     PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
echo ""

echo "📋 Next Steps:"
echo "=============="
echo "1. Edit your .env file with the keys above"
echo "2. Restart your development server: npm run dev"
echo "3. Visit /admin/test-orders to test your configuration"
echo "4. Run verification script: npm run verify-test-config"
echo ""

echo "🎯 Test Cards (for Stripe testing):"
echo "==================================="
echo "Success: 4242424242424242"
echo "Declined: 4000000000000002"
echo "Expired: 4000000000000069"
echo "Incorrect CVC: 4000000000000127"
echo ""

echo "✅ Setup script complete!"
echo "Edit your .env file and restart the server to begin testing."