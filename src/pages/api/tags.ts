import type { APIContext } from 'astro';
import { createServerSupabaseClient } from '../../lib/supabase';

// Do not pre-render this endpoint at build time
export const prerender = false;

// GET: Fetch all tags
export async function GET({ request, cookies }: APIContext) {
  try {
    // Initialize Supabase client
    const supabase = createServerSupabaseClient({ cookies });
    
    // Fetch tags with basic error handling
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching tags:', error);
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
    console.error('Error in tags API:', error);
    
    return new Response(JSON.stringify({
      error: 'Server Error',
      message: error instanceof Error ? error.message : 'Unknown error fetching tags',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// POST: Create a new tag
export async function POST({ request, cookies }: APIContext) {
  try {
    const supabase = createServerSupabaseClient({ cookies });
    
    // Verify admin permissions would go here in a real implementation
    
    // Get tag data from request
    const body = await request.json();
    
    // Basic validation
    if (!body.name || !body.slug) {
      return new Response(JSON.stringify({
        error: 'Validation Error',
        message: 'Name and slug are required',
        success: false
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Insert new tag
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        active: body.active !== undefined ? body.active : true
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating tag:', error);
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
      data,
      message: 'Tag created successfully',
      success: true
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in tags API:', error);
    
    return new Response(JSON.stringify({
      error: 'Server Error',
      message: error instanceof Error ? error.message : 'Unknown error creating tag',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 