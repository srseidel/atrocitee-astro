/**
 * Printful Webhook Handler
 * 
 * Handles order status updates from Printful
 */

import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { PrintfulOrderService } from '@lib/printful/order-service';
import { env } from '@lib/config/env';
import { debug } from '@lib/utils/debug';
import crypto from 'crypto';

export const prerender = false;

interface PrintfulWebhookData {
  type: string;
  created: number;
  retries: number;
  store: number;
  data: {
    order: {
      id: number;
      external_id: string;
      status: string;
      created: number;
      updated: number;
      recipient: any;
      items: any[];
      shipments?: Array<{
        id: number;
        carrier: string;
        service: string;
        tracking_number: string;
        tracking_url: string;
        created: number;
        ship_date: string;
        shipped_at: number;
        items: Array<{
          item_id: number;
          quantity: number;
        }>;
      }>;
    };
  };
}

export const POST: APIRoute = async ({ request }) => {
  debug.api('POST', '/api/webhooks/printful', null, 'Webhook received');
  
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-pf-signature');
    const body = await request.text();
    
    if (!signature) {
      debug.criticalError('Missing Printful webhook signature', new Error('No signature header'), { headers: Object.keys(headers) });
      return new Response('Missing signature', { status: 401 });
    }

    // Verify the webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', env.PRINTFUL_WEBHOOK_SECRET || '')
      .update(body)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      debug.criticalError('Invalid Printful webhook signature', new Error('Signature mismatch'), { providedSignature: signature?.substring(0, 10) + '...' });
      return new Response('Invalid signature', { status: 401 });
    }

    debug.log('Webhook signature verified');

    // Parse the webhook data
    const webhookData: PrintfulWebhookData = JSON.parse(body);
    debug.log('Webhook received', { type: webhookData.type, externalId: webhookData.data?.order?.external_id });

    // Only handle order-related webhooks
    if (!webhookData.type.startsWith('order_')) {
      debug.log('Ignoring non-order webhook', { type: webhookData.type });
      return new Response('OK', { status: 200 });
    }

    const order = webhookData.data.order;
    debug.log('Processing order webhook', { externalId: order.external_id, status: order.status, printfulId: order.id });

    // Create Supabase client for webhook context
    const supabase = createServerSupabaseClient({
      cookies: {
        get: () => null,
        set: () => {},
        delete: () => {},
        getAll: () => []
      } as any,
      request: new Request('http://localhost')
    });

    // Update the local order status
    const printfulService = new PrintfulOrderService();
    
    try {
      await printfulService.updateLocalOrderStatus(
        supabase,
        order.external_id,
        order as any
      );
      
      debug.log('Successfully updated order from webhook', { externalId: order.external_id, newStatus: localStatus });
      
      // Log the webhook event
      await supabase
        .from('webhook_logs')
        .insert({
          source: 'printful',
          event_type: webhookData.type,
          event_id: `${order.id}-${webhookData.created}`,
          order_id: order.external_id,
          status: 'processed',
          payload: webhookData,
          processed_at: new Date().toISOString()
        });
        
    } catch (error) {
      debug.criticalError('Error processing webhook', error, { externalId: order.external_id, webhookType: webhookData.type });
      
      // Log the webhook error
      await supabase
        .from('webhook_logs')
        .insert({
          source: 'printful',
          event_type: webhookData.type,
          event_id: `${order.id}-${webhookData.created}`,
          order_id: order.external_id,
          status: 'error',
          payload: webhookData,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processed_at: new Date().toISOString()
        });
      
      // Return 500 so Printful will retry
      return new Response('Processing error', { status: 500 });
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    debug.criticalError('Webhook processing error', error, { bodyLength: body?.length });
    return new Response('Server error', { status: 500 });
  }
};

// Also handle GET requests for webhook verification
export const GET: APIRoute = async ({ request }) => {
  // Printful webhook verification endpoint
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (token && token === env.PRINTFUL_WEBHOOK_SECRET) {
    return new Response('OK', { status: 200 });
  }
  
  return new Response('Unauthorized', { status: 401 });
};