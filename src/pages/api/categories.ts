import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '../../lib/supabase';

// Ensure this endpoint is server-rendered
export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const supabase = createServerSupabaseClient({ cookies });
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return new Response(JSON.stringify({
      categories: categories || [],
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error loading categories:', error);
    return new Response(JSON.stringify({
      error: 'Failed to load categories',
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