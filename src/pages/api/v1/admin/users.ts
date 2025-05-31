import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase client
    const supabase = createServerSupabaseClient({ cookies, request });

    // Check if the requesting user is an admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.app_metadata?.role || user.app_metadata.role !== 'admin') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), { status: 403 });
    }

    // Parse search parameters
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const role = url.searchParams.get('role');

    // Build query
    let query = supabase
      .from('profiles')
      .select('id, email, role, created_at');

    // Apply filters if provided
    if (email) {
      query = query.ilike('email', `%${email}%`);
    }
    if (role) {
      query = role === 'user' 
        ? query.is('role', null) // null role means regular user
        : query.eq('role', role);
    }

    // Execute query
    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch users'
      }), { status: 500 });
    }

    return new Response(JSON.stringify({
      success: true,
      users: users || []
    }));

  } catch (error) {
    console.error('Error in users endpoint:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), { status: 500 });
  }
}; 