import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';

// Ensure server-side rendering
export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
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

    // Get all charities
    const { data: charities, error } = await supabase
      .from('charities')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(charities), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in GET /api/v1/admin/charities:', error);
    return new Response(JSON.stringify({
      error: 'Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
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

    // Insert new charity
    const { data: charity, error } = await supabase
      .from('charities')
      .insert([{
        name: body.name,
        description: body.description,
        website_url: body.website_url,
        logo_url: body.logo_url,
        active: body.active ?? true
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(charity), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in POST /api/v1/admin/charities:', error);
    return new Response(JSON.stringify({
      error: 'Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 