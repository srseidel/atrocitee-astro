/**
 * Add to Cart Button Component
 * 
 * React component for adding products to cart with loading states,
 * quantity selection, and visual feedback.
 */

import React, { useState } from 'react';
import { useAddToCart } from '@lib/hooks/useCart';
import type { CartItem } from '@local-types/cart';

interface AddToCartButtonProps {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  options: Record<string, string>;
  price: number;
  imageUrl?: string;
  maxQuantity?: number;
  disabled?: boolean;
  className?: string;
}

export default function AddToCartButton({
  productId,
  productSlug,
  productName,
  variantId,
  variantName,
  options,
  price,
  imageUrl,
  maxQuantity = 99,
  disabled = false,
  className = '',
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  const { addToCart, isInCart, getQuantity } = useAddToCart();
  
  const currentQuantityInCart = getQuantity(variantId);
  const canAddMore = currentQuantityInCart + quantity <= maxQuantity;

  const handleAddToCart = async () => {
    if (!canAddMore || disabled) return;
    
    setIsAdding(true);
    
    try {
      const cartItem: Omit<CartItem, 'quantity'> = {
        id: variantId,
        productId,
        productSlug,
        name: productName,
        variantName,
        options,
        price,
        imageUrl,
        maxQuantity,
      };
      
      addToCart(cartItem, quantity);
      
      // Show success feedback
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
      
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const incrementQuantity = () => {
    if (currentQuantityInCart + quantity < maxQuantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const buttonText = () => {
    if (isAdding) return 'Adding...';
    if (justAdded) return 'Added to Cart!';
    if (isInCart(variantId)) return `Add ${quantity} More`;
    return `Add to Cart - $${(price * quantity).toFixed(2)}`;
  };

  const buttonClass = `
    w-full py-3 px-6 rounded-lg font-medium transition-all duration-200
    ${justAdded 
      ? 'bg-green-600 text-white' 
      : disabled || !canAddMore
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
            disabled={currentQuantityInCart + quantity >= maxQuantity}
            className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
      
      {!canAddMore && (
        <p className="text-sm text-red-600 text-center">
          Cannot add more (max: {maxQuantity})
        </p>
      )}

      {/* Add to Cart Button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || isAdding || !canAddMore}
        className={buttonClass}
        aria-describedby="cart-button-description"
      >
        {buttonText()}
      </button>
      
      <div id="cart-button-description" className="sr-only">
        Add {quantity} {variantName} to your shopping cart for ${(price * quantity).toFixed(2)}
      </div>
    </div>
  );
}