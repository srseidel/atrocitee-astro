import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { isAdmin } from '@lib/auth/middleware';

// Ensure this endpoint is server-rendered
export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const supabase = createServerSupabaseClient({ cookies });
    
    const { data: mappings, error } = await supabase
      .from('printful_category_mapping')
      .select(`
        *,
        atrocitee_category:atrocitee_categories (
          id,
          name,
          slug
        )
      `)
      .order('printful_category_name');
    
    if (error) {
      throw error;
    }
    
    return new Response(JSON.stringify({
      mappings: mappings || [],
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
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

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

    const supabase = createServerSupabaseClient({ cookies });
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('printful_category_mapping')
      .upsert({
        printful_category_id: body.printful_category_id,
        printful_category_name: body.printful_category_name,
        atrocitee_category_id: body.atrocitee_category_id,
        is_active: body.is_active ?? true
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return new Response(JSON.stringify({
      mapping: data,
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
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
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

    const supabase = createServerSupabaseClient({ cookies });
    const body = await request.json();
    
    const { error } = await supabase
      .from('printful_category_mapping')
      .delete()
      .eq('id', body.id);
    
    if (error) {
      throw error;
    }
    
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error deleting category mapping:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete category mapping',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 