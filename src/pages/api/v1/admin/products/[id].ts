import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { isAdmin } from '@lib/auth/middleware';
import { CORE_CATEGORIES } from 'src/types/database/models';

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

    // If category is provided as a slug, get the corresponding UUID
    let categoryId = data.atrocitee_category_id;
    if (data.atrocitee_category_id && typeof data.atrocitee_category_id === 'string') {
      // First check if it's a valid core category
      if (Object.values(CORE_CATEGORIES).includes(data.atrocitee_category_id)) {
        const { data: category, error: categoryError } = await supabase
          .from('atrocitee_categories')
          .select('id')
          .eq('slug', data.atrocitee_category_id)
          .single();

        if (categoryError) {
          console.error('Category lookup error:', categoryError);
          return new Response(JSON.stringify({
            error: 'Category Error',
            message: 'Failed to look up category',
            details: `Error looking up category "${data.atrocitee_category_id}": ${categoryError.message}`,
            categorySlug: data.atrocitee_category_id
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }

        if (!category) {
          return new Response(JSON.stringify({
            error: 'Category Error',
            message: 'Category not found',
            details: `The category "${data.atrocitee_category_id}" does not exist in the database`,
            categorySlug: data.atrocitee_category_id
          }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }

        categoryId = category.id;
      } else {
        // If not a core category, assume it's a UUID
        categoryId = data.atrocitee_category_id;
      }
    }

    // Update product
    const { error: updateError } = await supabase
      .from('products')
      .update({
        name: data.name,
        description: data.description,
        slug: data.slug,
        atrocitee_category_id: categoryId,
        atrocitee_base_price: data.atrocitee_base_price,
        atrocitee_donation_amount: data.atrocitee_donation_amount,
        atrocitee_active: data.atrocitee_active,
        atrocitee_featured: data.atrocitee_featured,
        atrocitee_tags: data.atrocitee_tags,
        atrocitee_metadata: data.atrocitee_metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({
        error: 'Update Error',
        message: 'Failed to update product',
        details: `Error updating product: ${updateError.message}`,
        productId: id
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
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