import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with the service role for server-side operations
 * that need admin privileges. This should only be used in secure server environments.
 */
export function createServiceSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials for service client');
    throw new Error('Missing Supabase credentials for service client');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Make sure the named export is also available
export default createServiceSupabaseClient; 