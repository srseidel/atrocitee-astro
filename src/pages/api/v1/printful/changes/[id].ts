import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id } = params;
    const { action } = await request.json();
    const supabase = createServerSupabaseClient({ cookies });

    if (!id || !action) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing required parameters'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Get the change record
    const { data: change, error: fetchError } = await supabase
      .from('printful_product_changes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (action === 'approve') {
      // Update the product with the new value
      const { error: updateError } = await supabase
        .from('products')
        .update({
          [change.field_name]: change.new_value
        })
        .eq('id', change.product_id);

      if (updateError) throw updateError;

      // Update the change record
      const { error: changeError } = await supabase
        .from('printful_product_changes')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (changeError) throw changeError;
    } else if (action === 'reject') {
      // Update the change record
      const { error: changeError } = await supabase
        .from('printful_product_changes')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (changeError) throw changeError;
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid action'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Change ${action}ed successfully`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error processing change:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to process change'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 