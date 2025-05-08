import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient, createBrowserClient } from '@supabase/ssr';

// Environment variables
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Create a client for browser usage
export const createBrowserSupabaseClient = () => {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
};

// For direct usage in components (backward compatible with existing code)
export const supabase = createBrowserSupabaseClient();

// Create a server client (for use in .astro files)
export const createServerSupabaseClient = ({ cookies }: { cookies: any }) => {
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get: (key) => cookies.get(key)?.value,
        set: (key, value, options) => {
          cookies.set(key, value, { 
            ...options, 
            path: '/' 
          });
        },
        remove: (key, options) => {
          cookies.delete(key, { 
            ...options, 
            path: '/' 
          });
        },
      },
    }
  );
};

// Auth helper functions (for backward compatibility)
export const signIn = async (email: string, password: string) => {
  const client = createBrowserSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signUp = async (email: string, password: string) => {
  const client = createBrowserSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password
  });
  return { data, error };
};

export const signOut = async () => {
  const client = createBrowserSupabaseClient();
  return client.auth.signOut();
};

export const getCurrentUser = async () => {
  const client = createBrowserSupabaseClient();
  const { data } = await client.auth.getSession();
  return data.session?.user;
}; 