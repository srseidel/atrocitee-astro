/**
 * Secure Shopping Cart Store
 * 
 * This store only stores variant IDs and quantities locally.
 * All product data (prices, names, etc.) is fetched from the server
 * to prevent client-side manipulation.
 */

import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

// Types for secure cart
export interface SecureCartItem {
  variantId: string;
  quantity: number;
}

export interface ValidatedCartItem {
  id: string;
  productId: string;
  productSlug: string;
  name: string;
  variantName: string;
  options: Record<string, string>;
  price: number;
  quantity: number;
  imageUrl?: string;
  printful_id?: number;
  printful_external_id?: string;
  maxQuantity: number;
  in_stock: boolean;
}

// Only store variant IDs and quantities (secure)
export const secureCartItems = persistentAtom<SecureCartItem[]>('atrocitee-secure-cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Cache for validated items (not persisted)
export const validatedCartItems = atom<ValidatedCartItem[]>([]);
export const cartValidationLoading = atom<boolean>(false);
export const cartValidationError = atom<string | null>(null);

// Cart UI state
export const isCartOpen = atom<boolean>(false);

// Computed values based on validated items
export const totalItems = computed(validatedCartItems, (items) =>
  items.reduce((total, item) => total + item.quantity, 0)
);

export const totalPrice = computed(validatedCartItems, (items) =>
  items.reduce((total, item) => total + (item.price * item.quantity), 0)
);

// Validate cart items against server
async function validateCartItems() {
  const items = secureCartItems.get();
  
  if (items.length === 0) {
    validatedCartItems.set([]);
    return;
  }

  cartValidationLoading.set(true);
  cartValidationError.set(null);

  try {
    const response = await fetch('/api/cart/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      throw new Error('Cart validation failed');
    }

    const data = await response.json();
    
    if (data.success) {
      validatedCartItems.set(data.items);
      
      // Remove any items that failed validation
      const validVariantIds = data.items.map((item: ValidatedCartItem) => item.id);
      const filteredItems = items.filter(item => validVariantIds.includes(item.variantId));
      
      if (filteredItems.length !== items.length) {
        secureCartItems.set(filteredItems);
      }
    } else {
      throw new Error(data.error || 'Validation failed');
    }
  } catch (error) {
    console.error('Cart validation error:', error);
    cartValidationError.set(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    cartValidationLoading.set(false);
  }
}

// Secure cart actions
export const secureCartActions = {
  /**
   * Add item to cart (only stores variant ID and quantity)
   */
  addItem: async (variantId: string, quantity: number = 1) => {
    const currentItems = secureCartItems.get();
    const existingItemIndex = currentItems.findIndex(item => item.variantId === variantId);

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex].quantity += quantity;
      secureCartItems.set(updatedItems);
    } else {
      // Add new item
      const newItem: SecureCartItem = {
        variantId,
        quantity,
      };
      secureCartItems.set([...currentItems, newItem]);
    }

    // Validate cart after adding
    await validateCartItems();
  },

  /**
   * Remove item from cart
   */
  removeItem: async (variantId: string) => {
    const currentItems = secureCartItems.get();
    const filteredItems = currentItems.filter(item => item.variantId !== variantId);
    secureCartItems.set(filteredItems);
    
    // Validate cart after removing
    await validateCartItems();
  },

  /**
   * Update item quantity
   */
  updateQuantity: async (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      await secureCartActions.removeItem(variantId);
      return;
    }

    const currentItems = secureCartItems.get();
    const updatedItems = currentItems.map(item => 
      item.variantId === variantId 
        ? { ...item, quantity }
        : item
    );
    
    secureCartItems.set(updatedItems);
    
    // Validate cart after updating
    await validateCartItems();
  },

  /**
   * Clear cart
   */
  clearCart: () => {
    secureCartItems.set([]);
    validatedCartItems.set([]);
  },

  /**
   * Validate cart (refresh from server)
   */
  validateCart: validateCartItems,

  /**
   * Toggle cart UI
   */
  toggleCart: () => {
    isCartOpen.set(!isCartOpen.get());
  },

  /**
   * Open cart UI
   */
  openCart: () => {
    isCartOpen.set(true);
  },

  /**
   * Close cart UI
   */
  closeCart: () => {
    isCartOpen.set(false);
  },
};

// Initialize validation on first load
if (typeof window !== 'undefined') {
  validateCartItems();
}

// Helper functions
export const secureCartUtils = {
  /**
   * Check if variant is in cart
   */
  isInCart: (variantId: string): boolean => {
    return secureCartItems.get().some(item => item.variantId === variantId);
  },

  /**
   * Get quantity of variant in cart
   */
  getItemQuantity: (variantId: string): number => {
    const item = secureCartItems.get().find(item => item.variantId === variantId);
    return item?.quantity || 0;
  },

  /**
   * Get cart summary for checkout
   */
  getCartSummary: (taxRate: number = 0, shippingCost: number = 0) => {
    const items = validatedCartItems.get();
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
};