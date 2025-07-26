import React, { useState, useEffect } from 'react';

export default function SimpleCheckoutTest() {
  const [message, setMessage] = useState('Loading...');
  
  useEffect(() => {
    setMessage('✅ React component loaded and useEffect ran');
    
    // Check if we have items in localStorage (basic cart check)
    try {
      const cartData = localStorage.getItem('atrocitee-secure-cart');
      const parsedCart = cartData ? JSON.parse(cartData) : [];
      setMessage(`✅ React working. Cart items in localStorage: ${parsedCart.length}`);
    } catch (err) {
      setMessage(`❌ Error reading localStorage: ${err}`);
    }
  }, []);
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-blue-800 font-semibold">🧪 Simple Test</h3>
      <p className="text-blue-600 text-sm mt-2">{message}</p>
      <button 
        onClick={() => {
          setMessage(`Button clicked at ${new Date().toLocaleTimeString()}`);
        }}
        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
      >
        Test Interaction
      </button>
    </div>
  );
}