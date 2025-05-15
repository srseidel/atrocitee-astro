import type { APIContext } from 'astro';
import { isAdmin } from '../../../utils/auth-fixed';
import ENV from '../../../config/env';

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

    // Check environment variables
    const apiKey = ENV.PRINTFUL_API_KEY;
    const hasApiKey = !!apiKey;
    
    // Return response with environment status
    return new Response(JSON.stringify({
      message: 'Environment configuration check',
      data: {
        has_printful_api_key: hasApiKey,
        api_key_preview: hasApiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'Not set',
        node_env: ENV.NODE_ENV || 'Not set'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error checking environment:', error);
    
    // Return error response
    return new Response(JSON.stringify({
      error: 'Configuration Check Failed',
      message: error instanceof Error ? error.message : 'Unknown error checking configuration'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 