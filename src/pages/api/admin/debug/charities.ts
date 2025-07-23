/**
 * Debug Charities API
 * 
 * Shows existing charity data in the database for inspection
 */

import type { APIRoute } from 'astro';
import { createClient } from '@lib/supabase/client';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const supabase = createClient();
    
    // Fetch all charities (both active and inactive) to see what exists
    const { data: charities, error, count } = await supabase
      .from('charities')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Charities debug query error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch charities',
          details: error,
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Also check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec', { 
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'charities' 
          ORDER BY ordinal_position;
        `
      });

    return new Response(
      JSON.stringify({
        success: true,
        charities: charities || [],
        count: count || 0,
        table_structure: tableInfo || 'Unable to fetch table structure',
        summary: {
          total_charities: count || 0,
          active_charities: charities?.filter(c => c.active).length || 0,
          inactive_charities: charities?.filter(c => !c.active).length || 0,
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Charities debug API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};