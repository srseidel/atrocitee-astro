import React from 'react';

export default function StripeKeyTest() {
  const publishableKey = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
      <h3 className="text-orange-800 font-semibold">🔑 Stripe Key Test</h3>
      <div className="text-orange-600 text-sm mt-2">
        <p>• Publishable Key Available: {publishableKey ? 'Yes' : 'No'}</p>
        {publishableKey && (
          <p>• Key Preview: {publishableKey.substring(0, 20)}...</p>
        )}
        {!publishableKey && (
          <p className="text-red-600">❌ PUBLIC_STRIPE_PUBLISHABLE_KEY is missing!</p>
        )}
        
      </div>
      
      <div className="mt-4 pt-3 border-t border-orange-200 space-y-2">
        <button 
          onClick={() => {
            // Check if Stripe is available globally
            const globalStripe = (window as any).Stripe;
            if (globalStripe) {
              alert('✅ Global Stripe found: ' + typeof globalStripe);
            } else {
              alert('❌ Global Stripe not found - script may not have loaded');
            }
          }}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm"
        >
          Check Global Stripe
        </button>
        
        <button 
          onClick={async () => {
            if (!publishableKey) {
              alert('No publishable key available');
              return;
            }
            
            try {
              console.log('Testing Stripe.js load with key:', publishableKey.substring(0, 20) + '...');
              const { loadStripe } = await import('@stripe/stripe-js');
              console.log('loadStripe function imported:', typeof loadStripe);
              
              const stripe = await loadStripe(publishableKey);
              console.log('loadStripe result:', stripe);
              
              if (stripe) {
                alert('✅ Stripe.js loaded successfully!');
                console.log('Stripe instance:', stripe);
              } else {
                alert('❌ Stripe.js failed to load - returned null');
              }
            } catch (err) {
              console.error('Stripe load error:', err);
              alert(`❌ Error loading Stripe.js: ${err instanceof Error ? err.message : String(err)}`);
            }
          }}
          className="w-full px-3 py-2 bg-orange-600 text-white rounded text-sm"
        >
          Test loadStripe()
        </button>
        
        <button 
          onClick={() => {
            // Try loading the script manually
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = () => {
              alert('✅ Stripe script loaded successfully');
              console.log('Stripe global:', (window as any).Stripe);
            };
            script.onerror = () => {
              alert('❌ Failed to load Stripe script from CDN');
            };
            document.head.appendChild(script);
          }}
          className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm"
        >
          Manual Script Load
        </button>
      </div>
    </div>
  );
}