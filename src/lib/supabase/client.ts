import { createServerClient, createBrowserClient } from '@supabase/ssr';
import pkg from '@supabase/supabase-js';

const { createClient } = pkg;
import { env } from '@lib/config/env';

import type { TypedSupabaseClient } from '../../types/supabase';
import type { CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';

// Environment variables with fallbacks for build time
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we're in build/SSG mode
const isBuild = process.env.NODE_ENV === 'production' && import.meta.env.SSR && !import.meta.env.DEV;

// Mock client type for build time
interface MockSupabaseClient {
  auth: {
    getUser: () => Promise<{ data: { user: null }, error: null }>;
    signInWithPassword: () => Promise<{ data: null, error: null }>;
    signUp: () => Promise<{ data: null, error: null }>;
    signOut: () => Promise<{ error: null }>;
    signInWithOtp: (params: { email: string; options?: { emailRedirectTo?: string } }) => Promise<{ data: null, error: null }>;
    updateUser: (params: { password: string }) => Promise<{ data: null, error: null }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      limit: (count: number) => Promise<{ data: null; error: null }>;
    };
  };
}

// Create a client for browser usage - with safety check for build time
export const createBrowserSupabaseClient = (): SupabaseClient | MockSupabaseClient => {
  // During build, return a mock client if environment variables are missing
  if (isBuild && (!import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY)) {
    console.warn('Supabase client created with placeholder credentials during build');
    // Return a minimal mock client for build time
    const mockClient = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signUp: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        signInWithOtp: () => Promise.resolve({ data: null, error: null }),
        updateUser: () => Promise.resolve({ data: null, error: null })
      },
      from: () => ({
        select: () => ({
          limit: () => Promise.resolve({ data: null, error: null })
        })
      })
    };
    return mockClient as unknown as MockSupabaseClient;
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
};

// For direct usage in components (backward compatible with existing code)
export const supabase = createBrowserSupabaseClient();

// Helper to adapt AstroCookies to Supabase SSR's expected interface
const astroCookiesAdapter = (cookies: AstroCookies): {
  get: (key: string) => string | null;
  set: (key: string, value: string, options: { path?: string; maxAge?: number; domain?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean }) => void;
  remove: (key: string, options: { path?: string; domain?: string }) => void;
  getAll: () => { name: string; value: string }[];
} => ({
  get: (key: string): string | null => {
    const cookie = cookies.get(key);
    return cookie ? cookie.value : null;
  },
  set: (key: string, value: string, options: { path?: string; maxAge?: number; domain?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean }): void => {
    cookies.set(key, value, { 
      ...options, 
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
  },
  remove: (key: string, options: { path?: string; domain?: string }): void => {
    cookies.delete(key, { 
      ...options, 
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
  },
  getAll: (): { name: string; value: string }[] => {
    // Since AstroCookies doesn't have entries(), we'll return an empty array
    // This is fine since Supabase only uses getAll for debugging
    return [];
  }
});

export const createServerSupabaseClient = ({ cookies }: { cookies: AstroCookies }): TypedSupabaseClient => {
  return createServerClient(
    env.supabase.url,
    env.supabase.anonKey,
    { cookies: astroCookiesAdapter(cookies) }
  );
};

// Auth helper functions (for backward compatibility)
export const signIn = async (email: string, password: string): Promise<{ data: unknown; error: unknown }> => {
  const client = createBrowserSupabaseClient();
  if (!password) {
    // Handle password reset
    const { data, error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/reset-password`,
      },
    });
    return { data, error };
  }
  // Handle normal sign in
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signUp = async (email: string, password: string): Promise<{ data: unknown; error: unknown }> => {
  const client = createBrowserSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password
  });
  return { data, error };
};

export const signOut = async (): Promise<{ error: unknown }> => {
  const client = createBrowserSupabaseClient();
  return client.auth.signOut();
};

export const getCurrentUser = async (): Promise<unknown> => {
  const client = createBrowserSupabaseClient();
  const { data } = await client.auth.getUser();
  return data.user;
};

// Type-safe helper for checking admin status
export async function checkAdminStatus(supabase: ReturnType<typeof createServerSupabaseClient>, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  return profile?.role === 'admin';
} 