/**
 * Printful Test Order API
 * 
 * Creates test orders using Printful sandbox for proper order flow testing
 */

import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { PrintfulOrderService } from '@lib/printful/order-service';

export const prerender = false;

interface TestPrintfulOrderRequest {
  submitToPrintful?: boolean;
  status?: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log('Printful test order API called');
  
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    console.log('Rejected: Production environment');
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabase = createServerSupabaseClient({ cookies, request });
    
    // Get authenticated user
    console.log('Getting authenticated user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('User authenticated:', user.email);

    const body = await request.json() as TestPrintfulOrderRequest;
    const { submitToPrintful = true, status = 'pending' } = body;
    console.log('Request params:', { submitToPrintful, status });

    // Generate unique external ID for this test order
    const externalId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create local order first
    console.log('Creating local order...');
    const orderData = {
      // Let the database generate the UUID for id
      // id field will be auto-generated
      customer_email: user.email || 'test@example.com',
      customer_name: user.user_metadata?.full_name || user.email || 'Test User',
      user_id: user.id,
      status: status,
      payment_status: 'paid',
      subtotal: 25.00,
      tax: 2.83,
      shipping_cost: 8.99,
      discount: 0.00,
      total_amount: 36.82,
      shipping_address: {
        line1: '123 Test Street',
        line2: 'Apt 4B',
        city: 'Los Angeles',
        state: 'CA',
        postal_code: '90210',
        country: 'US'
      },
      billing_address: {
        line1: '123 Test Street',
        line2: 'Apt 4B',
        city: 'Los Angeles',
        state: 'CA',
        postal_code: '90210',
        country: 'US'
      },
      items_snapshot: {
        external_id: externalId, // Store the external ID in the snapshot
        items: []
      },
      charity_amount: 2.50,
      printful_order_id: null,
      printful_status: null
    };

    // Create the local order
    const { data: localOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating local order:', orderError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create local order', 
        details: orderError 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Local order created:', localOrder.id);

    // Create sample order item
    const orderItem = {
      order_id: localOrder.id,
      product_id: 'test-product-1',
      product_slug: 'test-unisex-tshirt',
      product_name: 'Test Unisex T-Shirt',
      variant_id: 'test-variant-1',
      variant_name: 'Black / Medium',
      variant_options: { color: 'Black', size: 'M' },
      unit_price: 25.00,
      quantity: 1,
      line_total: 25.00,
      image_url: '/images/test-product.png',
      donation_amount: 2.50
    };

    const { error: itemError } = await supabase
      .from('order_items')
      .insert(orderItem);

    if (itemError) {
      console.error('Error creating order item:', itemError);
      // Continue - don't fail the entire request
    }

    let printfulOrder = null;
    let printfulError = null;

    // Submit to Printful if requested
    if (submitToPrintful) {
      try {
        console.log('Submitting order to Printful sandbox...');
        const printfulService = new PrintfulOrderService(undefined, true); // Force sandbox mode
        
        printfulOrder = await printfulService.createTestOrder(
          externalId, // Use the external ID for Printful
          user.email || 'test@example.com',
          user.user_metadata?.full_name || user.email || 'Test User'
        );

        // Update local order with Printful information
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            printful_order_id: printfulOrder.id,
            printful_status: printfulOrder.status,
            status: printfulService['mapPrintfulStatusToLocal'](printfulOrder.status)
          })
          .eq('id', localOrder.id);

        if (updateError) {
          console.error('Error updating order with Printful info:', updateError);
        }

        console.log('Order submitted to Printful:', printfulOrder.id);
        
      } catch (error) {
        console.error('Error submitting to Printful:', error);
        printfulError = error instanceof Error ? error.message : 'Unknown Printful error';
        
        // Update local order to reflect Printful submission failure
        await supabase
          .from('orders')
          .update({
            status: 'failed',
            printful_status: 'failed',
            notes: `Printful submission failed: ${printfulError}`
          })
          .eq('id', localOrder.id);
      }
    }

    const response = {
      success: true,
      localOrder: {
        id: localOrder.id,
        status: localOrder.status,
        total_amount: localOrder.total_amount,
        created_at: localOrder.created_at
      },
      printful: printfulOrder ? {
        id: printfulOrder.id,
        status: printfulOrder.status,
        external_id: printfulOrder.external_id,
        created: printfulOrder.created,
        costs: printfulOrder.costs
      } : null,
      printfulError
    };

    console.log('Test order creation completed:', {
      localOrderId: localOrder.id,
      printfulOrderId: printfulOrder?.id,
      hadPrintfulError: !!printfulError
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in Printful test order creation:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};