import type { APIRoute } from 'astro';
import { isAdmin } from '../../../utils/auth-fixed';
import PrintfulProductSync from '../../../lib/printful/product-sync';
import { createServerSupabaseClient } from '../../../lib/supabase';
import { PrintfulService } from '../../../lib/printful/service';

// Ensure this endpoint is server-rendered
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
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

    // Initialize dependencies
    const supabase = createServerSupabaseClient({ cookies });
    const printfulService = PrintfulService.getInstance();
    const productSync = new PrintfulProductSync(supabase, printfulService);
    
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