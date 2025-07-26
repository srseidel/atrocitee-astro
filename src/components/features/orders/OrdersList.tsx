/**
 * Orders List Component
 * 
 * Displays a list of user orders with details and status
 */

import React from 'react';
import type { Order } from '@lib/services/orders';
import { formatOrderStatus, formatCurrency } from '@lib/services/orders';

interface OrdersListProps {
  orders: Order[];
  loading?: boolean;
}

export default function OrdersList({ orders, loading = false }: OrdersListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
        <p className="text-gray-500 mb-6">
          When you place your first order, it will appear here.
        </p>
        <a
          href="/shop"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Products
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const statusInfo = formatOrderStatus(order.status);
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      {/* Order Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.id.split('-')[0].toUpperCase()}
            </h3>
            <p className="text-sm text-gray-500">Placed on {orderDate}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Items:</span>
            <span className="ml-2 font-medium">{order.items.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Payment:</span>
            <span className="ml-2 font-medium capitalize">{order.payment_status}</span>
          </div>
          {order.charity_amount && order.charity_amount > 0 && (
            <div>
              <span className="text-gray-500">Donated:</span>
              <span className="ml-2 font-medium text-green-600">
                {formatCurrency(order.charity_amount)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="p-6">
        <div className="space-y-4">
          {order.items.map(item => (
            <OrderItem key={item.id} item={item} />
          ))}
        </div>

        {/* Shipping Address */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h4>
          <div className="text-sm text-gray-600">
            <p>{order.shipping_address.line1}</p>
            {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
            <p>
              {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
            </p>
            <p>{order.shipping_address.country}</p>
          </div>
        </div>

        {/* Tracking Information */}
        {order.tracking_number && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Tracking Number</p>
                <p className="text-sm text-blue-700">{order.tracking_number}</p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Track Package
              </button>
            </div>
          </div>
        )}

        {/* Order Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
          <div className="flex space-x-3">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View Details
            </button>
            {order.status === 'delivered' && (
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Leave Review
              </button>
            )}
          </div>
          
          {(order.status === 'pending' || order.status === 'paid') && (
            <button className="text-sm text-red-600 hover:text-red-700 font-medium">
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderItem({ item }: { item: Order['items'][0] }) {
  const variantText = Object.entries(item.variant_options)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return (
    <div className="flex items-start space-x-4">
      {/* Product Image */}
      <div className="flex-shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.product_name}
            className="w-16 h-16 object-cover rounded-lg"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-medium text-gray-900 truncate">
          {item.product_name}
        </h5>
        <p className="text-sm text-gray-500 mt-1">{variantText}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Qty: {item.quantity}</span>
            <span>{formatCurrency(item.unit_price)} each</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(item.line_total)}
          </span>
        </div>
        
        {/* Charity Information */}
        {item.donation_amount && item.donation_amount > 0 && (
          <div className="mt-2 text-xs text-green-600">
            <span className="inline-flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {formatCurrency(item.donation_amount)} donated to charity
            </span>
          </div>
        )}
      </div>
    </div>
  );
}