import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get the product slug from the request
    const { slug } = await request.json();
    
    if (!slug) {
      return new Response(JSON.stringify({ error: 'Product slug is required' }), {
        status: 400,
      });
    }

    // Verify admin access
    const supabase = createServerSupabaseClient({ cookies, request });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { data: isAdmin } = await supabase
      .rpc('is_admin', { user_id: user.id });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // Create response with revalidation header
    return new Response(JSON.stringify({ message: 'Product page revalidation requested' }), {
      status: 200,
      headers: {
        // This header tells Astro to revalidate the page
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error revalidating product page:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}; 