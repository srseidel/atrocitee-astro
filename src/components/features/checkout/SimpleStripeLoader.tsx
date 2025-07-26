import React, { useState } from 'react';

export default function SimpleStripeLoader() {
  const [result, setResult] = useState('Click button to test');
  
  const testStripeLoad = () => {
    console.log('🧪 Starting Stripe load test...');
    setResult('Testing...');
    
    // Test 1: Check if already loaded
    if ((window as any).Stripe) {
      console.log('✅ Stripe already available');
      setResult('✅ Stripe already loaded');
      return;
    }
    
    console.log('📦 Stripe not found, creating script...');
    
    // Test 2: Try to create and load script
    const script = document.createElement('script');
    console.log('📝 Script element created:', script);
    
    script.onload = () => {
      console.log('🎉 Script onload fired');
      console.log('🔍 window.Stripe after load:', typeof (window as any).Stripe);
      if ((window as any).Stripe) {
        setResult('✅ Script loaded and Stripe available');
      } else {
        setResult('⚠️ Script loaded but Stripe not available');
      }
    };
    
    script.onerror = (error) => {
      console.error('💥 Script onerror fired:', error);
      setResult('❌ Script failed to load');
    };
    
    script.src = 'https://js.stripe.com/v3/';
    console.log('🌐 Script src set to:', script.src);
    
    try {
      document.head.appendChild(script);
      console.log('📋 Script appended to head');
      setResult('⏳ Script added, waiting for load...');
    } catch (err) {
      console.error('💀 Error appending script:', err);
      setResult(`❌ Error appending script: ${err}`);
    }
  };
  
  const checkNetwork = async () => {
    setResult('Testing network...');
    try {
      const response = await fetch('https://js.stripe.com/v3/', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      console.log('Network test response:', response);
      setResult('✅ Network fetch succeeded');
    } catch (err) {
      console.error('Network test failed:', err);
      setResult(`❌ Network test failed: ${err}`);
    }
  };
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <h3 className="text-red-800 font-semibold">🔬 Simple Stripe Loader</h3>
      <p className="text-red-600 text-sm mt-2">Result: {result}</p>
      
      <div className="mt-4 space-y-2">
        <button 
          onClick={testStripeLoad}
          className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm"
        >
          Test Stripe Load
        </button>
        
        <button 
          onClick={checkNetwork}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm"
        >
          Test Network
        </button>
        
        <button 
          onClick={() => {
            console.log('Current page location:', window.location.href);
            console.log('Document head children:', document.head.children.length);
            console.log('Existing scripts:', document.querySelectorAll('script').length);
            setResult('Check console for page info');
          }}
          className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm"
        >
          Debug Page Info
        </button>
      </div>
    </div>
  );
}