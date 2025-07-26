/**
 * Orders Service
 * 
 * Handles fetching and managing user orders
 */

import { createServerSupabaseClient } from '@lib/supabase/client';
import { debug } from '@lib/utils/debug';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface OrderItem {
  id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  variant_id: string;
  variant_name: string;
  variant_options: Record<string, string>;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_url?: string;
  donation_amount?: number;
}

export interface Order {
  id: string;
  stripe_payment_intent_id?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  customer_email: string;
  customer_name: string;
  user_id?: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  total_amount: number;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  billing_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  charity_amount?: number;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

/**
 * Fetch all orders for a specific user
 */
export async function getUserOrders(userId: string, supabase: SupabaseClient): Promise<Order[]> {
  const client = supabase;

  try {
    // Fetch orders with their items
    const { data: orders, error: ordersError } = await client
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_slug,
          product_name,
          variant_id,
          variant_name,
          variant_options,
          unit_price,
          quantity,
          line_total,
          image_url,
          donation_amount
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      debug.criticalError('Error fetching user orders', ordersError, { userId });
      throw new Error('Failed to fetch orders');
    }

    // Transform the data to match our interface
    const transformedOrders: Order[] = (orders || []).map(order => ({
      ...order,
      items: order.order_items || []
    }));

    return transformedOrders;
  } catch (error) {
    debug.criticalError('Error in getUserOrders', error, { userId });
    throw error;
  }
}

/**
 * Fetch a specific order by ID (with user verification)
 */
export async function getOrderById(orderId: string, userId: string, supabase: SupabaseClient): Promise<Order | null> {
  const client = supabase;

  try {
    const { data: order, error } = await client
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_slug,
          product_name,
          variant_id,
          variant_name,
          variant_options,
          unit_price,
          quantity,
          line_total,
          image_url,
          donation_amount
        )
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Order not found
      }
      debug.criticalError('Error fetching order', error, { orderId, userId });
      throw new Error('Failed to fetch order');
    }

    return {
      ...order,
      items: order.order_items || []
    };
  } catch (error) {
    debug.criticalError('Error in getOrderById', error, { orderId, userId });
    throw error;
  }
}

/**
 * Get order statistics for a user
 */
export interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  totalDonated: number;
  ordersByStatus: Record<string, number>;
}

export async function getUserOrderStats(userId: string, supabase: SupabaseClient): Promise<OrderStats> {
  const client = supabase;

  try {
    const { data: orders, error } = await client
      .from('orders')
      .select('status, total_amount, charity_amount')
      .eq('user_id', userId);

    if (error) {
      debug.criticalError('Error fetching order stats', error, { userId });
      throw new Error('Failed to fetch order statistics');
    }

    const stats: OrderStats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      totalDonated: orders.reduce((sum, order) => sum + (order.charity_amount || 0), 0),
      ordersByStatus: {}
    };

    // Count orders by status
    orders.forEach(order => {
      const status = order.status || 'unknown';
      stats.ordersByStatus[status] = (stats.ordersByStatus[status] || 0) + 1;
    });

    return stats;
  } catch (error) {
    debug.criticalError('Error in getUserOrderStats', error, { userId });
    throw error;
  }
}

/**
 * Format order status for display
 */
export function formatOrderStatus(status: string): { label: string; color: string } {
  const statusMap = {
    pending: { label: 'Pending', color: 'text-yellow-600 bg-yellow-50' },
    paid: { label: 'Paid', color: 'text-blue-600 bg-blue-50' },
    processing: { label: 'Processing', color: 'text-purple-600 bg-purple-50' },
    shipped: { label: 'Shipped', color: 'text-green-600 bg-green-50' },
    delivered: { label: 'Delivered', color: 'text-green-700 bg-green-100' },
    cancelled: { label: 'Cancelled', color: 'text-red-600 bg-red-50' },
    refunded: { label: 'Refunded', color: 'text-gray-600 bg-gray-50' }
  };

  return statusMap[status as keyof typeof statusMap] || { label: status, color: 'text-gray-600 bg-gray-50' };
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}