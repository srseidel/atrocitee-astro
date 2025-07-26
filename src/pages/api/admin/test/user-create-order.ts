/**
 * Authenticated Test Order Creation API
 * 
 * Creates test orders for the currently logged-in user
 */

import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';

export const prerender = false;

interface TestOrderRequest {
  status?: string;
  itemCount?: number;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log('Test order API called');
  
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    console.log('Rejected: Production environment');
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('Creating Supabase client...');
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

    console.log('Parsing request body...');
    const body = await request.json() as TestOrderRequest;
    const { status = 'delivered', itemCount = 2 } = body;
    console.log('Request params:', { status, itemCount });

    // Generate sample order data
    const orderData = {
      customer_email: user.email || 'test@example.com',
      customer_name: user.user_metadata?.full_name || user.email || 'Test User',
      user_id: user.id,
      status,
      payment_status: status === 'cancelled' || status === 'refunded' ? status : 'paid',
      subtotal: 50.00,
      tax: 4.50,
      shipping_cost: 8.99,
      discount: 0.00,
      total_amount: 63.49,
      shipping_address: {
        line1: '123 Test Street',
        line2: 'Apt 4B',
        city: 'Denver',
        state: 'CO',
        postal_code: '80202',
        country: 'US'
      },
      billing_address: {
        line1: '123 Test Street',
        line2: 'Apt 4B',
        city: 'Denver',
        state: 'CO',
        postal_code: '80202',
        country: 'US'
      },
      items_snapshot: {
        items: []
      },
      charity_amount: 5.00,
      tracking_number: status === 'shipped' || status === 'delivered' ? 'TEST1234567890' : null
    };

    // Create the order
    console.log('Creating order with data:', orderData);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating test order:', orderError);
      return new Response(JSON.stringify({ error: 'Failed to create order', details: orderError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Order created successfully:', order.id);

    // Create sample order items
    const sampleItems = [
      {
        order_id: order.id,
        product_id: 'test-product-1',
        product_slug: 'atrocitee-classic-tee',
        product_name: 'Atrocitee Classic Tee',
        variant_id: 'test-variant-1',
        variant_name: 'Black / Medium',
        variant_options: { color: 'Black', size: 'M' },
        unit_price: 25.00,
        quantity: 1,
        line_total: 25.00,
        image_url: '/images/mockups/atrocitee-classic-tee/atrocitee-classic-tee-black-m-front.webp',
        donation_amount: 2.50
      },
      {
        order_id: order.id,
        product_id: 'test-product-2',
        product_slug: 'atrocitee-white-mug',
        product_name: 'Atrocitee White Mug',
        variant_id: 'test-variant-2',
        variant_name: 'White / 11 oz',
        variant_options: { color: 'White', size: '11 oz' },
        unit_price: 25.00,
        quantity: 1,
        line_total: 25.00,
        image_url: '/images/mockups/atrocitee-white-mug/atrocitee-white-mug-white-11-oz-front.webp',
        donation_amount: 2.50
      }
    ];

    // Insert order items (limit to requested count)
    const itemsToInsert = sampleItems.slice(0, itemCount);
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating test order items:', itemsError);
      // Don't fail the entire request, just log the error
    }

    return new Response(JSON.stringify({ 
      success: true, 
      order: {
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
        created_at: order.created_at
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in test order creation:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};