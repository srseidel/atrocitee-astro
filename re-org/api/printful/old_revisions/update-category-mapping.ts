import type { APIRoute } from 'astro';
import { isAdmin } from '../../../utils/auth-fixed';
import PrintfulProductSync from '../../../lib/printful/product-sync';

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

    // Get request body
    const body = await request.json();
    const { printfulCategoryId, atrociteeCategoryId, isActive } = body;

    if (!printfulCategoryId) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
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
      printfulCategoryId,
      atrociteeCategoryId,
      isActive
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
      error: 'Failed to update category mapping',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 