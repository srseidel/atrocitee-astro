/**
 * Clear Cart API
 * 
 * Simple API to clear corrupted cart data
 */

import type { APIRoute } from 'astro';

export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Cart cleared successfully' 
    }),
    { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        // Clear any cart-related cookies
        'Set-Cookie': [
          'cart=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
          'secureCart=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
        ].join(', ')
      } 
    }
  );
};