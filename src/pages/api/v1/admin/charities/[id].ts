import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';

// Ensure server-side rendering
export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, params }) => {
  try {
    const supabase = createServerSupabaseClient({ cookies, request });
    
    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Only admins can access this endpoint'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get charity by ID
    const { data: charity, error } = await supabase
      .from('charities')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      throw error;
    }

    if (!charity) {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Charity not found'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(charity), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`Error in GET /api/v1/admin/charities/${params.id}:`, error);
    return new Response(JSON.stringify({
      error: 'Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ request, cookies, params }) => {
  try {
    const supabase = createServerSupabaseClient({ cookies, request });
    
    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Only admins can access this endpoint'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get request body
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return new Response(JSON.stringify({
        error: 'Validation Error',
        message: 'Name is required'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update charity
    const { data: charity, error } = await supabase
      .from('charities')
      .update({
        name: body.name,
        description: body.description,
        website_url: body.website_url,
        logo_url: body.logo_url,
        active: body.active ?? true
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!charity) {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Charity not found'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(charity), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`Error in PUT /api/v1/admin/charities/${params.id}:`, error);
    return new Response(JSON.stringify({
      error: 'Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, cookies, params }) => {
  try {
    const supabase = createServerSupabaseClient({ cookies, request });
    
    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Only admins can access this endpoint'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete charity
    const { error } = await supabase
      .from('charities')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw error;
    }

    return new Response(null, { status: 204 });

  } catch (error) {
    console.error(`Error in DELETE /api/v1/admin/charities/${params.id}:`, error);
    return new Response(JSON.stringify({
      error: 'Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 