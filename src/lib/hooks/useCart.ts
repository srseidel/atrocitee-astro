/**
 * React hooks for cart functionality
 * 
 * These hooks integrate Nanostores with React components
 * for reactive cart state management.
 */

import { useStore } from '@nanostores/react';
import { cartState, cartActions, cartUtils, cartItems, totalItems, totalPrice, isCartOpen } from '@lib/stores/cart';
import type { CartItem } from '@local-types/cart';

/**
 * Main cart hook - provides complete cart state and actions
 */
export function useCart() {
  const state = useStore(cartState);
  
  return {
    // State
    ...state,
    
    // Actions
    ...cartActions,
    
    // Utilities
    ...cartUtils,
  };
}

/**
 * Hook for just cart items (lighter weight)
 */
export function useCartItems() {
  return useStore(cartItems);
}

/**
 * Hook for cart item count (for badges, etc.)
 */
export function useCartCount() {
  return useStore(totalItems);
}

/**
 * Hook for cart total price
 */
export function useCartTotal() {
  return useStore(totalPrice);
}

/**
 * Hook for cart open/closed state
 */
export function useCartOpen() {
  const isOpen = useStore(isCartOpen);
  
  return {
    isOpen,
    openCart: cartActions.openCart,
    closeCart: cartActions.closeCart,
    toggleCart: cartActions.toggleCart,
  };
}

/**
 * Hook for adding products to cart from product pages
 */
export function useAddToCart() {
  return {
    addToCart: (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
      cartActions.addItem(item, quantity);
      // Optionally show success message or open cart
      return true;
    },
    
    isInCart: cartUtils.isInCart,
    getQuantity: cartUtils.getItemQuantity,
  };
}