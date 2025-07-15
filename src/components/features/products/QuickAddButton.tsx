/**
 * Quick Add to Cart Button for Product Cards
 * 
 * Handles adding products with single variants directly from shop page,
 * or redirects to product page for multi-variant products.
 */

import React, { useState } from 'react';
import { useAddToCart } from '@lib/hooks/useCart';
import type { CartItem } from '@local-types/cart';

interface ProductVariant {
  id: string;
  name: string;
  options: Record<string, string>;
  price: number;
  imageUrl?: string;
}

interface QuickAddButtonProps {
  productId: string;
  productSlug: string;
  productName: string;
  variants: ProductVariant[];
  className?: string;
}

export default function QuickAddButton({
  productId,
  productSlug,
  productName,
  variants,
  className = '',
}: QuickAddButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  const { addToCart } = useAddToCart();
  
  // If multiple variants, redirect to product page
  if (!variants || variants.length > 1) {
    return (
      <a 
        href={`/shop/product/${productSlug}`}
        className={`btn btn-secondary text-sm py-1 px-3 ${className}`}
        aria-label="Select options"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      </a>
    );
  }
  
  // Single variant - can add directly
  const variant = variants?.[0];
  
  // If no variants available, show unavailable button
  if (!variant) {
    return (
      <button 
        disabled
        className={`btn btn-secondary text-sm py-1 px-3 opacity-50 cursor-not-allowed ${className}`}
        aria-label="Product unavailable"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </button>
    );
  }
  
  const handleQuickAdd = async () => {
    if (!variant || isAdding) return;
    
    setIsAdding(true);
    
    try {
      const cartItem: Omit<CartItem, 'quantity'> = {
        id: variant.id,
        productId,
        productSlug,
        name: productName,
        variantName: variant.name,
        options: variant.options,
        price: variant.price,
        imageUrl: variant.imageUrl,
      };
      
      addToCart(cartItem, 1);
      
      // Show success feedback
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
      
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const buttonContent = () => {
    if (isAdding) {
      return (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      );
    }
    
    if (justAdded) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
      );
    }
    
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
    );
  };

  return (
    <button 
      onClick={handleQuickAdd}
      disabled={isAdding}
      className={`btn ${justAdded ? 'btn-success' : 'btn-secondary'} text-sm py-1 px-3 ${className}`}
      aria-label={justAdded ? 'Added to cart!' : 'Add to cart'}
      title={justAdded ? 'Added to cart!' : 'Add to cart'}
    >
      {buttonContent()}
    </button>
  );
}