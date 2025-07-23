/**
 * Test Profile Update API
 * 
 * Quick test endpoint to debug profile update issues
 */

export const prerender = false;

import { createServerSupabaseClient } from '@lib/supabase/client';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createServerSupabaseClient({ cookies, request });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication failed',
        details: authError.message 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No user found' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    
    // Test profile update
    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: body.display_name || 'Test Name',
        first_name: body.first_name || 'Test',
        last_name: body.last_name || 'User',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database update failed',
        details: error.message,
        code: error.code,
        hint: error.hint
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data,
      user_id: user.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test profile update error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Server error',
      details: error.message || error.toString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};