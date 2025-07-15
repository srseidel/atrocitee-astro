import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';
import env from '@config/env';

// Server-side Stripe client (for API routes)
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Client-side Stripe (for frontend components)
export const getStripeClient = () => {
  return loadStripe(env.PUBLIC_STRIPE_PUBLISHABLE_KEY);
};

// Stripe configuration constants
export const STRIPE_CONFIG = {
  currency: 'usd',
  paymentMethodTypes: ['card'],
  mode: env.NODE_ENV === 'production' ? 'payment' : 'payment', // Always payment mode for now
  successUrl: `${env.PUBLIC_SITE_URL}/checkout/success`,
  cancelUrl: `${env.PUBLIC_SITE_URL}/checkout/cancel`,
} as const;