import { createServerClient } from '@supabase/ssr';
import { createServerSupabaseClient, checkAdminStatus } from '@lib/supabase/client';
import { env } from '@lib/config/env';
import { debug } from '@lib/utils/debug';
import type { AstroCookies, AstroGlobal, MiddlewareHandler } from 'astro';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { APIContext } from 'astro';

// Define custom locals type
declare global {
  namespace App {
    interface Locals {
      user: User | null;
      supabase: SupabaseClient;
    }
  }
}

// Helper to adapt AstroCookies to Supabase SSR's expected interface
const astroCookiesAdapter = (cookies: AstroCookies): {
  get: (key: string) => string | null;
  set: (key: string, value: string, options: { path?: string; maxAge?: number; domain?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean }) => void;
  remove: (key: string, options: { path?: string; domain?: string }) => void;
  getAll: () => { name: string; value: string }[];
} => ({
  get: (key: string): string | null => {
    try {
      const cookie = cookies.get(key);
      return cookie?.value ?? null;
    } catch (error) {
      debug.criticalError(`Error getting cookie ${key}`, error, { cookieKey: key });
      return null;
    }
  },
  set: (key: string, value: string, options: { path?: string; maxAge?: number; domain?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean }): void => {
    try {
      cookies.set(key, value, { 
        path: '/',
        sameSite: 'lax',
        secure: import.meta.env.PROD,
        maxAge: options.maxAge || 60 * 60 * 24 * 7, // Default to 7 days if not specified
        ...options // Allow overriding defaults
      });
    } catch (error) {
      debug.criticalError(`Error setting cookie ${key}`, error, { cookieKey: key });
    }
  },
  remove: (key: string, options: { path?: string; domain?: string }): void => {
    try {
      cookies.delete(key, { 
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    } catch (error) {
      debug.criticalError(`Error removing cookie ${key}`, error, { cookieKey: key });
    }
  },
  getAll: (): { name: string; value: string }[] => {
    try {
      return [];
    } catch (error) {
      debug.criticalError('Error getting all cookies', error);
      return [];
    }
  }
});

// Pattern matching for protected routes
const ADMIN_ROUTE_PATTERN = /^\/admin\//;
const ACCOUNT_ROUTE_PATTERN = /^\/account(\/|$)/;
const ADMIN_API_ROUTE_PATTERN = /^\/api\/v1\/(admin|tags)\//;
const ACCOUNT_SETTINGS_PATH = '/account/setting';
const ACCOUNT_ORDER_PATH = '/account/orders';
const AUTH_PATHS = ['/auth/login', '/auth/signin', '/auth/signup', '/auth/reset-password', '/auth/forgot-password'];

// Helper function to check if a user is an admin
export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Check the role directly from app_metadata
    return user.app_metadata?.role === 'admin';
  } catch (error) {
    debug.criticalError('Error checking admin status in isAdmin helper', error);
    return false;
  }
}

// Helper function to redirect if user is not admin
export const redirectIfNotAdmin = async (Astro: AstroGlobal): Promise<Response | null> => {
  try {
    const isAdminUser = await isAdmin(Astro.locals.supabase);
    
    if (!isAdminUser) {
      return Astro.redirect('/auth/login?redirect=/admin');
    }
    
    return null;
  } catch (error) {
    debug.criticalError('Error checking admin status in redirectIfNotAdmin', error);
    return Astro.redirect('/auth/login?redirect=/admin');
  }
};

// Authentication middleware
export const authMiddleware: MiddlewareHandler = async (context, next) => {
  const { cookies, request, url } = context;
  
  // Skip auth check for public routes
  const pathname = url.pathname;
  const isPublicRoute = !pathname.startsWith('/admin') && 
                       !pathname.startsWith('/account') && 
                       !ADMIN_API_ROUTE_PATTERN.test(pathname);
  
  // Skip auth check for shop routes (they are prerendered)
  const isShopRoute = pathname.startsWith('/shop/');
  
  // Skip auth check for debug/test pages
  const isDebugRoute = pathname.startsWith('/test-');
  
  if (isPublicRoute || isShopRoute || isDebugRoute) {
    return next();
  }

  try {
    // Create Supabase client
    const supabase = createServerSupabaseClient({ cookies, request });

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();


    // Add user to locals so it's available in all routes
    context.locals.user = user;
    context.locals.supabase = supabase;

    // Check for admin routes (both web and API)
    const isAdminRoute = pathname.startsWith('/admin') || ADMIN_API_ROUTE_PATTERN.test(pathname);
    if (isAdminRoute && (!user?.app_metadata?.role || user.app_metadata.role !== 'admin')) {
      // For API routes, return 403 instead of redirecting
      if (pathname.startsWith('/api')) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Admin privileges required',
          success: false
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      // For web routes, redirect to unauthorized page
      return context.redirect('/auth/unauthorized');
    }

    // If trying to access account routes without being logged in, redirect to login
    if (pathname.startsWith('/account') && !user) {
      return context.redirect('/auth/login');
    }

    return next();
  } catch (error) {
    debug.criticalError('Middleware error', error, { pathname });
    // For API routes, return 500 instead of redirecting
    if (pathname.startsWith('/api')) {
      return new Response(JSON.stringify({
        error: 'Server Error',
        message: error instanceof Error ? error.message : 'Internal server error',
        success: false
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    return context.redirect('/auth/login');
  }
};

// Helper function to redirect if user is not authenticated
export const redirectIfNotAuthenticated = async (Astro: AstroGlobal): Promise<Response | null> => {
  try {
    const supabase = createServerSupabaseClient({ cookies: Astro.cookies, request: Astro.request });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return Astro.redirect('/auth/login');
    }
    
    return null;
  } catch (error) {
    debug.criticalError('Error checking authentication in redirectIfNotAuthenticated', error);
    return Astro.redirect('/auth/login');
  }
};

// Helper function to redirect if user is authenticated
export const redirectIfAuthenticated = async (Astro: AstroGlobal): Promise<Response | null> => {
  try {
    const supabase = createServerSupabaseClient({ cookies: Astro.cookies, request: Astro.request });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      return Astro.redirect('/');
    }
    
    return null;
  } catch (error) {
    debug.criticalError('Error checking authentication in redirectIfAuthenticated', error);
    return null;
  }
};

// Helper function to get user data
export const getUser = async (Astro: AstroGlobal) => {
  try {
    const supabase = createServerSupabaseClient({ cookies: Astro.cookies, request: Astro.request });
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // Throw auth errors so they can be handled upstream
      if (error.message?.includes('Auth session missing')) {
        throw new Error('Authentication session expired');
      }
      throw error;
    }
    
    return user;
  } catch (error) {
    debug.criticalError('Error in getUser', error);
    throw error; // Re-throw so calling code can handle appropriately
  }
};

// Helper function to update user admin role
export const updateUserToAdmin = async (
  email: string,
  supabaseAdminClient: SupabaseClient,
  isAdmin: boolean = true // Add parameter to control admin status
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First, get the user by email
    const { data: { users }, error: getUserError } = await supabaseAdminClient.auth.admin.listUsers();
    
    if (getUserError) {
      throw getUserError;
    }

    const targetUser = users.find(u => u.email === email);
    if (!targetUser) {
      return { success: false, error: 'User not found' };
    }

    // Update the user's role in auth.users
    const { error: updateError } = await supabaseAdminClient.auth.admin.updateUserById(
      targetUser.id,
      { 
        app_metadata: { 
          role: isAdmin ? 'admin' : null 
        }
      }
    );

    if (updateError) {
      throw updateError;
    }

    // Update the user's role in profiles table
    const { error: profileError } = await supabaseAdminClient
      .from('profiles')
      .update({ role: isAdmin ? 'admin' : null })
      .eq('id', targetUser.id);

    if (profileError) {
      throw profileError;
    }

    return { success: true };
  } catch (error) {
    debug.criticalError('Error updating user role', error, { email, isAdmin });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user role' 
    };
  }
}; 