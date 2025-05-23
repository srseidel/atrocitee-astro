import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { PrintfulService } from '@lib/printful/service';
import { isAdmin } from '@lib/auth/middleware';
import * as Sentry from '@sentry/astro';
import ENV from '@config/env';

// Do not pre-render this endpoint at build time
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabaseClient({ cookies });
  const printfulService = PrintfulService.getInstance();

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
    const startedAt = new Date().toISOString();
    let syncedCount = 0;
    let failedCount = 0;

    try {
      // Get all products from Printful
      const products = await printfulService.getProducts();
      
      // Process each product
      for (const product of products) {
        try {
          // Get product variants
          const variants = await printfulService.getProductVariants(product.id);
          
          // Check if product exists in our database
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('printful_id', product.id)
            .maybeSingle();

          if (existingProduct) {
            // Update existing product
            const { error: updateError } = await supabase
              .from('products')
              .update({
                name: product.name,
                printful_synced: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingProduct.id);

            if (updateError) throw updateError;
          } else {
            // Create new product
            const { error: insertError } = await supabase
              .from('products')
              .insert({
                name: product.name,
                printful_id: product.id,
                printful_synced: true,
                atrocitee_active: true,
                atrocitee_base_price: variants[0]?.retail_price || 0,
                atrocitee_donation_amount: 0
              });

            if (insertError) throw insertError;
          }

          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync product ${product.id}:`, error);
          failedCount++;
          Sentry.captureException(error, {
            tags: { productId: product.id }
          });
        }
      }
    } catch (error) {
      console.error('Error during sync process:', error);
      Sentry.captureException(error, {
        tags: { operation: 'syncAllProducts' }
      });
      throw error;
    }

    const completedAt = new Date().toISOString();

    // Log sync history
    await supabase
      .from('printful_sync_history')
      .insert({
        sync_type: 'full',
        status: failedCount === 0 ? 'completed' : 'partial',
        message: failedCount === 0 
          ? 'Successfully synced all products from Printful'
          : `Synced ${syncedCount} products with ${failedCount} failures`,
        started_at: startedAt,
        completed_at: completedAt,
        products_synced: syncedCount,
        products_failed: failedCount
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: failedCount === 0 
          ? 'Product sync completed successfully'
          : `Product sync completed with ${failedCount} failures`,
        syncedCount,
        failedCount,
        startedAt,
        completedAt
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
      tags: { endpoint: 'sync' }
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