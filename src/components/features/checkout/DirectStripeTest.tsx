import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    Stripe: any;
  }
}

export default function DirectStripeTest() {
  const [stripeStatus, setStripeStatus] = useState('Checking...');
  const [stripe, setStripe] = useState<any>(null);
  
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    
    const loadStripeManually = () => {
      console.log('🔄 Attempting to load Stripe.js manually...');
      
      // Remove any existing Stripe scripts
      const existingScripts = document.querySelectorAll('script[src*="stripe.com"]');
      existingScripts.forEach(script => script.remove());
      
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => {
          console.log('✅ Stripe script loaded successfully');
          console.log('window.Stripe:', typeof window.Stripe);
          if (window.Stripe) {
            resolve();
          } else {
            reject(new Error('Stripe script loaded but window.Stripe is undefined'));
          }
        };
        script.onerror = (err) => {
          console.error('❌ Failed to load Stripe script:', err);
          reject(new Error('Failed to load Stripe script from CDN'));
        };
        document.head.appendChild(script);
      });
    };
    
    const checkStripe = async () => {
      attempts++;
      console.log(`🔍 Checking for Stripe (attempt ${attempts}/${maxAttempts})`);
      
      if (window.Stripe) {
        setStripeStatus('✅ Global Stripe found');
        try {
          const publishableKey = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
          const stripeInstance = window.Stripe(publishableKey);
          setStripe(stripeInstance);
          setStripeStatus('✅ Stripe instance created successfully');
        } catch (err) {
          setStripeStatus(`❌ Error creating Stripe instance: ${err}`);
        }
      } else if (attempts === 1) {
        // First attempt - try loading manually
        setStripeStatus('🔄 Loading Stripe.js...');
        try {
          await loadStripeManually();
          // After manual load, check again
          setTimeout(checkStripe, 100);
        } catch (err) {
          setStripeStatus(`❌ Failed to load Stripe: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else if (attempts < maxAttempts) {
        setStripeStatus(`⏳ Waiting for Stripe... (${attempts}/${maxAttempts})`);
        setTimeout(checkStripe, 100);
      } else {
        setStripeStatus('❌ Timeout: Stripe failed to load after 5 seconds');
      }
    };
    
    checkStripe();
  }, []);
  
  const testPaymentElement = async () => {
    if (!stripe) {
      alert('Stripe not ready');
      return;
    }
    
    try {
      // Create a test payment intent
      const response = await fetch('/api/v1/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ variantId: 'test', quantity: 1 }],
          shipping: { line1: 'test', city: 'test', state: 'NY', postal_code: '12345', country: 'US' },
          customerEmail: 'test@example.com'
        })
      });
      
      const data = await response.json();
      
      if (data.clientSecret) {
        alert(`✅ Payment Intent created: ${data.clientSecret.substring(0, 20)}...`);
        
        // Try to create elements
        const elements = stripe.elements({ clientSecret: data.clientSecret });
        alert('✅ Elements created successfully');
        
        // Try to create payment element
        const paymentElement = elements.create('payment');
        alert('✅ PaymentElement created successfully');
        
      } else {
        alert(`❌ Failed to create payment intent: ${data.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
      <h3 className="text-indigo-800 font-semibold">⚡ Direct Stripe Test</h3>
      <p className="text-indigo-600 text-sm mt-2">Status: {stripeStatus}</p>
      
      <div className="mt-4 space-y-2">
        <button 
          onClick={() => {
            if (window.Stripe) {
              alert('✅ window.Stripe available: ' + typeof window.Stripe);
              console.log('Stripe object:', window.Stripe);
            } else {
              alert('❌ window.Stripe not available');
            }
          }}
          className="w-full px-3 py-2 bg-indigo-600 text-white rounded text-sm"
        >
          Check window.Stripe
        </button>
        
        <button 
          onClick={testPaymentElement}
          disabled={!stripe}
          className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm disabled:opacity-50"
        >
          Test Full Payment Flow
        </button>
      </div>
      
      {stripe && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
          <p className="text-green-800">✅ Stripe instance ready!</p>
          <p className="text-green-600">Type: {typeof stripe}</p>
        </div>
      )}
    </div>
  );
}