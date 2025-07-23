/**
 * Cart Type Definitions
 */

export interface CartItem {
  id: string; // Product variant ID
  productId: string; // Main product ID
  productSlug: string; // For navigation
  name: string; // Product name
  variantName: string; // Variant display name (e.g., "Black, Medium")
  options: Record<string, string>; // { color: "Black", size: "M" }
  price: number; // Price per item
  quantity: number;
  imageUrl?: string; // Main product image
  maxQuantity?: number; // Inventory limit
  // Critical for Printful order fulfillment
  printful_id?: number; // Printful catalog variant ID (from database)
  printful_external_id?: string; // Printful external reference ID
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isOpen: boolean; // For cart dropdown/sidebar
}

export interface CartActions {
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

// For checkout and order creation
export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}