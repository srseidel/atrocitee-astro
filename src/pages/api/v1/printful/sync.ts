import * as Sentry from '@sentry/astro';

import { env } from '@lib/config/env';

import { PrintfulProductSync } from '@lib/printful/product-sync';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { createAdminSupabaseClient } from '@lib/supabase/admin-client';

import type { APIRoute } from 'astro';

// Do not pre-render this endpoint at build time
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Create both clients - server for auth, admin for operations
  const supabase = createServerSupabaseClient({ cookies, request });
  const adminClient = createAdminSupabaseClient({ cookies, request });

  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized - Not authenticated',
          details: authError?.message
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin using RPC function
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized - Not admin',
          details: 'User is not an admin'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if API key exists
    if (!env.printful.apiKey) {
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

    // Initialize PrintfulProductSync with admin client
    const productSync = new PrintfulProductSync(adminClient);
    const result = await productSync.syncProducts();

    // Log success in sync history using admin client
    await adminClient
      .from('printful_sync_history')
      .insert({
        sync_type: 'manual',
        status: result.failedCount === 0 ? 'success' : 'partial',
        message: result.message,
        products_synced: result.syncedCount,
        products_failed: result.failedCount,
        started_at: result.startedAt,
        completed_at: result.completedAt
      });

    return new Response(JSON.stringify({
      success: true,
      message: result.message,
      data: {
        syncedCount: result.syncedCount,
        failedCount: result.failedCount,
        startedAt: result.startedAt,
        completedAt: result.completedAt
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in sync endpoint:', error);
    
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: { operation: 'syncEndpoint' }
    });

    // Log failure in sync history using admin client
    try {
      await adminClient
        .from('printful_sync_history')
        .insert({
          sync_type: 'manual',
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          products_synced: 0,
          products_failed: 0,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log sync failure:', logError);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 