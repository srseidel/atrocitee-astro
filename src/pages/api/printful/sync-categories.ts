import type { APIRoute } from 'astro';
import { isAdmin } from '../../../utils/auth-fixed';
import PrintfulProductSync from '../../../lib/printful/product-sync';
import { createServerSupabaseClient } from '../../../lib/supabase';

// Ensure this endpoint is server-rendered
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log('[API] Starting category sync process');
    
    // Direct database diagnostics
    try {
      console.log('[API] Performing direct database diagnostics');
      const supabase = createServerSupabaseClient({ cookies });
      
      // Check auth session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('[API] Auth session check:', sessionError ? 'Failed' : 'Success');
      console.log('[API] User authenticated:', sessionData?.session ? 'Yes' : 'No');
      
      if (sessionError) {
        console.error('[API] Auth session error:', sessionError);
      }
      
      // Check table existence and permissions
      const tables = ['printful_category_mapping', 'categories', 'products'];
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true });
        
        console.log(`[API] Table '${table}' access check:`, error ? 'Failed' : 'Success');
        if (error) {
          console.error(`[API] Table '${table}' error:`, error);
        } else {
          console.log(`[API] Table '${table}' count:`, data?.count);
        }
      }
    } catch (diagError) {
      console.error('[API] Diagnostics error:', diagError);
    }
    
    // Check if user is admin
    const isAdminUser = await isAdmin({ cookies });
    
    if (!isAdminUser) {
      console.log('[API] User is not an admin, rejecting request');
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

    // Initialize product sync service
    console.log('[API] Initializing ProductSync service');
    const productSync = new PrintfulProductSync(cookies);
    
    // Sync categories from Printful
    console.log('[API] Calling syncCategories()');
    const result = await productSync.syncCategories();
    console.log('[API] Sync result:', result);
    
    // Return the result
    return new Response(JSON.stringify({
      message: `Printful categories synchronized successfully. Added ${result.added} new categories, updated ${result.existing} existing categories.`,
      data: result,
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[API] Error syncing Printful categories:', error);
    
    // Get detailed error information
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : { message: 'Unknown error type', details: String(error) };
    
    return new Response(JSON.stringify({
      error: 'Category Sync Failed',
      message: errorDetails.message,
      details: errorDetails,
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 