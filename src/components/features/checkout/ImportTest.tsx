import React, { useState } from 'react';

export default function ImportTest() {
  const [results, setResults] = useState<string[]>([]);
  
  const testImport = async (importName: string, importFunc: () => Promise<any>) => {
    try {
      await importFunc();
      setResults(prev => [...prev, `✅ ${importName} - OK`]);
    } catch (err) {
      setResults(prev => [...prev, `❌ ${importName} - Error: ${err instanceof Error ? err.message : String(err)}`]);
    }
  };
  
  const runTests = async () => {
    setResults(['🧪 Testing imports...']);
    
    await testImport('OrderSummary', () => import('./OrderSummary'));
    await testImport('CustomerForm', () => import('./CustomerForm'));
    await testImport('PaymentForm', () => import('./PaymentForm'));
    await testImport('StripeWrapper', () => import('./StripeWrapper'));
    await testImport('LoadingSpinner', () => import('@components/common/LoadingSpinner'));
    
    setResults(prev => [...prev, '🏁 Import tests complete']);
  };
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-yellow-800 font-semibold">🧪 Import Test</h3>
      
      <button 
        onClick={runTests}
        className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded"
      >
        Test All Imports
      </button>
      
      <div className="mt-4 text-sm font-mono">
        {results.map((result, i) => (
          <div key={i} className={result.includes('❌') ? 'text-red-600' : 'text-green-600'}>
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}