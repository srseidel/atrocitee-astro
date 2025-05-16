import type { APIContext } from 'astro';
import { isAdmin } from '../../../utils/auth-fixed';
import PrintfulProductSync from '../../../lib/printful/product-sync';
import * as Sentry from '@sentry/astro';
import ENV from '../../../config/env';

// Do not pre-render this endpoint at build time
export const prerender = false;

export async function POST({ request, cookies }: APIContext) {
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

    // Check if API key exists
    if (!ENV.PRINTFUL_API_KEY) {
      console.error('Missing Printful API key. Please add PRINTFUL_API_KEY to your environment variables.');
      return new Response(JSON.stringify({
        error: 'Configuration Error',
        message: 'Printful API key is missing. Please add PRINTFUL_API_KEY to your environment variables.'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log('[Sync API] Starting sync with API key:', ENV.PRINTFUL_API_KEY ? 'Present (first chars: ' + ENV.PRINTFUL_API_KEY.substring(0, 4) + '...)' : 'Missing');

    // Initialize the product sync service
    const productSync = new PrintfulProductSync(cookies);
    
    // Run the sync operation
    try {
      const { success, failed, syncId } = await productSync.syncAllProducts('manual');
      
      // Return response with sync results
      return new Response(JSON.stringify({
        message: `Product sync completed: ${success} products synced successfully, ${failed} failures.`,
        data: {
          success_count: success,
          failure_count: failed,
          sync_id: syncId,
          details: 'Products from your Printful store have been imported. New products will need to be assigned to categories. Existing products have preserved their descriptions, tags, and categories.'
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (syncError) {
      console.error('Error during product sync operation:', syncError);
      
      // Log to Sentry
      Sentry.captureException(syncError, {
        tags: { endpoint: 'sync-products', operation: 'syncAllProducts' }
      });
      
      // Extract useful error information
      const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown error during product synchronization';
      const errorStack = syncError instanceof Error ? syncError.stack : null;
      
      // Return error response with more details
      return new Response(JSON.stringify({
        error: 'Sync Failed',
        message: errorMessage,
        details: errorStack,
        time: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error during product sync:', error);
    
    // Log to Sentry
    Sentry.captureException(error, {
      tags: { endpoint: 'sync-products' }
    });
    
    // Extract useful error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during product synchronization';
    const errorStack = error instanceof Error ? error.stack : null;
    
    // Return error response with more details
    return new Response(JSON.stringify({
      error: 'Sync Failed',
      message: errorMessage,
      details: errorStack,
      time: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 