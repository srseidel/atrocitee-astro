import type { APIRoute } from 'astro';
import { isAdmin } from '../../../utils/auth-fixed';
import PrintfulProductSync from '../../../lib/printful/product-sync';

// Ensure this endpoint is server-rendered
export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
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

    // Initialize product sync service
    const productSync = new PrintfulProductSync(cookies);
    
    // Get category mappings
    const mappings = await productSync.getCategoryMapping();
    
    return new Response(JSON.stringify({
      mappings,
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error loading category mappings:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to load category mappings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 