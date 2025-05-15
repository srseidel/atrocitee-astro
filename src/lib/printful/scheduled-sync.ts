/**
 * Scheduled Product Synchronization
 * 
 * This module provides functionality for scheduled synchronization of Printful products.
 * It can be called from a cron job or a webhook to keep products in sync automatically.
 */

import PrintfulProductSync from './product-sync';
import { createServerSupabaseClient } from '../supabase';
import * as Sentry from '@sentry/astro';

/**
 * Run a scheduled product synchronization
 * This function can be called from a scheduled job (e.g., a cron job)
 */
export async function runScheduledSync() {
  try {
    console.log('[Scheduled Sync] Starting scheduled product synchronization');
    
    // Create a server-side Supabase client with empty cookies
    // This will use the service role key instead of user authentication
    const supabase = createServerSupabaseClient({ cookies: {} });
    
    // Create a product sync instance with the supabase client
    const productSync = new PrintfulProductSync({ cookies: {} });
    
    // Run the sync process
    const { success, failed, syncId } = await productSync.syncAllProducts('scheduled');
    
    console.log(`[Scheduled Sync] Completed with ${success} successes and ${failed} failures`);
    
    // Log the sync event
    await supabase
      .from('printful_sync_history')
      .update({
        message: `Scheduled sync completed with ${success} successes and ${failed} failures`
      })
      .eq('id', syncId);
    
    return { success, failed, syncId };
  } catch (error) {
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
    // Create a server-side Supabase client
    const supabase = createServerSupabaseClient({ cookies: {} });
    
    // Get the most recent sync
    const { data, error } = await supabase
      .from('printful_sync_history')
      .select('completed_at')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // If no records found or other error, we should run a sync
      console.log('[Scheduled Sync] No previous sync found, should run sync');
      return true;
    }
    
    if (!data.completed_at) {
      // If the last sync didn't complete, we should run a new one
      console.log('[Scheduled Sync] Last sync did not complete, should run sync');
      return true;
    }
    
    // Calculate time since last sync
    const lastSyncTime = new Date(data.completed_at).getTime();
    const currentTime = new Date().getTime();
    const hoursSinceLastSync = (currentTime - lastSyncTime) / (1000 * 60 * 60);
    
    console.log(`[Scheduled Sync] Hours since last sync: ${hoursSinceLastSync.toFixed(2)}`);
    
    // Run sync if enough time has passed
    return hoursSinceLastSync >= minHoursBetweenSyncs;
  } catch (error) {
    console.error('[Scheduled Sync] Error checking sync status:', error);
    
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: { operation: 'shouldRunSync' }
    });
    
    // If there's an error, let's run a sync to be safe
    return true;
  }
} 