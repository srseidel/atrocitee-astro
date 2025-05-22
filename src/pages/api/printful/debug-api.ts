import type { APIContext } from 'astro';
import { isAdmin } from '../../../utils/auth';
import ENV from '../../../config/env';
import PrintfulClient from '../../../lib/printful/api-client';

// Do not pre-render this endpoint at build time
export const prerender = false;

export async function GET({ request, cookies }: APIContext) {
  try {
    // Check if user is admin
    const isAdminUser = await isAdmin({ cookies });
    
    if (!isAdminUser) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Admin access required'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('[DebugAPI] Starting Printful API test');
    
    // Create API client directly
    const client = new PrintfulClient(ENV.PRINTFUL_API_KEY);
    console.log('[DebugAPI] Created API client');
    
    try {
      // Make a direct API call to get products
      console.log('[DebugAPI] Attempting to get sync products');
      const products = await client.getSyncProducts();
      console.log(`[DebugAPI] Got ${products.length} products from Printful API`);
      
      // Return just the API data without any processing
      return new Response(JSON.stringify({
        message: 'Printful API test successful',
        data: {
          product_count: products.length,
          products: products.map(p => ({
            id: p.sync_product.id,
            name: p.sync_product.name,
            variant_count: p.sync_variants.length
          }))
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (apiError) {
      console.error('[DebugAPI] API call failed:', apiError);
      return new Response(JSON.stringify({
        error: 'API Call Failed',
        message: apiError instanceof Error ? apiError.message : 'Unknown API error',
        details: apiError instanceof Error ? apiError.stack : null
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('[DebugAPI] General error:', error);
    
    // Return error response
    return new Response(JSON.stringify({
      error: 'Debug Test Failed',
      message: error instanceof Error ? error.message : 'Unknown error in debug endpoint',
      details: error instanceof Error ? error.stack : null
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 