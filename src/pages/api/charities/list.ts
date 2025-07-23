/**
 * Charities List API
 * 
 * Returns a list of active charities for user selection
 */

import type { APIRoute } from 'astro';
import { createClient } from '@lib/supabase/client';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const supabase = createClient();
    
    // Fetch active charities
    const { data: charities, error } = await supabase
      .from('charities')
      .select('id, name, description, website_url, active')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Charities query error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch charities',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        charities: charities || [],
        count: charities?.length || 0,
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Charities API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};