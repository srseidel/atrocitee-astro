import { isAdmin } from '@lib/auth/middleware';
import { createServerSupabaseClient } from '@lib/supabase/client';

import { CORE_CATEGORIES } from 'src/types/database/models';

import type { APIRoute } from 'astro';

// Server-side rendering for API endpoint
export const prerender = false;

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  try {
    // Check if user is admin
    const isAdminUser = await isAdmin({ cookies });
    if (!isAdminUser) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Admin access required',
        details: 'You must be logged in as an admin to update products'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const supabase = createServerSupabaseClient({ cookies });
    const { id } = params;
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.slug) {
      return new Response(JSON.stringify({
        error: 'Validation Error',
        message: 'Missing required fields',
        details: 'Product name and slug are required fields'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    try {
      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: data.name,
          description: data.description,
          slug: data.slug,
          atrocitee_category_id: data.atrocitee_category_id || null,
          atrocitee_base_price: data.atrocitee_base_price,
          atrocitee_donation_amount: data.atrocitee_donation_amount,
          atrocitee_active: data.atrocitee_active,
          atrocitee_featured: data.atrocitee_featured,
          atrocitee_metadata: data.atrocitee_metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Handle tags
      if (Array.isArray(data.atrocitee_tags)) {
        // First, delete existing tags
        const { error: deleteError } = await supabase
          .from('product_tags')
          .delete()
          .eq('product_id', id);

        if (deleteError) throw deleteError;

        // Then insert new tags
        if (data.atrocitee_tags.length > 0) {
          const tagInserts = data.atrocitee_tags.map((tagId: string) => ({
            product_id: id,
            tag_id: tagId
          }));

          const { error: insertError } = await supabase
            .from('product_tags')
            .insert(tagInserts);

          if (insertError) throw insertError;
        }
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Product updated successfully',
        details: `Product "${data.name}" has been updated successfully`,
        productId: id
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return new Response(
      JSON.stringify({
        error: 'Server Error',
        message: 'Failed to update product',
        details: error instanceof Error ? error.message : 'An unexpected error occurred while updating the product',
        timestamp: new Date().toISOString()
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

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const supabase = createServerSupabaseClient({ cookies });
  const { id } = params;

  try {
    // Delete product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(JSON.stringify({ success: true }), {
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