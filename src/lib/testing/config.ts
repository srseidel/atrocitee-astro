/**
 * Test Environment Configuration
 * 
 * Provides utilities and configuration for testing both Stripe and Printful
 * integrations in a safe environment without processing real payments or orders.
 */

import env from '@config/env';
import { TEST_CARDS } from '@lib/stripe/config';

// Test mode detection
export const isTestEnvironment = () => {
  return env.ENABLE_TEST_MODE || env.NODE_ENV === 'development';
};

// Stripe test configuration
export const STRIPE_TEST_CONFIG = {
  // Test card numbers for different scenarios
  CARDS: TEST_CARDS,
  
  // Test customer data
  TEST_CUSTOMER: {
    email: 'test@example.com',
    name: 'Test Customer',
    shipping: {
      line1: '123 Test Street',
      city: 'Test City',
      state: 'NY',
      postal_code: '12345',
      country: 'US',
    },
  },
  
  // Test amounts (in cents)
  TEST_AMOUNTS: {
    SMALL: 1000, // $10.00
    MEDIUM: 2500, // $25.00
    LARGE: 5000, // $50.00
  },
} as const;

// Printful test configuration
export const PRINTFUL_TEST_CONFIG = {
  // Test product IDs (these are common Printful catalog products)
  TEST_PRODUCTS: {
    UNISEX_TSHIRT: 71, // Bella + Canvas 3001 Unisex Short Sleeve Jersey T-Shirt
    HOODIE: 146, // Gildan 18500 Unisex Heavy Blend Hooded Sweatshirt
    MUG: 19, // 11oz White Mug
    TOTE_BAG: 163, // Organic Cotton Tote Bag
  },
  
  // Test variant IDs
  TEST_VARIANTS: {
    TSHIRT_BLACK_M: 4012, // Black Medium T-shirt
    TSHIRT_WHITE_L: 4013, // White Large T-shirt
    HOODIE_NAVY_M: 4742, // Navy Medium Hoodie
    MUG_WHITE_11OZ: 1116, // White 11oz Mug
  },
  
  // Test file for mockup generation
  TEST_DESIGN_URL: 'https://picsum.photos/1000/1000', // Placeholder image
  
  // Test order data
  TEST_ORDER: {
    external_id: 'test-order-' + Date.now(),
    shipping: 'STANDARD',
    items: [
      {
        sync_variant_id: 4012,
        quantity: 1,
        retail_price: '19.99',
        name: 'Test Product',
      },
    ],
    recipient: {
      name: 'Test Recipient',
      company: 'Test Company',
      address1: '123 Test Street',
      city: 'Test City',
      state_code: 'NY',
      country_code: 'US',
      zip: '12345',
      phone: '555-123-4567',
      email: 'test@example.com',
    },
  },
} as const;

// Test environment validation
export const validateTestEnvironment = () => {
  const errors: string[] = [];
  
  // Check Stripe configuration
  if (!env.STRIPE_SECRET_KEY) {
    errors.push('STRIPE_SECRET_KEY is missing');
  } else if (env.NODE_ENV === 'development' && !env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    errors.push('Development environment should use Stripe test keys (sk_test_*)');
  }
  
  if (!env.PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    errors.push('PUBLIC_STRIPE_PUBLISHABLE_KEY is missing');
  } else if (env.NODE_ENV === 'development' && !env.PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_')) {
    errors.push('Development environment should use Stripe test publishable keys (pk_test_*)');
  }
  
  // Check Printful configuration
  if (!env.PRINTFUL_API_KEY) {
    errors.push('PRINTFUL_API_KEY is missing');
  }
  
  if (errors.length > 0) {
    throw new Error(`Test environment validation failed:\n${errors.join('\n')}`);
  }
  
  return {
    stripe: {
      testMode: env.STRIPE_SECRET_KEY?.startsWith('sk_test_'),
      hasKeys: !!(env.STRIPE_SECRET_KEY && env.PUBLIC_STRIPE_PUBLISHABLE_KEY),
    },
    printful: {
      sandboxMode: env.PRINTFUL_SANDBOX_MODE,
      hasKey: !!env.PRINTFUL_API_KEY,
    },
  };
};

// Test order utilities
export const createTestOrder = (customData?: Partial<typeof PRINTFUL_TEST_CONFIG.TEST_ORDER>) => {
  return {
    ...PRINTFUL_TEST_CONFIG.TEST_ORDER,
    ...customData,
    external_id: 'test-order-' + Date.now(), // Always use unique ID
  };
};

// Test payment utilities
export const createTestPayment = (amount: number = STRIPE_TEST_CONFIG.TEST_AMOUNTS.MEDIUM) => {
  return {
    amount,
    currency: 'usd',
    customer: STRIPE_TEST_CONFIG.TEST_CUSTOMER,
    payment_method: {
      card: {
        number: STRIPE_TEST_CONFIG.CARDS.SUCCESS,
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    },
  };
};

// Environment setup warnings
export const displayTestWarnings = () => {
  if (isTestEnvironment()) {
    console.log(`
🧪 TEST MODE ACTIVE
┌─────────────────────────────────────────────────────────────┐
│ • Stripe: ${env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'Test Mode' : 'LIVE MODE ⚠️'}
│ • Printful: ${env.PRINTFUL_SANDBOX_MODE ? 'Sandbox Mode' : 'Production Mode ⚠️'}
│ • Environment: ${env.NODE_ENV}
│ 
│ Safe to test: No real payments or orders will be processed
└─────────────────────────────────────────────────────────────┘
    `);
  } else {
    console.warn(`
⚠️  PRODUCTION MODE ACTIVE
┌─────────────────────────────────────────────────────────────┐
│ • Real payments will be processed
│ • Real orders will be created and fulfilled
│ • Use with caution!
└─────────────────────────────────────────────────────────────┘
    `);
  }
};

// Test data generators
export const generateTestProduct = () => {
  return {
    id: 'test-product-' + Date.now(),
    name: 'Test Product',
    description: 'This is a test product for development',
    price: 19.99,
    variants: [
      {
        id: 'variant-1',
        name: 'Black - M',
        price: 19.99,
        options: { color: 'Black', size: 'M' },
      },
      {
        id: 'variant-2',
        name: 'White - L',
        price: 19.99,
        options: { color: 'White', size: 'L' },
      },
    ],
  };
};

export const generateTestCart = () => {
  const product = generateTestProduct();
  return [
    {
      id: product.variants[0].id,
      productId: product.id,
      productSlug: 'test-product',
      name: product.name,
      variantName: product.variants[0].name,
      options: product.variants[0].options,
      price: product.variants[0].price,
      quantity: 1,
      imageUrl: 'https://via.placeholder.com/300x300.png?text=Test+Product',
      maxQuantity: 10,
      in_stock: true,
    },
  ];
};

export default {
  isTestEnvironment,
  STRIPE_TEST_CONFIG,
  PRINTFUL_TEST_CONFIG,
  validateTestEnvironment,
  createTestOrder,
  createTestPayment,
  displayTestWarnings,
  generateTestProduct,
  generateTestCart,
};