import { createServerClient } from '@supabase/ssr';

import { env } from '@lib/config/env';

import type { MiddlewareHandler , AstroCookies , AstroGlobal } from 'astro';

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
      console.error(`Error getting cookie ${key}:`, error);
      return null;
    }
  },
  set: (key: string, value: string, options: { path?: string; maxAge?: number; domain?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean }): void => {
    try {
      cookies.set(key, value, { 
        ...options, 
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    } catch (error) {
      console.error(`Error setting cookie ${key}:`, error);
    }
  },
  remove: (key: string, options: { path?: string; domain?: string }): void => {
    try {
      cookies.delete(key, { 
        ...options, 
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    } catch (error) {
      console.error(`Error removing cookie ${key}:`, error);
    }
  },
  getAll: (): { name: string; value: string }[] => {
    try {
      // Since AstroCookies doesn't have entries(), we'll return an empty array
      // This is fine since Supabase only uses getAll for debugging
      return [];
    } catch (error) {
      console.error('Error getting all cookies:', error);
      return [];
    }
  }
});

// Pattern matching for protected routes
const ADMIN_ROUTE_PATTERN = /^\/admin\//;
const ACCOUNT_ROUTE_PATTERN = /^\/account(\/|$)/;
const ACCOUNT_SETTINGS_PATH = '/account/setting';
const ACCOUNT_ORDER_PATH = '/account/order';
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/forgot-password'];

// Helper function to check if a user is an admin
export const isAdmin = async ({ cookies }: { cookies: AstroCookies }): Promise<boolean> => {
  try {
    const supabase = createServerSupabaseClient({ cookies });
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return false;
    }
    
    // Check user metadata for admin role
    const isAdminUser = user.app_metadata?.role === 'admin' || 
                        user.user_metadata?.role === 'admin';
    
    if (isAdminUser) {
      return true;
    }
    
    // Make RPC call to check admin status in database
    const { data: adminCheckResult, error: adminCheckError } = await supabase
      .rpc('is_admin', { user_id: user.id });
    
    return !adminCheckError && !!adminCheckResult;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Helper function to redirect if user is not admin
export const redirectIfNotAdmin = async (Astro: AstroGlobal): Promise<Response | null> => {
  try {
    const isAdminUser = await isAdmin({ cookies: Astro.cookies });
    
    if (!isAdminUser) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/auth/unauthorized'
        }
      });
    }
    
    return null;
  } catch (error) {
    console.error('Error in redirectIfNotAdmin:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/auth/login'
      }
    });
  }
};

// Authentication middleware
export const authMiddleware: MiddlewareHandler = async ({ cookies, request, url }, next): Promise<Response> => {
  // Skip auth check for non-protected routes and auth pages
  const pathname = url.pathname;
  const isAuthPage = AUTH_PATHS.includes(pathname);
  const isProtectedRoute = ADMIN_ROUTE_PATTERN.test(pathname) || 
                           ACCOUNT_ROUTE_PATTERN.test(pathname) || 
                           pathname === ACCOUNT_SETTINGS_PATH || 
                           pathname === ACCOUNT_ORDER_PATH;
  
  if (!isProtectedRoute || isAuthPage) {
    const response = await next();
    return response instanceof Response ? response : new Response();
  }

  // Determine if this is an admin route that requires admin privileges
  const requiresAdmin = ADMIN_ROUTE_PATTERN.test(pathname);
  
  try {
    // Create Supabase client
    const supabase = createServerSupabaseClient({ cookies });
    
    // Get user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // eslint-disable-next-line no-console
    console.log(`[Middleware] Auth check for ${pathname}, User:`, user?.id || 'none');
    
    // If no user or error, redirect to login
    if (error || !user) {
      // eslint-disable-next-line no-console
      console.log(`[Middleware] No authenticated user found:`, error?.message);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `/auth/login?redirect=${encodeURIComponent(pathname)}`
        }
      });
    }
    
    // If admin route, check admin permissions
    if (requiresAdmin) {
      // Check user metadata for admin role
      const isAdminUser = user.app_metadata?.role === 'admin' || 
                          user.user_metadata?.role === 'admin';
      
      // eslint-disable-next-line no-console
      console.log(`[Middleware] Admin check for user ${user.id}, metadata check:`, isAdminUser);
      
      if (!isAdminUser) {
        // Make RPC call to check admin status in database
        const { data: adminCheckResult, error: adminCheckError } = await supabase
          .rpc('is_admin', { user_id: user.id });
        
        // eslint-disable-next-line no-console
        console.log(`[Middleware] Admin DB check result:`, adminCheckResult, adminCheckError?.message);
        
        // If not admin or error checking, redirect to unauthorized page
        if (adminCheckError || !adminCheckResult) {
          // eslint-disable-next-line no-console
          console.log(`[Middleware] User is not an admin, redirecting to unauthorized`);
          return new Response(null, {
            status: 302,
            headers: {
              'Location': '/auth/unauthorized'
            }
          });
        }
      }
    }
    
    // User is authenticated (and is admin if required), proceed
    // eslint-disable-next-line no-console
    console.log(`[Middleware] Auth check passed for ${pathname}`);
    const response = await next();
    return response instanceof Response ? response : new Response();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    
    // On error, redirect to login
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `/auth/login?redirect=${encodeURIComponent(pathname)}`
      }
    });
  }
};

// Combined middleware for auth and CSP
export const onRequest: MiddlewareHandler = async (context, next): Promise<Response> => {
  // First run auth middleware
  const authResponse = await authMiddleware(context, next);
  
  // If auth middleware returned a response (redirect), return it
  if (authResponse instanceof Response) {
    return authResponse;
  }
  
  // Otherwise, get the response from next()
  const response = await next();
  
  // Add CSP headers
  if (response instanceof Response) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://fonts.googleapis.com; " +
      "style-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://*.supabase.co https://api.printful.com https://astro.build https://*.astro.build;"
    );
  }
  
  return response;
};

export const createServerSupabaseClient = ({ cookies }: { cookies: AstroCookies }): ReturnType<typeof createServerClient> => {
  return createServerClient(
    env.supabase.url,
    env.supabase.anonKey,
    { cookies: astroCookiesAdapter(cookies) }
  );
}; 