import type { APIContext } from 'astro';
import { isAdmin } from '../../../utils/auth';
import { createServerSupabaseClient } from '../../../lib/supabase';

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

    console.log('[TestDB] Starting database test');
    
    // Test database connection and operations
    try {
      // Get Supabase client
      const supabase = createServerSupabaseClient({ cookies });
      console.log('[TestDB] Created Supabase client');
      
      // Test 1: Create test record in printful_sync_history
      const testId = `test-${Date.now()}`;
      console.log('[TestDB] Creating test sync history record');
      const { data: historyData, error: historyError } = await supabase
        .from('printful_sync_history')
        .insert({
          id: testId,
          sync_type: 'test',
          status: 'success',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          products_synced: 0,
          products_failed: 0,
          message: 'Database test record'
        })
        .select()
        .single();
        
      if (historyError) {
        throw new Error(`Sync history test failed: ${historyError.message}`);
      }
      
      console.log('[TestDB] Test record created:', historyData.id);
      
      // Test 2: Insert a test product change
      console.log('[TestDB] Creating test product change record');
      const { data: changeData, error: changeError } = await supabase
        .from('printful_product_changes')
        .insert({
          sync_history_id: testId,
          change_type: 'metadata',
          change_severity: 'minor',
          field_name: 'test_field',
          old_value: 'old_test',
          new_value: 'new_test',
          status: 'pending_review'
        })
        .select()
        .single();
        
      if (changeError) {
        throw new Error(`Product change test failed: ${changeError.message}`);
      }
      
      console.log('[TestDB] Test product change created:', changeData.id);
      
      // Test 3: Delete our test records to clean up
      console.log('[TestDB] Cleaning up test records');
      
      // Delete the product change
      const { error: deleteChangeError } = await supabase
        .from('printful_product_changes')
        .delete()
        .eq('id', changeData.id);
        
      if (deleteChangeError) {
        console.warn(`Warning: Couldn't clean up test product change: ${deleteChangeError.message}`);
      }
      
      // Delete the sync history
      const { error: deleteHistoryError } = await supabase
        .from('printful_sync_history')
        .delete()
        .eq('id', testId);
        
      if (deleteHistoryError) {
        console.warn(`Warning: Couldn't clean up test sync history: ${deleteHistoryError.message}`);
      }
      
      console.log('[TestDB] Cleanup complete');
      
      // Return success response
      return new Response(JSON.stringify({
        message: 'Database test successful',
        data: {
          history_id: historyData.id,
          change_id: changeData.id
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (dbError) {
      console.error('[TestDB] Database test failed:', dbError);
      return new Response(JSON.stringify({
        error: 'Database Test Failed',
        message: dbError instanceof Error ? dbError.message : 'Unknown database error',
        details: dbError instanceof Error ? dbError.stack : null
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('[TestDB] General error:', error);
    
    // Return error response
    return new Response(JSON.stringify({
      error: 'Test Failed',
      message: error instanceof Error ? error.message : 'Unknown error in test endpoint',
      details: error instanceof Error ? error.stack : null
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 