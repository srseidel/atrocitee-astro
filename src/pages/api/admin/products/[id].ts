import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '../../../../lib/supabase';

// Server-side rendering for API endpoint
export const prerender = false;

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const supabase = createServerSupabaseClient({ cookies });
  const { id } = params;
  const data = await request.json();

  try {
    // Update product
    const { error: updateError } = await supabase
      .from('products')
      .update({
        name: data.name,
        description: data.description,
        category_id: data.category_id,
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
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error updating product'
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