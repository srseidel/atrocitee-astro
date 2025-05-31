/**
 * Scheduled Product Synchronization
 * 
 * This module provides functionality for scheduled synchronization of Printful products.
 * It can be called from a cron job or a webhook to keep products in sync automatically.
 */

import * as Sentry from '@sentry/astro';

import { PrintfulProductSync } from '@lib/printful/product-sync';
import { createAdminSupabaseClient } from '@lib/supabase/admin-client';

/**
 * Run a scheduled product synchronization
 * This function can be called from a scheduled job (e.g., a cron job)
 */
export async function runScheduledSync() {
  try {
    // eslint-disable-next-line no-console
    console.log('[Scheduled Sync] Starting scheduled product synchronization');
    
    // Create an admin client that uses the service role key
    const supabase = createAdminSupabaseClient();
    
    // Create a product sync instance
    const productSync = PrintfulProductSync.getInstance();
    
    // Run the sync process
    const result = await productSync.syncProducts();
    
    // eslint-disable-next-line no-console
    console.log(`[Scheduled Sync] Completed with ${result.syncedCount} successes and ${result.failedCount} failures`);
    
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Scheduled Sync] Error:', error);
    
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: { operation: 'scheduledSync' }
    });
    
    throw error;
  }
}

/**
 * Check if a sync is needed based on the last sync time
 * @param minHoursBetweenSyncs The minimum number of hours that should pass between syncs
 */
export async function shouldRunSync(minHoursBetweenSyncs = 12): Promise<boolean> {
  try {
    // Create an admin client that uses the service role key
    const supabase = createAdminSupabaseClient();
    
    // Get the most recent sync
    const { data, error } = await supabase
      .from('printful_sync_history')
      .select('completed_at')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // If no records found or other error, we should run a sync
      // eslint-disable-next-line no-console
      console.log('[Scheduled Sync] No previous sync found, should run sync');
      return true;
    }
    
    if (!data.completed_at) {
      // If the last sync didn't complete, we should run a new one
      // eslint-disable-next-line no-console
      console.log('[Scheduled Sync] Last sync did not complete, should run sync');
      return true;
    }
    
    // Calculate time since last sync
    const lastSyncTime = new Date(data.completed_at).getTime();
    const currentTime = new Date().getTime();
    const hoursSinceLastSync = (currentTime - lastSyncTime) / (1000 * 60 * 60);
    
    // eslint-disable-next-line no-console
    console.log(`[Scheduled Sync] Hours since last sync: ${hoursSinceLastSync.toFixed(2)}`);
    
    // Run sync if enough time has passed
    return hoursSinceLastSync >= minHoursBetweenSyncs;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Scheduled Sync] Error checking sync status:', error);
    
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: { operation: 'shouldRunSync' }
    });
    
    // If there's an error, let's run a sync to be safe
    return true;
  }
} 