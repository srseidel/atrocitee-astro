/**
 * Test Configuration Verification Script
 * 
 * Run this script to verify that your test environment is properly configured
 * for both Stripe and Printful testing.
 */

import { validateTestEnvironment, displayTestWarnings } from '@lib/testing/config';
import { stripe, isTestMode } from '@lib/stripe/config';
import { PrintfulClient } from '@lib/printful/api-client';
import env from '@config/env';

async function verifyStripeConfig() {
  console.log('\n🔍 Verifying Stripe Configuration...');
  
  try {
    // Check if we're in test mode
    const testMode = isTestMode();
    console.log(`✓ Test Mode: ${testMode ? 'Enabled' : 'Disabled'}`);
    
    // Test Stripe connection
    const products = await stripe.products.list({ limit: 1 });
    console.log(`✓ Stripe API Connection: Working`);
    console.log(`  - Products accessible: ${products.data.length >= 0 ? 'Yes' : 'No'}`);
    
    // Verify key format
    const keyType = env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'Test' : 'Live';
    console.log(`✓ Key Type: ${keyType}`);
    
    if (env.NODE_ENV === 'development' && keyType === 'Live') {
      console.warn('⚠️  Warning: Using live keys in development!');
    }
    
    return true;
  } catch (error) {
    console.error('✗ Stripe configuration failed:', error);
    return false;
  }
}

async function verifyPrintfulConfig() {
  console.log('\n🔍 Verifying Printful Configuration...');
  
  try {
    const client = new PrintfulClient();
    
    // Test Printful connection
    const products = await client.getSyncProducts();
    console.log(`✓ Printful API Connection: Working`);
    console.log(`  - Products accessible: ${products.length >= 0 ? 'Yes' : 'No'}`);
    
    // Check sandbox mode
    const sandboxMode = env.PRINTFUL_SANDBOX_MODE;
    console.log(`✓ Sandbox Mode: ${sandboxMode ? 'Enabled' : 'Disabled'}`);
    
    if (env.NODE_ENV === 'development' && !sandboxMode) {
      console.warn('⚠️  Warning: Sandbox mode disabled in development!');
    }
    
    return true;
  } catch (error) {
    console.error('✗ Printful configuration failed:', error);
    return false;
  }
}

async function testEndToEndFlow() {
  console.log('\n🔍 Testing End-to-End Flow...');
  
  try {
    // Test cart validation endpoint
    const testCart = [
      {
        variantId: 'test-variant-1',
        quantity: 1,
      },
    ];
    
    const cartResponse = await fetch('/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: testCart }),
    });
    
    if (cartResponse.ok) {
      console.log('✓ Cart validation endpoint: Working');
    } else {
      console.log('✗ Cart validation endpoint: Failed');
      return false;
    }
    
    // Test payment intent creation
    const paymentResponse = await fetch('/api/v1/checkout/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            id: 'test-item',
            price: 19.99,
            quantity: 1,
          },
        ],
        customerEmail: 'test@example.com',
      }),
    });
    
    if (paymentResponse.ok) {
      console.log('✓ Payment intent creation: Working');
    } else {
      console.log('✗ Payment intent creation: Failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('✗ End-to-end flow test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🧪 Atrocitee Test Configuration Verification');
  console.log('============================================');
  
  // Display environment warnings
  displayTestWarnings();
  
  // Validate environment configuration
  try {
    const config = validateTestEnvironment();
    console.log('\n✓ Environment validation passed');
    console.log('  - Stripe:', config.stripe);
    console.log('  - Printful:', config.printful);
  } catch (error) {
    console.error('\n✗ Environment validation failed:', error);
    process.exit(1);
  }
  
  // Test individual services
  const results = await Promise.allSettled([
    verifyStripeConfig(),
    verifyPrintfulConfig(),
    testEndToEndFlow(),
  ]);
  
  // Summary
  const successes = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const total = results.length;
  
  console.log('\n📊 Test Results Summary');
  console.log('=====================');
  console.log(`✓ Passed: ${successes}/${total}`);
  console.log(`✗ Failed: ${total - successes}/${total}`);
  
  if (successes === total) {
    console.log('\n🎉 All tests passed! Your environment is ready for testing.');
  } else {
    console.log('\n❌ Some tests failed. Check the configuration and try again.');
    process.exit(1);
  }
}

// Run the verification
main().catch(error => {
  console.error('Verification script failed:', error);
  process.exit(1);
});

export default main;