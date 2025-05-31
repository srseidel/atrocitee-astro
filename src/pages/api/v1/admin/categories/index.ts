import { isAdmin } from '@lib/auth/middleware';
import { createServerSupabaseClient } from '@lib/supabase/client';

import type { APIRoute } from 'astro';

// Ensure this endpoint is server-rendered
export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createServerSupabaseClient({ cookies, request });
    
    const { data: categories, error } = await supabase
      .from('atrocitee_categories')
      .select('*')
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

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check if user is admin
    const isAdminUser = await isAdmin(cookies);
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

    const supabase = createServerSupabaseClient({ cookies, request });
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('atrocitee_categories')
      .upsert({
        name: body.name,
        slug: body.slug,
        description: body.description,
        is_active: body.is_active ?? true
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return new Response(JSON.stringify({
      category: data,
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update category',
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