/**
 * Cart Page Component
 * 
 * Full page cart view with item management and checkout
 */

import React from 'react';
import { useSecureCart } from '@lib/hooks/useSecureCart';
import LoadingSpinner from '@components/common/LoadingSpinner';

export default function CartPage() {
  const { 
    items, 
    totalItems, 
    totalPrice, 
    loading, 
    error, 
    removeItem, 
    updateQuantity 
  } = useSecureCart();

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading your cart..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Cart</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
          <a
            href="/shop"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Start Shopping
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        {items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>

      {/* Cart Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Items ({totalItems})</span>
              <span className="text-gray-900">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="text-gray-900">$5.99</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (est.)</span>
              <span className="text-gray-900">{formatPrice(totalPrice * 0.08)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-2">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{formatPrice(totalPrice + 5.99 + (totalPrice * 0.08))}</span>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/checkout'}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Proceed to Checkout
          </button>

          <div className="mt-4 text-center">
            <a
              href="/shop"
              className="text-primary hover:text-primary-dark font-medium text-sm"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CartItemProps {
  item: any; // ValidatedCartItem type
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleQuantityChange = async (newQuantity: number) => {
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.id, newQuantity);
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
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center space-x-4">
        {/* Product Image */}
        {item.imageUrl && (
          <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {item.name}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {item.variantName}
          </p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {formatPrice(item.price)} each
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1 || isUpdating}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            −
          </button>
          <span className="w-12 text-center font-medium">
            {isUpdating ? '...' : item.quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={item.quantity >= (item.maxQuantity || 99) || isUpdating}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>

        {/* Price & Remove */}
        <div className="flex flex-col items-end space-y-2">
          <p className="text-lg font-semibold text-gray-900">
            {formatPrice(item.price * item.quantity)}
          </p>
          <button
            onClick={handleRemove}
            disabled={isUpdating}
            className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
          >
            {isUpdating ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}