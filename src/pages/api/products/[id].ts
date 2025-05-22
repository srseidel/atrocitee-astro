import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '../../../lib/supabase';
import { isAdmin } from '../../../utils/auth';

export const prerender = false;

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  // Check if user is admin
  const isAdminUser = await isAdmin({ cookies });
  if (!isAdminUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Product ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabase = createServerSupabaseClient({ cookies });
    const data = await request.json();

    // Start a transaction
    const { data: existingProduct } = await supabase
      .from('products')
      .select('atrocitee_metadata')
      .eq('id', id)
      .single();

    const { data: product, error: updateError } = await supabase
      .from('products')
      .update({
        name: data.name,
        slug: data.slug,
        description: data.description,
        atrocitee_base_price: data.atrocitee_base_price,
        atrocitee_donation_amount: data.atrocitee_donation_amount,
        atrocitee_charity_id: data.atrocitee_charity_id,
        atrocitee_active: data.atrocitee_active,
        atrocitee_featured: data.atrocitee_featured,
        atrocitee_metadata: {
          ...(existingProduct?.atrocitee_metadata || {}),
          category_id: data.category_id
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating product:', updateError);
      throw new Error(updateError.message);
    }

    // Update tags
    if (data.tags) {
      try {
        // First, delete existing tags
        const { error: deleteError } = await supabase
          .from('product_tags')
          .delete()
          .eq('product_id', id);

        if (deleteError) throw deleteError;

        // Then, insert new tags
        if (data.tags.length > 0) {
          const { error: tagsError } = await supabase
            .from('product_tags')
            .insert(
              data.tags.map((tag: { tag_id: string }) => ({
                product_id: id,
                tag_id: tag.tag_id
              }))
            );

          if (tagsError) throw tagsError;
        }
      } catch (error) {
        console.error('Error updating tags:', error);
        throw new Error('Failed to update product tags');
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      product,
      message: 'Product updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update product',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 