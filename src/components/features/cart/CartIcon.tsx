/**
 * Cart Icon Component
 * 
 * Shopping cart icon with item count badge that opens the cart dropdown
 */

import React from 'react';
import { useCartCount, useCartOpen } from '@lib/hooks/useCart';

interface CartIconProps {
  className?: string;
}

export default function CartIcon({ className = '' }: CartIconProps) {
  const itemCount = useCartCount();
  const { toggleCart } = useCartOpen();

  return (
    <button
      onClick={toggleCart}
      className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      {/* Shopping Cart SVG */}
      <svg 
        className="w-6 h-6" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
        />
      </svg>

      {/* Item Count Badge */}
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}