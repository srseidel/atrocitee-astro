import React, { useState } from 'react';

export default function NetworkTest() {
  const [results, setResults] = useState<string[]>([]);
  
  const testEndpoint = async (name: string, url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      setResults(prev => [...prev, `✅ ${name}: Reachable`]);
    } catch (err) {
      setResults(prev => [...prev, `❌ ${name}: ${err instanceof Error ? err.message : 'Failed'}`]);
    }
  };
  
  const runNetworkTests = async () => {
    setResults(['🔍 Testing network connectivity...']);
    
    // Test various endpoints
    await testEndpoint('Stripe CDN', 'https://js.stripe.com/v3/');
    await testEndpoint('UnpkgCDN', 'https://unpkg.com/@stripe/stripe-js@latest/dist/stripe.umd.js');
    await testEndpoint('Google', 'https://www.google.com');
    await testEndpoint('GitHub', 'https://api.github.com');
    
    // Test Stripe API
    try {
      const response = await fetch('https://api.stripe.com/healthcheck');
      setResults(prev => [...prev, `✅ Stripe API: ${response.status}`]);
    } catch (err) {
      setResults(prev => [...prev, `❌ Stripe API: ${err instanceof Error ? err.message : 'Failed'}`]);
    }
    
    setResults(prev => [...prev, '🏁 Network tests complete']);
  };
  
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
      <h3 className="text-purple-800 font-semibold">🌐 Network Test</h3>
      
      <button 
        onClick={runNetworkTests}
        className="mt-2 px-4 py-2 bg-purple-600 text-white rounded"
      >
        Test Network Connectivity
      </button>
      
      <div className="mt-4 text-sm font-mono space-y-1">
        {results.map((result, i) => (
          <div key={i} className={result.includes('❌') ? 'text-red-600' : 'text-green-600'}>
            {result}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-purple-600">
        <p><strong>Possible solutions if Stripe CDN is blocked:</strong></p>
        <ul className="list-disc list-inside mt-1">
          <li>Check corporate firewall/proxy settings</li>
          <li>Try different network (mobile hotspot)</li>
          <li>Use VPN if available</li>
          <li>Contact IT about whitelisting js.stripe.com</li>
        </ul>
      </div>
    </div>
  );
}