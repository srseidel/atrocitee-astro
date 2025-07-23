/**
 * Simple Test API - Just returns basic info
 */

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  console.log('Simple test API called');
  
  return new Response(
    JSON.stringify({
      message: 'API is working',
      timestamp: new Date().toISOString(),
      env: {
        NODE_ENV: import.meta.env.NODE_ENV,
        hasStripeSecret: !!import.meta.env.STRIPE_SECRET_KEY,
        hasStripePublic: !!import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY,
        hasEnableTestMode: !!import.meta.env.ENABLE_TEST_MODE,
        enableTestModeValue: import.meta.env.ENABLE_TEST_MODE,
      },
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};