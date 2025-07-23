/**
 * Cart Dropdown Component
 * 
 * Sliding cart sidebar that shows cart contents, allows quantity adjustments,
 * and provides checkout navigation.
 */

import React from 'react';
import { useSecureCart } from '@lib/hooks/useSecureCart';

export default function CartDropdown() {
  const { 
    items, 
    totalItems, 
    totalPrice, 
    isOpen,
    loading,
    error,
    closeCart, 
    removeItem, 
    updateQuantity
  } = useSecureCart();
  
  // Format price utility function
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeCart}
        aria-hidden="true"
      />
      
      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Shopping Cart ({totalItems})
          </h2>
          <button
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-gray-500 mt-2">Loading cart...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Error loading cart: {error}</p>
              <button
                onClick={closeCart}
                className="text-primary hover:text-primary-dark font-medium"
              >
                Close
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <button
                onClick={closeCart}
                className="text-primary hover:text-primary-dark font-medium"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Total */}
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <a
                href="/checkout"
                className="block w-full bg-primary text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                onClick={closeCart}
              >
                Checkout
              </a>
              <a
                href="/cart"
                className="block w-full bg-gray-100 text-gray-900 text-center py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                onClick={closeCart}
              >
                View Cart
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

interface CartItemProps {
  item: any; // ValidatedCartItem type
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  
  const increment = async () => {
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.id, item.quantity + 1);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const decrement = async () => {
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.id, item.quantity - 1);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      await onRemove(item.id);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex space-x-3">
      {/* Product Image */}
      {item.imageUrl && (
        <div className="flex-shrink-0">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-16 h-16 object-cover rounded-md border border-gray-200"
          />
        </div>
      )}

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {item.name}
        </h3>
        <p className="text-sm text-gray-500 truncate">
          {item.variantName}
        </p>
        <p className="text-sm font-medium text-gray-900">
          ${item.price.toFixed(2)} each
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center space-x-2 mt-2">
          <button
            onClick={decrement}
            disabled={item.quantity <= 1 || isUpdating}
            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="text-sm font-medium w-8 text-center">
            {isUpdating ? '...' : item.quantity}
          </span>
          <button
            onClick={increment}
            disabled={item.quantity >= (item.maxQuantity || 99) || isUpdating}
            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Remove Button */}
      <div className="flex-shrink-0">
        <button
          onClick={handleRemove}
          disabled={isUpdating}
          className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
          aria-label={`Remove ${item.name} from cart`}
        >
          {isUpdating ? (
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}