/**
 * Order Statistics Component
 * 
 * Displays user order statistics and summary information
 */

import React from 'react';
import type { OrderStats } from '@lib/services/orders';
import { formatCurrency, formatOrderStatus } from '@lib/services/orders';

interface OrderStatsProps {
  stats: OrderStats;
  loading?: boolean;
}

export default function OrderStatsComponent({ stats, loading = false }: OrderStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Orders */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Orders</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
          </div>
        </div>
      </div>

      {/* Total Spent */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Spent</p>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
          </div>
        </div>
      </div>

      {/* Total Donated */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Donated</p>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalDonated)}</p>
          </div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      {Object.keys(stats.ordersByStatus).length > 0 && (
        <div className="md:col-span-3 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => {
              const statusInfo = formatOrderStatus(status);
              return (
                <div key={status} className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color} mb-2`}>
                    {statusInfo.label}
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}