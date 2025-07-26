/**
 * Confirm Payment API Endpoint
 * 
 * Handles payment confirmation, creates order records, and initiates fulfillment
 */

import type { APIRoute } from 'astro';
import { stripe } from '@lib/stripe/config';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { PrintfulOrderService } from '@lib/printful/order-service';
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

    // Get user ID if authenticated
    let userId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch (error) {
      console.log('No authenticated user for this order');
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
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order record' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order created:', order.id);
    console.log('Cart items received:', JSON.stringify(body.items, null, 2));

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

    console.log('Order items to insert:', JSON.stringify(orderItems, null, 2));

    const { error: itemsError, data: insertedItems } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      console.error('Failed orderItems data:', JSON.stringify(orderItems, null, 2));
      // Continue anyway - items are in the snapshot
    } else {
      console.log('Order items created successfully:', insertedItems?.length || 0, 'items');
    }

    // Submit order to Printful for fulfillment
    let printfulSubmissionError = null;
    try {
      console.log('Submitting order to Printful...');
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
        console.error('Error updating order with Printful info:', updateError);
      } else {
        console.log('Order successfully submitted to Printful:', printfulOrder.id);
      }
      
    } catch (error) {
      console.error('Error submitting order to Printful:', error);
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
    
    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderNumber: order.id.slice(-8).toUpperCase(), // Last 8 chars as order number
        message: 'Order confirmed successfully',
        printful: {
          submitted: !printfulSubmissionError,
          error: printfulSubmissionError
        }
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