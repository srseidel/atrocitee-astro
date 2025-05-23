import type { APIContext } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { isAdmin } from '@lib/auth/middleware';

// Do not pre-render this endpoint at build time
export const prerender = false;

// GET: Fetch a single tag
export async function GET({ params, cookies }: APIContext) {
  try {
    const supabase = createServerSupabaseClient({ cookies });
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({
        error: 'Validation Error',
        message: 'Tag ID is required',
        success: false
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching tag:', error);
      return new Response(JSON.stringify({
        error: 'Database Error',
        message: error.message,
        success: false
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (!data) {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Tag not found',
        success: false
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      data,
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in tag API:', error);
    return new Response(JSON.stringify({
      error: 'Server Error',
      message: error instanceof Error ? error.message : 'Unknown error fetching tag',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// PUT: Update a tag
export async function PUT({ params, request, cookies }: APIContext) {
  try {
    const supabase = createServerSupabaseClient({ cookies });
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({
        error: 'Validation Error',
        message: 'Tag ID is required',
        success: false
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Check if user is admin
    const isUserAdmin = await isAdmin(supabase);
    if (!isUserAdmin) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Admin privileges required',
        success: false
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const body = await request.json();

    // Basic validation
    if (!body.name || !body.slug) {
      return new Response(JSON.stringify({
        error: 'Validation Error',
        message: 'Name and slug are required',
        success: false
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const { data, error } = await supabase
      .from('tags')
      .update({
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        active: body.active !== undefined ? body.active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tag:', error);
      return new Response(JSON.stringify({
        error: 'Database Error',
        message: error.message,
        success: false
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      data,
      message: 'Tag updated successfully',
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in tag API:', error);
    return new Response(JSON.stringify({
      error: 'Server Error',
      message: error instanceof Error ? error.message : 'Unknown error updating tag',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// DELETE: Delete a tag
export async function DELETE({ params, cookies }: APIContext) {
  try {
    const supabase = createServerSupabaseClient({ cookies });
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({
        error: 'Validation Error',
        message: 'Tag ID is required',
        success: false
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Check if user is admin
    const isUserAdmin = await isAdmin(supabase);
    if (!isUserAdmin) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Admin privileges required',
        success: false
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // First, delete any product_tag associations
    const { error: productTagError } = await supabase
      .from('product_tags')
      .delete()
      .eq('tag_id', id);

    if (productTagError) {
      console.error('Error deleting product tag associations:', productTagError);
      return new Response(JSON.stringify({
        error: 'Database Error',
        message: 'Failed to delete product tag associations',
        success: false
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Then delete the tag itself
    const { error: deleteError } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting tag:', deleteError);
      return new Response(JSON.stringify({
        error: 'Database Error',
        message: deleteError.message,
        success: false
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      message: 'Tag deleted successfully',
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in tag API:', error);
    return new Response(JSON.stringify({
      error: 'Server Error',
      message: error instanceof Error ? error.message : 'Unknown error deleting tag',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 