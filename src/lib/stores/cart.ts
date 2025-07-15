/**
 * Shopping Cart Store using Nanostores
 * 
 * This store manages cart state across the entire application:
 * - Works in static shop pages
 * - Persists across navigation
 * - Available in server-rendered pages
 * - Reactive updates for client components
 */

import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import type { CartItem, CartState } from '@local-types/cart';

// Persistent cart items store
export const cartItems = persistentAtom<CartItem[]>('atrocitee-cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Cart UI state (not persisted)
export const isCartOpen = atom<boolean>(false);

// Computed values
export const totalItems = computed(cartItems, (items) =>
  items.reduce((total, item) => total + item.quantity, 0)
);

export const totalPrice = computed(cartItems, (items) =>
  items.reduce((total, item) => total + (item.price * item.quantity), 0)
);

// Full cart state computed store
export const cartState = computed(
  [cartItems, totalItems, totalPrice, isCartOpen],
  (items, itemCount, price, isOpen): CartState => ({
    items,
    totalItems: itemCount,
    totalPrice: price,
    isOpen,
  })
);

// Cart Actions
export const cartActions = {
  /**
   * Add item to cart or update quantity if already exists
   */
  addItem: (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    const currentItems = cartItems.get();
    const existingItemIndex = currentItems.findIndex(
      cartItem => cartItem.id === item.id
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...currentItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
      
      // Check max quantity if specified
      const maxQty = item.maxQuantity || 99;
      updatedItems[existingItemIndex].quantity = Math.min(newQuantity, maxQty);
      
      cartItems.set(updatedItems);
    } else {
      // Add new item
      const newItem: CartItem = {
        ...item,
        quantity: Math.min(quantity, item.maxQuantity || 99),
      };
      cartItems.set([...currentItems, newItem]);
    }
  },

  /**
   * Remove item completely from cart
   */
  removeItem: (variantId: string) => {
    const currentItems = cartItems.get();
    const filteredItems = currentItems.filter(item => item.id !== variantId);
    cartItems.set(filteredItems);
  },

  /**
   * Update item quantity (or remove if quantity is 0)
   */
  updateQuantity: (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      cartActions.removeItem(variantId);
      return;
    }

    const currentItems = cartItems.get();
    const updatedItems = currentItems.map(item => {
      if (item.id === variantId) {
        const maxQty = item.maxQuantity || 99;
        return {
          ...item,
          quantity: Math.min(quantity, maxQty),
        };
      }
      return item;
    });
    
    cartItems.set(updatedItems);
  },

  /**
   * Clear all items from cart
   */
  clearCart: () => {
    cartItems.set([]);
  },

  /**
   * Toggle cart sidebar/dropdown
   */
  toggleCart: () => {
    isCartOpen.set(!isCartOpen.get());
  },

  /**
   * Open cart sidebar/dropdown
   */
  openCart: () => {
    isCartOpen.set(true);
  },

  /**
   * Close cart sidebar/dropdown
   */
  closeCart: () => {
    isCartOpen.set(false);
  },
};

// Helper functions for cart validation and calculations
export const cartUtils = {
  /**
   * Check if a variant is already in cart
   */
  isInCart: (variantId: string): boolean => {
    return cartItems.get().some(item => item.id === variantId);
  },

  /**
   * Get quantity of specific variant in cart
   */
  getItemQuantity: (variantId: string): number => {
    const item = cartItems.get().find(item => item.id === variantId);
    return item?.quantity || 0;
  },

  /**
   * Calculate cart summary for checkout
   */
  getCartSummary: (taxRate: number = 0, shippingCost: number = 0) => {
    const items = cartItems.get();
    const subtotal = totalPrice.get();
    const tax = subtotal * taxRate;
    const total = subtotal + tax + shippingCost;

    return {
      items,
      subtotal,
      tax,
      shipping: shippingCost,
      total,
    };
  },

  /**
   * Format price for display
   */
  formatPrice: (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  },
};