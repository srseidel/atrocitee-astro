import type { APIContext } from 'astro';
import { createServerSupabaseClient } from '../../lib/supabase';

// Do not pre-render this endpoint at build time
export const prerender = false;

// GET: Fetch all categories
export async function GET({ request, cookies }: APIContext) {
  try {
    // Initialize Supabase client
    const supabase = createServerSupabaseClient({ cookies });
    
    // Fetch categories with basic error handling
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching categories:', error);
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
    
    // Return successful response
    return new Response(JSON.stringify({
      data: data || [],
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in categories API:', error);
    
    return new Response(JSON.stringify({
      error: 'Server Error',
      message: error instanceof Error ? error.message : 'Unknown error fetching categories',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 