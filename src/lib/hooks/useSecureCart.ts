/**
 * Secure Cart Hooks
 * 
 * These hooks provide secure cart functionality that validates
 * all product data against the server to prevent manipulation.
 */

import { useStore } from '@nanostores/react';
import { 
  secureCartItems, 
  validatedCartItems, 
  cartValidationLoading, 
  cartValidationError,
  totalItems, 
  totalPrice, 
  isCartOpen,
  secureCartActions,
  secureCartUtils
} from '@lib/stores/secureCart';

/**
 * Main secure cart hook
 */
export function useSecureCart() {
  const items = useStore(validatedCartItems);
  const loading = useStore(cartValidationLoading);
  const error = useStore(cartValidationError);
  const itemCount = useStore(totalItems);
  const total = useStore(totalPrice);
  const isOpen = useStore(isCartOpen);

  return {
    // State
    items,
    loading,
    error,
    totalItems: itemCount,
    totalPrice: total,
    isOpen,
    
    // Actions
    addItem: secureCartActions.addItem,
    removeItem: secureCartActions.removeItem,
    updateQuantity: secureCartActions.updateQuantity,
    clearCart: secureCartActions.clearCart,
    validateCart: secureCartActions.validateCart,
    toggleCart: secureCartActions.toggleCart,
    openCart: secureCartActions.openCart,
    closeCart: secureCartActions.closeCart,
    
    // Utilities
    isInCart: secureCartUtils.isInCart,
    getItemQuantity: secureCartUtils.getItemQuantity,
    getCartSummary: secureCartUtils.getCartSummary,
  };
}

/**
 * Hook specifically for adding items to cart
 */
export function useSecureAddToCart() {
  const loading = useStore(cartValidationLoading);
  const error = useStore(cartValidationError);

  return {
    addToCart: async (variantId: string, quantity: number = 1) => {
      try {
        await secureCartActions.addItem(variantId, quantity);
        return true;
      } catch (error) {
        console.error('Failed to add to cart:', error);
        return false;
      }
    },
    
    loading,
    error,
    isInCart: secureCartUtils.isInCart,
    getQuantity: secureCartUtils.getItemQuantity,
  };
}

/**
 * Hook for cart item count (for badges)
 */
export function useSecureCartCount() {
  return useStore(totalItems);
}

/**
 * Hook for cart total price
 */
export function useSecureCartTotal() {
  return useStore(totalPrice);
}

/**
 * Hook for cart open/closed state
 */
export function useSecureCartOpen() {
  const isOpen = useStore(isCartOpen);
  
  return {
    isOpen,
    openCart: secureCartActions.openCart,
    closeCart: secureCartActions.closeCart,
    toggleCart: secureCartActions.toggleCart,
  };
}