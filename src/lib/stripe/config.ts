import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';
import env from '@config/env';

// Validate Stripe keys format
function validateStripeKeys() {
  const isTestSecretKey = env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
  const isTestPublishableKey = env.PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_');
  const isLiveSecretKey = env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
  const isLivePublishableKey = env.PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_');

  // In production, require live keys
  if (env.NODE_ENV === 'production') {
    if (!isLiveSecretKey || !isLivePublishableKey) {
      throw new Error('Production environment requires live Stripe keys (sk_live_* and pk_live_*)');
    }
  }
  
  // In development, prefer test keys but allow live keys with warning
  if (env.NODE_ENV === 'development') {
    if (isLiveSecretKey || isLivePublishableKey) {
      console.warn('⚠️  Warning: Using live Stripe keys in development mode!');
    }
  }

  // Ensure both keys are the same type (test or live)
  if ((isTestSecretKey && !isTestPublishableKey) || (isLiveSecretKey && !isLivePublishableKey)) {
    throw new Error('Stripe secret and publishable keys must be the same type (both test or both live)');
  }
}

// Validate keys on initialization
if (env.STRIPE_SECRET_KEY && env.PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  validateStripeKeys();
}

// Server-side Stripe client (for API routes)
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Client-side Stripe (for frontend components)
export const getStripeClient = () => {
  return loadStripe(env.PUBLIC_STRIPE_PUBLISHABLE_KEY);
};

// Check if we're in test mode
export const isTestMode = () => {
  return env.ENABLE_TEST_MODE || env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
};

// Stripe configuration constants
export const STRIPE_CONFIG = {
  currency: 'usd',
  paymentMethodTypes: ['card'],
  mode: 'payment',
  successUrl: `${env.PUBLIC_SITE_URL}/checkout/success`,
  cancelUrl: `${env.PUBLIC_SITE_URL}/checkout/cancel`,
} as const;

// Test card numbers for development
export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  EXPIRED: '4000000000000069',
  INCORRECT_CVC: '4000000000000127',
  PROCESSING_ERROR: '4000000000000119',
  INSUFFICIENT_FUNDS: '4000000000009995',
} as const;