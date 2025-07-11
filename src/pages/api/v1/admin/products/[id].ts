import { isAdmin } from '@lib/auth/middleware';
import { createServerSupabaseClient } from '@lib/supabase/client';

import { CORE_CATEGORIES } from 'src/types/database/models';

import type { APIRoute } from 'astro';

// Server-side rendering for API endpoint
export const prerender = false;

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Product ID is required' }), {
        status: 400,
      });
    }

    // Create Supabase client
    const supabase = createServerSupabaseClient({ cookies, request });

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // Get request data
    const data = await request.json();

    // Update product
    const { error } = await supabase
      .from('products')
      .update({
        name: data.name,
        description: data.description,
        published_status: data.published_status,
        atrocitee_base_price: data.atrocitee_base_price,
        atrocitee_donation_amount: data.atrocitee_donation_amount,
        atrocitee_charity_id: data.atrocitee_charity_id,
        atrocitee_featured: data.atrocitee_featured,
        atrocitee_category_id: data.atrocitee_category_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Create Supabase client
    const supabase = createServerSupabaseClient({ cookies, request });

    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Product ID is required' }), {
        status: 400,
      });
    }

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Delete request unauthorized: No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized - Not authenticated' }), {
        status: 401,
      });
    }

    // Check if user is admin using the RPC function
    const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin');
    
    if (adminError) {
      console.error('Error checking admin status:', adminError);
      return new Response(JSON.stringify({ error: 'Error checking admin status' }), {
        status: 500,
      });
    }

    if (!adminCheck) {
      console.error('Delete request unauthorized: User is not admin', { userId: user.id });
      return new Response(JSON.stringify({ error: 'Unauthorized - Not admin' }), {
        status: 401,
      });
    }

    console.log('Starting product deletion:', { productId: id, userId: user.id });

    // Start a transaction to delete everything related to this product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting product:', deleteError);
      throw deleteError;
    }

    console.log('Product deleted successfully:', { productId: id });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Product and all related data deleted successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error deleting product'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 