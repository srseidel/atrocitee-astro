import React, { useState, useEffect } from 'react';

export default function CheckoutFormDebug() {
  const [debugSteps, setDebugSteps] = useState<string[]>([]);
  const [cartData, setCartData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function testImports() {
      try {
        setDebugSteps(prev => [...prev, '✅ Step 1: Component mounted']);
        
        // Test dynamic import
        const hookModule = await import('@lib/hooks/useSecureCart');
        setDebugSteps(prev => [...prev, '✅ Step 2: Hook module imported']);
        
        const { useSecureCart } = hookModule;
        setDebugSteps(prev => [...prev, '✅ Step 3: useSecureCart extracted']);
        
        // This should be inside the component, not in useEffect
        // We'll just test the import for now
        setDebugSteps(prev => [...prev, '✅ Step 4: Ready to use hook']);
        
      } catch (err) {
        console.error('Import error:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    }
    
    testImports();
  }, []);
    
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-purple-800 font-semibold">🔍 Import Debug</h3>
        <div className="text-purple-600 text-sm mt-2">
          {debugSteps.map((step, i) => (
            <p key={i}>{step}</p>
          ))}
          {error && <p className="text-red-600">❌ Error: {error}</p>}
        </div>
      </div>
    </div>
  );
}