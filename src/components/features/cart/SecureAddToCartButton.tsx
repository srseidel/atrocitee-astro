/**
 * Secure Add to Cart Button Component
 * 
 * This component only sends variant IDs to the cart system.
 * All product data is validated server-side to prevent manipulation.
 */

import React, { useState, useEffect } from 'react';
import { useSecureAddToCart } from '@lib/hooks/useSecureCart';
import { debug } from '@lib/utils/debug';

interface SecureAddToCartButtonProps {
  variantId: string;
  disabled?: boolean;
  className?: string;
}

export default function SecureAddToCartButton({
  variantId: initialVariantId,
  disabled = false,
  className = '',
}: SecureAddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  // State that can be updated by variant selection
  const [variantId, setVariantId] = useState(initialVariantId);
  
  const { addToCart, loading, error, isInCart, getQuantity } = useSecureAddToCart();
  
  // Listen for variant selection changes
  useEffect(() => {
    const handleVariantChange = (event: CustomEvent) => {
      const { variant } = event.detail;
      setVariantId(variant.id);
    };
    
    window.addEventListener('variant-selected', handleVariantChange as EventListener);
    
    return () => {
      window.removeEventListener('variant-selected', handleVariantChange as EventListener);
    };
  }, []);
  
  const currentQuantityInCart = getQuantity(variantId);
  
  const handleAddToCart = async () => {
    if (disabled || isAdding) return;
    
    setIsAdding(true);
    
    try {
      const success = await addToCart(variantId, quantity);
      
      if (success) {
        // Show success feedback
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
      }
    } catch (error) {
      debug.criticalError('Failed to add to cart from SecureAddToCartButton', error, { variantId });
    } finally {
      setIsAdding(false);
    }
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const buttonText = () => {
    if (isAdding || loading) return 'Adding...';
    if (justAdded) return 'Added to Cart!';
    if (isInCart(variantId)) return `Add ${quantity} More`;
    return 'Add to Cart';
  };

  const buttonClass = `
    w-full py-3 px-6 rounded-lg font-medium transition-all duration-200
    ${justAdded 
      ? 'bg-green-600 text-white' 
      : disabled || loading
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
        : 'bg-primary text-white hover:bg-primary-dark active:scale-95'
    }
    ${className}
  `.trim();

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center justify-center space-x-4">
        <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
          Quantity:
        </label>
        <div className="flex items-center border border-gray-300 rounded-md">
          <button
            type="button"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="px-4 py-1 text-center min-w-[3rem] border-x border-gray-300">
            {quantity}
          </span>
          <button
            type="button"
            onClick={incrementQuantity}
            className="px-3 py-1 text-gray-600 hover:text-gray-800"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Stock Info */}
      {currentQuantityInCart > 0 && (
        <p className="text-sm text-gray-600 text-center">
          {currentQuantityInCart} already in cart
        </p>
      )}
      
      {/* Error Display */}
      {error && (
        <p className="text-sm text-red-600 text-center">
          {error}
        </p>
      )}

      {/* Add to Cart Button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || isAdding || loading}
        className={buttonClass}
      >
        {buttonText()}
      </button>
    </div>
  );
}