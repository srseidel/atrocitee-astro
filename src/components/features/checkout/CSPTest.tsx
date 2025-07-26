import React, { useState, useEffect } from 'react';

export default function CSPTest() {
  const [info, setInfo] = useState<string[]>(['Loading...']);
  
  useEffect(() => {
    const results: string[] = [];
    
    // Check CSP
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (metaCSP) {
      results.push(`CSP Meta: ${(metaCSP as HTMLMetaElement).content}`);
    } else {
      results.push('No CSP meta tag found');
    }
    
    // Check if we can create scripts
    try {
      const testScript = document.createElement('script');
      testScript.textContent = 'console.log("CSP test script executed");';
      document.head.appendChild(testScript);
      document.head.removeChild(testScript);
      results.push('✅ Can create and execute scripts');
    } catch (err) {
      results.push(`❌ Cannot create scripts: ${err}`);
    }
    
    // Check existing scripts
    const scripts = document.querySelectorAll('script');
    results.push(`Existing scripts: ${scripts.length}`);
    
    // Check for Stripe scripts specifically
    const stripeScripts = document.querySelectorAll('script[src*="stripe"]');
    results.push(`Stripe scripts: ${stripeScripts.length}`);
    
    // Test fetch to Stripe
    fetch('https://js.stripe.com/v3/', { 
      method: 'HEAD',
      mode: 'no-cors'
    }).then(() => {
      results.push('✅ Can fetch Stripe CDN');
      setInfo([...results]);
    }).catch(err => {
      results.push(`❌ Cannot fetch Stripe CDN: ${err}`);
      setInfo([...results]);
    });
    
    setInfo(results);
  }, []);
  
  const testInlineScript = () => {
    try {
      // Test if we can execute inline scripts
      const script = document.createElement('script');
      script.textContent = `
        console.log('🧪 Inline script test executed');
        window.testValue = 'inline-script-works';
      `;
      document.head.appendChild(script);
      
      setTimeout(() => {
        if ((window as any).testValue === 'inline-script-works') {
          setInfo(prev => [...prev, '✅ Inline scripts work']);
        } else {
          setInfo(prev => [...prev, '❌ Inline scripts blocked']);
        }
        document.head.removeChild(script);
      }, 100);
    } catch (err) {
      setInfo(prev => [...prev, `❌ Error with inline script: ${err}`]);
    }
  };
  
  const testExternalScript = () => {
    try {
      // Test loading a simple external script
      const script = document.createElement('script');
      script.onload = () => {
        setInfo(prev => [...prev, '✅ External script loaded']);
      };
      script.onerror = () => {
        setInfo(prev => [...prev, '❌ External script failed']);
      };
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js';
      document.head.appendChild(script);
    } catch (err) {
      setInfo(prev => [...prev, `❌ Error loading external script: ${err}`]);
    }
  };
  
  return (
    <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
      <h3 className="text-pink-800 font-semibold">🔒 CSP & Security Test</h3>
      
      <div className="mt-2 space-y-1 text-sm">
        {info.map((item, i) => (
          <div key={i} className={item.includes('❌') ? 'text-red-600' : 'text-green-600'}>
            {item}
          </div>
        ))}
      </div>
      
      <div className="mt-4 space-y-2">
        <button 
          onClick={testInlineScript}
          className="w-full px-3 py-2 bg-pink-600 text-white rounded text-sm"
        >
          Test Inline Script
        </button>
        
        <button 
          onClick={testExternalScript}
          className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm"
        >
          Test External Script
        </button>
      </div>
    </div>
  );
}