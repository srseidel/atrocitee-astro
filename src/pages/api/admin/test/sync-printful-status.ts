/**
 * Sync Printful Order Status API
 * 
 * Manually sync order status from Printful for testing
 */

import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { PrintfulOrderService } from '@lib/printful/order-service';

export const prerender = false;

interface SyncStatusRequest {
  orderId: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log('Printful status sync API called');
  
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabase = createServerSupabaseClient({ cookies, request });
    
    // Get authenticated user (admin check could be added here)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as SyncStatusRequest;
    const { orderId } = body;

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Syncing status for order:', orderId);

    // Get the local order
    const { data: localOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, printful_order_id, status, printful_status')
      .eq('id', orderId)
      .single();

    if (fetchError || !localOrder) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!localOrder.printful_order_id) {
      return new Response(JSON.stringify({ error: 'Order not submitted to Printful' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get current status from Printful
    const printfulService = new PrintfulOrderService(undefined, true); // Sandbox mode
    
    try {
      const printfulOrder = await printfulService.getOrderStatus(localOrder.printful_order_id);
      
      // Update local order with latest status
      await printfulService.updateLocalOrderStatus(supabase, orderId, printfulOrder);
      
      // Get updated local order
      const { data: updatedOrder } = await supabase
        .from('orders')
        .select('id, status, printful_status, tracking_number, updated_at')
        .eq('id', orderId)
        .single();

      return new Response(JSON.stringify({
        success: true,
        localOrder: updatedOrder,
        printfulOrder: {
          id: printfulOrder.id,
          status: printfulOrder.status,
          updated: printfulOrder.updated,
          shipments: printfulOrder.shipments
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (printfulError) {
      console.error('Error syncing from Printful:', printfulError);
      return new Response(JSON.stringify({
        error: 'Failed to sync from Printful',
        details: printfulError instanceof Error ? printfulError.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error in status sync:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};