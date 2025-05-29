import * as Sentry from '@sentry/astro';

import { isAdmin } from '@lib/auth/middleware';
import PrintfulProductSync from '@lib/printful/product-sync';

import type { APIContext } from 'astro';


// Do not pre-render this endpoint at build time
export const prerender = false;

export async function GET({ request, cookies, url }: APIContext) {
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

    // Get status param if provided
    const status = url.searchParams.get('status') as 'pending_review' | 'approved' | 'rejected' | 'applied' | undefined;
    
    // Initialize the product sync service
    const productSync = new PrintfulProductSync(cookies);
    
    // Get product changes
    const changes = await productSync.getProductChanges(status);
    
    // Return response with product changes
    return new Response(JSON.stringify({
      data: changes
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching product changes:', error);
    
    // Log to Sentry
    Sentry.captureException(error, {
      tags: { endpoint: 'product-changes' }
    });
    
    // Return error response
    return new Response(JSON.stringify({
      error: 'Fetch Failed',
      message: error instanceof Error ? error.message : 'Unknown error fetching product changes'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

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

    // Get the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.changeId || !body.status) {
      return new Response(JSON.stringify({
        error: 'Invalid Request',
        message: 'changeId and status are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate status
    if (!['approved', 'rejected'].includes(body.status)) {
      return new Response(JSON.stringify({
        error: 'Invalid Request',
        message: 'status must be either "approved" or "rejected"'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Get user info from context - assumes auth middleware has attached this
    const userId = body.userId;
    
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Invalid Request',
        message: 'userId is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Initialize the product sync service
    const productSync = new PrintfulProductSync(cookies);
    
    // Review the product change
    const success = await productSync.reviewProductChange(
      body.changeId,
      body.status as 'approved' | 'rejected',
      userId
    );
    
    if (!success) {
      return new Response(JSON.stringify({
        error: 'Update Failed',
        message: 'Failed to update product change status'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Return success response
    return new Response(JSON.stringify({
      message: `Product change ${body.status}`,
      data: {
        changeId: body.changeId,
        status: body.status
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error reviewing product change:', error);
    
    // Log to Sentry
    Sentry.captureException(error, {
      tags: { endpoint: 'product-changes' }
    });
    
    // Return error response
    return new Response(JSON.stringify({
      error: 'Review Failed',
      message: error instanceof Error ? error.message : 'Unknown error reviewing product change'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 