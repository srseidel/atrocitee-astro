import { isAdmin } from '@lib/auth/middleware';
import { createServerSupabaseClient } from '@lib/supabase/client';

import type { APIRoute } from 'astro';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, cookies }) => {
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
    
    console.log('Updating product:', {
      id: params.id,
      body: body
    });
    
    // Prepare update data, handling empty values properly
    const updateData = {
      name: body.name,
      description: body.description,
      slug: body.slug,
      thumbnail_url: body.thumbnail_url,
      atrocitee_active: body.atrocitee_active,
      atrocitee_featured: body.atrocitee_featured,
      atrocitee_tags: body.atrocitee_tags || [],
      atrocitee_metadata: body.atrocitee_metadata || {},
      atrocitee_base_price: body.atrocitee_base_price,
      atrocitee_donation_amount: body.atrocitee_donation_amount,
      // Only include category_id if it's not empty
      ...(body.atrocitee_category_id ? { atrocitee_category_id: body.atrocitee_category_id } : { atrocitee_category_id: null }),
      // Only include charity_id if it's not empty
      ...(body.atrocitee_charity_id ? { atrocitee_charity_id: body.atrocitee_charity_id } : { atrocitee_charity_id: null })
    };
    
    console.log('Update data:', updateData);
    
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Update successful:', data);
    
    return new Response(JSON.stringify({
      product: data,
      success: true,
      message: 'Product updated successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Get detailed error message
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    
    return new Response(JSON.stringify({
      error: 'Failed to update product',
      message: errorMessage,
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 