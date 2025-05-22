import type { APIContext } from 'astro';
import { isAdmin } from '../../../utils/auth';
import { createServerSupabaseClient } from '../../../lib/supabase';

// Do not pre-render this endpoint at build time
export const prerender = false;

interface TableCheckResult {
  exists: boolean;
  count?: number;
  error: string | null;
  errorCode: string | null;
  sample?: any;
}

export async function GET({ request, cookies }: APIContext) {
  try {
    // Check if user is admin
    const isAdminUser = await isAdmin({ cookies });
    
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

    // Initialize Supabase client
    const supabase = createServerSupabaseClient({ cookies });
    
    // Check for specific tables
    const tables = [
      'printful_sync_history',
      'printful_product_changes',
      'products',
      'product_variants'
    ];

    const results: Record<string, TableCheckResult> = {};
    
    // Check each table
    for (const table of tables) {
      try {
        // Try to get a single row just to verify access
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(1);
        
        results[table] = {
          exists: !error,
          count: count || 0,
          error: error ? error.message : null,
          errorCode: error ? error.code : null,
          sample: data && data.length > 0 ? data[0] : null
        };
      } catch (tableError) {
        results[table] = {
          exists: false,
          error: tableError instanceof Error ? tableError.message : 'Unknown error',
          errorCode: 'EXCEPTION'
        };
      }
    }
    
    return new Response(JSON.stringify({
      message: 'Database table check results',
      data: results
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error checking database tables:', error);
    
    return new Response(JSON.stringify({
      error: 'Database Check Failed',
      message: error instanceof Error ? error.message : 'Unknown error checking database',
      details: error instanceof Error ? error.stack : null
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 