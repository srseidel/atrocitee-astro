import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { getMockupSet } from '@utils/helpers/mockups';

export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    const supabase = createServerSupabaseClient({ cookies, request });
    
    // Get the variant
    const { data: variant } = await supabase
      .from('product_variants')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!variant) {
      return new Response(JSON.stringify({ error: 'Variant not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Get mockup images for the variant
    const mockupSet = await getMockupSet(variant);

    return new Response(JSON.stringify(mockupSet), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error getting mockups:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 