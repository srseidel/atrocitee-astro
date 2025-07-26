/**
 * Confirm Payment API Endpoint
 * 
 * Handles payment confirmation, creates order records, and initiates fulfillment
 */

import type { APIRoute } from 'astro';
import { stripe } from '@lib/stripe/config';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { PrintfulOrderService } from '@lib/printful/order-service';
import { debug } from '@lib/utils/debug';
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
    debug.api('POST', '/api/v1/checkout/confirm-payment', null, 'Processing payment confirmation');
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

    // Get user ID if authenticated
    let userId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch (error) {
      debug.log('No authenticated user for this order');
    }

    // Create order record
    const orderData = {
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: paymentIntent.latest_charge as string,
      payment_status: 'paid',
      customer_email: body.customerInfo.email,
      customer_name: body.customerInfo.name,
      user_id: userId,
      status: 'paid', // Will be updated to 'processing' when submitted to Printful
      
      // Order totals from Stripe metadata
      subtotal: parseFloat(paymentIntent.metadata.subtotal || '0'),
      tax: parseFloat(paymentIntent.metadata.tax || '0'),
      shipping_cost: parseFloat(paymentIntent.metadata.shipping || '0'),
      discount: parseFloat(paymentIntent.metadata.discount || '0'),
      total_amount: paymentIntent.amount / 100, // Convert from cents
      
      // Shipping information
      shipping_address: body.customerInfo.shipping,
      billing_address: body.customerInfo.billing || body.customerInfo.shipping,
      
      // Product snapshot
      items_snapshot: {
        items: body.items,
        payment_intent_id: paymentIntent.id,
        created_at: new Date().toISOString()
      },
      
      // Charity information (if available in metadata)
      charity_amount: parseFloat(paymentIntent.metadata.charity_amount || '0'),
      
      // Printful fields (will be populated after submission)
      printful_order_id: null,
      printful_status: null
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      debug.criticalError('Error creating order', orderError, { paymentIntentId: body.paymentIntentId });
      return new Response(
        JSON.stringify({ error: 'Failed to create order record' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    debug.log('Order created', { orderId: order.id });
    debug.log('Cart items received', { itemCount: body.items.length, items: body.items });

    // Create order items (map cart structure to order structure)
    const orderItems = body.items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_slug: item.productSlug,
      product_name: item.name,
      variant_id: item.id, // Cart uses 'id' for variant ID
      variant_name: item.variantName,
      variant_options: item.options || {},
      unit_price: item.price,
      quantity: item.quantity,
      line_total: item.price * item.quantity,
      image_url: item.imageUrl, // Cart uses 'imageUrl'
      donation_amount: 0 // Default to 0 for now
    }));

    debug.log('Order items to insert', { itemCount: orderItems.length, orderItems });

    const { error: itemsError, data: insertedItems } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      debug.criticalError('Error creating order items', itemsError, { orderItems });
      // Continue anyway - items are in the snapshot
    } else {
      debug.log('Order items created successfully', { itemCount: insertedItems?.length || 0 });
    }

    // Submit order to Printful for fulfillment
    let printfulSubmissionError = null;
    try {
      debug.log('Submitting order to Printful', { orderId: order.id });
      const printfulService = new PrintfulOrderService();
      
      // Convert local order to Printful format
      const printfulOrderData = await printfulService.convertLocalOrderToPrintful(supabase, order.id);
      
      // Submit to Printful
      const printfulOrder = await printfulService.submitOrder(printfulOrderData);
      
      // Update local order with Printful information
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          printful_order_id: printfulOrder.id,
          printful_status: printfulOrder.status,
          status: 'processing', // Update status to processing
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        debug.criticalError('Error updating order with Printful info', updateError, { orderId: order.id, printfulOrderId: printfulOrder.id });
      } else {
        debug.log('Order successfully submitted to Printful', { orderId: order.id, printfulOrderId: printfulOrder.id });
      }
      
    } catch (error) {
      debug.criticalError('Error submitting order to Printful', error, { orderId: order.id });
      printfulSubmissionError = error instanceof Error ? error.message : 'Unknown Printful error';
      
      // Don't fail the entire checkout - order was paid and created
      // Update order with error status
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          printful_status: 'submission_failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
    }
    
    // TODO: Send order confirmation email
    
    const successResponse = {
      success: true,
      orderId: order.id,
      orderNumber: order.id.slice(-8).toUpperCase(), // Last 8 chars as order number
      message: 'Order confirmed successfully',
      printful: {
        submitted: !printfulSubmissionError,
        error: printfulSubmissionError
      }
    };
    debug.api('POST', '/api/v1/checkout/confirm-payment', 200, successResponse);
    return new Response(
      JSON.stringify(successResponse),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    debug.criticalError('Error confirming payment', error, { paymentIntentId: body?.paymentIntentId });
    debug.api('POST', '/api/v1/checkout/confirm-payment', 500, { error: 'Failed to confirm payment' });
    
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