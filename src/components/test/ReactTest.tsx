import React from 'react';

export default function ReactTest() {
  console.log('🎯 ReactTest component is rendering!');
  
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <h3 className="text-green-800 font-semibold">✅ React is Working!</h3>
      <p className="text-green-600 text-sm">This component confirms that React components can render on this page.</p>
    </div>
  );
}