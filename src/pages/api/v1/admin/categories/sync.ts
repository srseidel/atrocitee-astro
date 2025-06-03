import { isAdmin } from '@lib/auth/middleware';
import { PrintfulProductSync } from '@lib/printful/product-sync';
import { PrintfulService } from '@lib/printful/service';
import { createAdminSupabaseClient } from '@lib/supabase/admin-client';

import type { APIRoute } from 'astro';

// Ensure this endpoint is server-rendered
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Initialize Supabase client first for admin check
    const supabase = await createAdminSupabaseClient({ cookies, request });
    
    // Check if user is admin using the Supabase client
    const isAdminUser = await isAdmin(supabase);
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

    // Initialize remaining dependencies
    const productSync = PrintfulProductSync.getInstance(supabase);
    
    // Sync categories from Printful
    const result = await productSync.syncCategories();
    
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
    console.error('Error syncing Printful categories:', error);
    
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