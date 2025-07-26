/**
 * Create Payment Intent API Endpoint
 * 
 * Creates a Stripe Payment Intent for checkout processing
 */

import type { APIRoute } from 'astro';
import { stripe } from '@lib/stripe/config';
import { debug } from '@lib/utils/debug';
import type { CartItem } from '@local-types/cart';

export const prerender = false;

interface CreatePaymentIntentRequest {
  items: CartItem[];
  shipping?: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  customerEmail?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: CreatePaymentIntentRequest = await request.json();
    
    // Validate request
    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No items provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate order total
    const subtotal = body.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // TODO: Add tax calculation based on shipping address
    const taxRate = 0.08; // 8% tax for now
    const tax = subtotal * taxRate;
    
    // TODO: Add shipping calculation
    const shipping = 5.99; // Flat rate for now
    
    const total = subtotal + tax + shipping;

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        order_type: 'product_purchase',
        item_count: body.items.length.toString(),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shipping: shipping.toFixed(2),
        customer_email: body.customerEmail || '',
      },
      // Include shipping information if provided
      ...(body.shipping && {
        shipping: {
          name: body.shipping.name,
          address: body.shipping.address,
        },
      }),
      // Set up for future payments if customer email provided
      ...(body.customerEmail && {
        receipt_email: body.customerEmail,
      }),
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: total,
        breakdown: {
          subtotal,
          tax,
          shipping,
          total,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    debug.criticalError('Error creating payment intent', error, { amount, itemCount: body.items?.length });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};