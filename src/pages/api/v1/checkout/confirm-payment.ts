/**
 * Confirm Payment API Endpoint
 * 
 * Handles payment confirmation, creates order records, and initiates fulfillment
 */

import type { APIRoute } from 'astro';
import { stripe } from '@lib/stripe/config';
import { createServerSupabaseClient } from '@lib/supabase/client';
import type { CartItem } from '@local-types/cart';

export const prerender = false;

interface ConfirmPaymentRequest {
  paymentIntentId: string;
  items: CartItem[];
  customerInfo: {
    email: string;
    name: string;
    shipping: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    billing?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body: ConfirmPaymentRequest = await request.json();
    
    // Validate request
    if (!body.paymentIntentId || !body.items || !body.customerInfo) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(body.paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ error: 'Payment not confirmed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createServerSupabaseClient({ cookies, request });

    // Create order record
    const orderData = {
      id: crypto.randomUUID(),
      stripe_payment_intent_id: paymentIntent.id,
      customer_email: body.customerInfo.email,
      customer_name: body.customerInfo.name,
      status: 'paid',
      
      // Order totals from Stripe metadata
      subtotal: parseFloat(paymentIntent.metadata.subtotal),
      tax: parseFloat(paymentIntent.metadata.tax),
      shipping_cost: parseFloat(paymentIntent.metadata.shipping),
      total: paymentIntent.amount / 100, // Convert from cents
      
      // Shipping information
      shipping_address: body.customerInfo.shipping,
      billing_address: body.customerInfo.billing || body.customerInfo.shipping,
      
      // Product snapshot
      items_snapshot: body.items,
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order record' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Submit order to Printful for fulfillment
    // This would happen in a background job or webhook
    
    // TODO: Send order confirmation email
    
    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderNumber: order.id.slice(-8).toUpperCase(), // Last 8 chars as order number
        message: 'Order confirmed successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error confirming payment:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to confirm payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};