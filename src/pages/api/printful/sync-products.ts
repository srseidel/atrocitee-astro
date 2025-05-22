import { createServerSupabaseClient } from '../../../lib/supabase';
import type { APIRoute } from 'astro';
import PrintfulService from '../../../lib/printful/service';
import PrintfulProductSync from '../../../lib/printful/product-sync';
import { isAdmin } from '../../../utils/auth';
import * as Sentry from '@sentry/astro';
import ENV from '../../../config/env';

// Do not pre-render this endpoint at build time
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabaseClient({ cookies });
  const printfulService = PrintfulService.getInstance();
  const productSync = new PrintfulProductSync(supabase, printfulService);

  try {
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || !isAdmin(user)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
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

    // Start sync process
    const syncResult = await productSync.syncAllProducts();

    // Log sync history
    await supabase
      .from('printful_sync_history')
      .insert({
        sync_type: 'full',
        status: 'completed',
        message: 'Successfully synced all products from Printful',
        started_at: syncResult.startedAt,
        completed_at: new Date().toISOString(),
        products_synced: syncResult.syncedCount,
        products_failed: syncResult.failedCount
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Product sync completed successfully',
        syncedCount: syncResult.syncedCount,
        failedCount: syncResult.failedCount
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error syncing products:', error);

    // Log sync failure
    await supabase
      .from('printful_sync_history')
      .insert({
        sync_type: 'full',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error during sync',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        products_synced: 0,
        products_failed: 0
      });

    // Log to Sentry
    Sentry.captureException(error, {
      tags: { endpoint: 'sync-products' }
    });
    
    // Extract useful error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during sync';
    const errorStack = error instanceof Error ? error.stack : null;
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: errorStack,
        time: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 