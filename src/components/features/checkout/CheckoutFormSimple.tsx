import React, { useState, useEffect } from 'react';
import { useSecureCart } from '@lib/hooks/useSecureCart';

export default function CheckoutFormSimple() {
  console.log('🚀 CheckoutFormSimple starting...');
  
  try {
    const { items, totalPrice, loading, error, validateCart } = useSecureCart();
    console.log('🚀 Cart data loaded:', { items: items?.length, totalPrice, loading, error });
    
    const [step, setStep] = useState<'cart' | 'customer' | 'payment'>('cart');
    
    // Calculate totals
    const subtotal = totalPrice;
    const tax = subtotal * 0.08;
    const shipping = 5.99;
    const total = subtotal + tax + shipping;
    
    console.log('🚀 Calculated totals:', { subtotal, tax, shipping, total });
    
    // Validate cart on load
    useEffect(() => {
      console.log('🚀 useEffect: validating cart...');
      validateCart();
    }, []);
    
    // Move to customer form if cart is valid
    useEffect(() => {
      console.log('🚀 useEffect: checking step transition...', { loading, error, itemCount: items.length, step });
      if (!loading && !error && items.length > 0 && step === 'cart') {
        console.log('🚀 Moving to customer step');
        setStep('customer');
      } else if (!loading && items.length === 0 && step === 'cart') {
        console.log('🚀 Cart is empty, should redirect');
        // Don't redirect in simplified version
      }
    }, [loading, error, items.length, step]);
    
    console.log('🚀 Rendering with step:', step);
    
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-blue-800 font-semibold">🚀 Simplified Checkout</h2>
          <div className="text-blue-600 text-sm mt-2">
            <p>• Step: {step}</p>
            <p>• Items: {items?.length || 0}</p>
            <p>• Subtotal: ${subtotal?.toFixed(2) || '0.00'}</p>
            <p>• Tax: ${tax?.toFixed(2) || '0.00'}</p>
            <p>• Shipping: ${shipping?.toFixed(2) || '0.00'}</p>
            <p>• Total: ${total?.toFixed(2) || '0.00'}</p>
            <p>• Loading: {loading ? 'Yes' : 'No'}</p>
            <p>• Error: {error || 'None'}</p>
          </div>
          
          <div className="mt-4 space-x-2">
            <button 
              onClick={() => setStep('cart')}
              className={`px-3 py-1 rounded text-sm ${step === 'cart' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Cart
            </button>
            <button 
              onClick={() => setStep('customer')}
              className={`px-3 py-1 rounded text-sm ${step === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Customer
            </button>
            <button 
              onClick={() => setStep('payment')}
              className={`px-3 py-1 rounded text-sm ${step === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Payment
            </button>
          </div>
        </div>
        
        {step === 'cart' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3>Cart Step</h3>
            <p>Validating cart...</p>
          </div>
        )}
        
        {step === 'customer' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3>Customer Step</h3>
            <p>This is where the customer form would be.</p>
            <button 
              onClick={() => setStep('payment')}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded"
            >
              Continue to Payment
            </button>
          </div>
        )}
        
        {step === 'payment' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3>Payment Step</h3>
            <p>This is where the Stripe payment form would be.</p>
          </div>
        )}
      </div>
    );
    
  } catch (err) {
    console.error('❌ Error in CheckoutFormSimple:', err);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">❌ Checkout Error</h3>
        <p className="text-red-600 text-sm mt-2">
          Error: {err instanceof Error ? err.message : String(err)}
        </p>
      </div>
    );
  }
}