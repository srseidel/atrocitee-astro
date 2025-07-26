import React from 'react';
import { useSecureCart } from '@lib/hooks/useSecureCart';

export default function ActualCartTest() {
  console.log('🎯 ActualCartTest rendering...');
  
  try {
    const cartData = useSecureCart();
    console.log('🎯 Cart data received:', cartData);
    
    const { items, totalPrice, loading, error, validateCart } = cartData;
    
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <h3 className="text-green-800 font-semibold">🎯 Actual Cart Test</h3>
        <div className="text-green-600 text-sm mt-2">
          <p>• Items: {items?.length || 0}</p>
          <p>• Total Price: ${totalPrice || '0.00'}</p>
          <p>• Loading: {loading ? 'Yes' : 'No'}</p>
          <p>• Error: {error || 'None'}</p>
        </div>
        
        <button 
          onClick={() => {
            console.log('Validate cart clicked');
            validateCart();
          }}
          className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm"
        >
          Validate Cart
        </button>
        
        {items && items.length > 0 && (
          <div className="mt-2 text-xs">
            <strong>First item:</strong>
            <pre className="bg-green-100 p-2 rounded mt-1">
              {JSON.stringify(items[0], null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  } catch (err) {
    console.error('❌ Error in ActualCartTest:', err);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <h3 className="text-red-800 font-semibold">❌ Cart Test Error</h3>
        <p className="text-red-600 text-sm mt-2">
          Error: {err instanceof Error ? err.message : String(err)}
        </p>
      </div>
    );
  }
}