import type { APIContext } from 'astro';
import { createServerSupabaseClient } from '../../../lib/supabase';
import { isAdmin } from '../../../utils/auth';

// Do not pre-render this endpoint at build time
export const prerender = false;

export async function GET({ request, cookies }: APIContext) {
  try {
    console.log('[API] Starting DB test');
    const supabase = createServerSupabaseClient({ cookies });
    
    // Check Supabase client
    const hasAuth = !!supabase?.auth;
    const hasFrom = typeof supabase?.from === 'function';
    console.log('[API] Supabase client check:', { hasAuth, hasFrom });
    
    if (!hasAuth || !hasFrom) {
      throw new Error('Invalid Supabase client');
    }
    
    // 1. Test authentication
    console.log('[API] Testing authentication');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // 2. Test if printful_category_mapping exists
    console.log('[API] Testing table existence');
    const tableNames = ['printful_category_mapping', 'categories', 'products'];
    const tableResults: Record<string, any> = {};
    
    for (const table of tableNames) {
      try {
        // Using RPC function to check table existence
        const { data: existsData, error: existsError } = await supabase
          .rpc('check_table_exists', { table_name_param: table });
        
        // Direct attempt to select from the table
        const { data: countData, error: countError } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true });
        
        tableResults[table] = {
          exists: existsData?.exists || 'Error checking existence',
          existsError: existsError?.message || null,
          count: countData ? 'Count query succeeded' : 'Count query failed',
          countError: countError?.message || null,
          details: countError ? {
            code: countError.code,
            hint: countError.hint,
            details: countError.details
          } : null
        };
      } catch (e) {
        tableResults[table] = {
          error: e instanceof Error ? e.message : 'Unknown error'
        };
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      auth: {
        user: user?.email || 'No user',
        error: authError?.message || null
      },
      tables: tableResults
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[API] DB Test error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack available'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 