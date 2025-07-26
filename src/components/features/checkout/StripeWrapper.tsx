/**
 * Stripe Wrapper Component
 * 
 * Handles proper Stripe initialization and loading states
 */

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import LoadingSpinner from '@components/common/LoadingSpinner';

interface StripeWrapperProps {
  clientSecret: string;
  children: React.ReactNode;
}

export default function StripeWrapper({ clientSecret, children }: StripeWrapperProps) {
  const [stripe, setStripe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const publishableKey = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
        
        
        if (!publishableKey) {
          throw new Error('Missing PUBLIC_STRIPE_PUBLISHABLE_KEY');
        }

        const stripeInstance = await loadStripe(publishableKey);
        
        if (!stripeInstance) {
          throw new Error('Failed to load Stripe');
        }

        setStripe(stripeInstance);
      } catch (err) {
        console.error('StripeWrapper: Failed to load Stripe:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Stripe');
      } finally {
        setLoading(false);
      }
    };

    initializeStripe();
  }, []);


  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <LoadingSpinner message="Loading payment system..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <h3 className="text-lg font-semibold text-red-800">Payment System Error</h3>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
        <p className="text-sm text-red-600 mt-1">Please refresh the page and try again.</p>
      </div>
    );
  }

  if (!stripe) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">Payment system not available. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div>
      {import.meta.env.DEV && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
          <strong>StripeWrapper Status:</strong>
          <br />• Stripe: ✅ Loaded successfully
          <br />• Client Secret: {clientSecret ? `${clientSecret.substring(0, 20)}...` : '❌ Missing'}
        </div>
      )}
      
      <Elements stripe={stripe} options={{ clientSecret }}>
        {children}
      </Elements>
    </div>
  );
}