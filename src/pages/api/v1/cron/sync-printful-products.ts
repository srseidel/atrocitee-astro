import * as Sentry from '@sentry/astro';

import { runScheduledSync, shouldRunSync } from '@lib/printful/scheduled-sync';

import type { APIContext } from 'astro';

// Do not pre-render this endpoint at build time
export const prerender = false;

/**
 * Endpoint for scheduled synchronization of Printful products
 * This can be called by a cron job or other automated process
 */
export async function POST({ request }: APIContext) {
  try {
    // Verify secret token if provided in environment variables
    const cronSecret = import.meta.env.CRON_SECRET;
    
    if (cronSecret) {
      const authHeader = request.headers.get('Authorization');
      const providedToken = authHeader?.split('Bearer ')[1];
      
      if (providedToken !== cronSecret) {
        console.warn('Invalid cron secret token provided');
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid secret token'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    // Parse the request body if any
    let forceSync = false;
    try {
      const body = await request.json();
      forceSync = !!body.force;
    } catch (e) {
      // No body or invalid JSON, continue without force option
    }
    
    // Check if we should run a sync based on last sync time
    // Skip this check if force is true
    if (!forceSync) {
      const shouldSync = await shouldRunSync();
      
      if (!shouldSync) {
        return new Response(JSON.stringify({
          message: 'Sync skipped - Recent sync exists',
          data: { skipped: true }
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    // Run the scheduled sync
    const result = await runScheduledSync();
    
    // Return response with sync results
    return new Response(JSON.stringify({
      message: `Scheduled product sync completed: ${result.success} products synced successfully, ${result.failed} failures.`,
      data: {
        success_count: result.success,
        failure_count: result.failed,
        sync_id: result.syncId
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error during scheduled product sync:', error);
    
    // Log to Sentry
    Sentry.captureException(error, {
      tags: { endpoint: 'sync-printful-products' }
    });
    
    // Return error response
    return new Response(JSON.stringify({
      error: 'Sync Failed',
      message: error instanceof Error ? error.message : 'Unknown error during product synchronization'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 