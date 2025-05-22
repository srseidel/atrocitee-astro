import type { APIContext } from 'astro';
import { isAdmin } from '../../../utils/auth';
import { createServerSupabaseClient } from '../../../lib/supabase';

// Do not pre-render this endpoint at build time
export const prerender = false;

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
    
    const results: Record<string, { success: boolean, error: string | null }> = {};
    
    // Create printful_sync_history table
    try {
      const { error } = await supabase.rpc('create_printful_sync_history_table');
      results['printful_sync_history'] = {
        success: !error,
        error: error ? error.message : null
      };
    } catch (err) {
      console.error('Error creating printful_sync_history table:', err);
      results['printful_sync_history'] = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
      
      // Try SQL alternative
      try {
        const { error } = await supabase.rpc('execute_sql', { 
          sql: `
            CREATE TABLE IF NOT EXISTS public.printful_sync_history (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              sync_type TEXT NOT NULL,
              status TEXT NOT NULL,
              message TEXT,
              products_synced INTEGER DEFAULT 0,
              products_failed INTEGER DEFAULT 0,
              started_at TIMESTAMP WITH TIME ZONE,
              completed_at TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
          `
        });
        
        if (!error) {
          results['printful_sync_history'].success = true;
          results['printful_sync_history'].error = 'Created with direct SQL';
        }
      } catch (sqlErr) {
        console.error('SQL alternative also failed:', sqlErr);
      }
    }
    
    // Create printful_product_changes table
    try {
      const { error } = await supabase.rpc('create_printful_product_changes_table');
      results['printful_product_changes'] = {
        success: !error,
        error: error ? error.message : null
      };
    } catch (err) {
      console.error('Error creating printful_product_changes table:', err);
      results['printful_product_changes'] = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
      
      // Try SQL alternative
      try {
        const { error } = await supabase.rpc('execute_sql', { 
          sql: `
            CREATE TABLE IF NOT EXISTS public.printful_product_changes (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              product_id UUID REFERENCES public.products(id),
              printful_product_id INTEGER,
              change_type TEXT NOT NULL,
              change_severity TEXT NOT NULL,
              field_name TEXT NOT NULL,
              old_value TEXT,
              new_value TEXT,
              status TEXT NOT NULL,
              sync_history_id UUID REFERENCES public.printful_sync_history(id),
              reviewed_by UUID,
              reviewed_at TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
          `
        });
        
        if (!error) {
          results['printful_product_changes'].success = true;
          results['printful_product_changes'].error = 'Created with direct SQL';
        }
      } catch (sqlErr) {
        console.error('SQL alternative also failed:', sqlErr);
      }
    }
    
    return new Response(JSON.stringify({
      message: 'Database tables creation results',
      data: results
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating database tables:', error);
    
    return new Response(JSON.stringify({
      error: 'Database Creation Failed',
      message: error instanceof Error ? error.message : 'Unknown error creating database tables',
      details: error instanceof Error ? error.stack : null
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 