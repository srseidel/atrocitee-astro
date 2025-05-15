import type { APIContext } from 'astro';
import { isAdmin } from '../../../utils/auth-fixed';
import PrintfulProductSync from '../../../lib/printful/product-sync';

// Do not pre-render this endpoint at build time
export const prerender = false;

// GET: Fetch all category mappings
export async function GET({ request, cookies }: APIContext) {
  try {
    // Initialize product sync service
    const productSync = new PrintfulProductSync(cookies);
    
    // Get all category mappings
    const mappings = await productSync.getCategoryMapping();
    
    return new Response(JSON.stringify({
      data: mappings,
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching category mappings:', error);
    
    return new Response(JSON.stringify({
      error: 'Fetch Failed',
      message: error instanceof Error ? error.message : 'Unknown error fetching category mappings',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// POST: Update a category mapping
export async function POST({ request, cookies }: APIContext) {
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

    // Parse the request body
    const body = await request.json();
    
    // Validate the request
    if (!body.printfulCategoryId) {
      return new Response(JSON.stringify({
        error: 'Invalid Request',
        message: 'printfulCategoryId is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Initialize product sync service
    const productSync = new PrintfulProductSync(cookies);
    
    // Update the category mapping
    await productSync.updateCategoryMapping(
      body.printfulCategoryId,
      body.atrociteeCategoryId || null,
      body.isActive !== undefined ? body.isActive : true
    );
    
    return new Response(JSON.stringify({
      message: 'Category mapping updated successfully',
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error updating category mapping:', error);
    
    return new Response(JSON.stringify({
      error: 'Update Failed',
      message: error instanceof Error ? error.message : 'Unknown error updating category mapping',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 