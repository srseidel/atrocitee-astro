import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient, createBrowserClient } from '@supabase/ssr';

// Environment variables with fallbacks for build time
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we're in build/SSG mode
const isBuild = process.env.NODE_ENV === 'production' && import.meta.env.SSR && !import.meta.env.DEV;

// Create a client for browser usage - with safety check for build time
export const createBrowserSupabaseClient = () => {
  // During build, return a mock client if environment variables are missing
  if (isBuild && (!import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY)) {
    console.warn('Supabase client created with placeholder credentials during build');
    // Return a minimal mock client for build time
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signUp: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null })
      }
    } as any;
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
};

// For direct usage in components (backward compatible with existing code)
export const supabase = createBrowserSupabaseClient();

// Create a server client (for use in .astro files)
export const createServerSupabaseClient = ({ cookies }: { cookies: any }) => {
  // During build, return a mock client if environment variables are missing
  if (isBuild && (!import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY)) {
    console.warn('Supabase server client created with placeholder credentials during build');
    // Return a minimal mock client for build time
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signOut: () => Promise.resolve({ error: null })
      }
    } as any;
  }

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
  const { data } = await client.auth.getUser();
  return data.user;
}; 