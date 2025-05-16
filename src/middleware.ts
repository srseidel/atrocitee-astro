import { createServerSupabaseClient } from './lib/supabase';
import type { MiddlewareHandler } from 'astro';

// Pattern matching for protected routes
const ADMIN_ROUTE_PATTERN = /^\/admin\//;
const ACCOUNT_ROUTE_PATTERN = /^\/account(\/|$)/;
const ACCOUNTS_SETTINGS_PATH = '/accounts/setting';
const ACCOUNTS_ORDER_PATH = '/accounts/order';
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/forgot-password'];

// Authentication middleware
const authMiddleware: MiddlewareHandler = async ({ cookies, request, url }, next) => {
  // Skip auth check for non-protected routes and auth pages
  const pathname = url.pathname;
  const isAuthPage = AUTH_PATHS.includes(pathname);
  const isProtectedRoute = ADMIN_ROUTE_PATTERN.test(pathname) || 
                           ACCOUNT_ROUTE_PATTERN.test(pathname) || 
                           pathname === ACCOUNTS_SETTINGS_PATH || 
                           pathname === ACCOUNTS_ORDER_PATH;
  
  if (!isProtectedRoute || isAuthPage) {
    return next();
  }

  // Determine if this is an admin route that requires admin privileges
  const requiresAdmin = ADMIN_ROUTE_PATTERN.test(pathname);
  
  try {
    // Create Supabase client
    const supabase = createServerSupabaseClient({ cookies });
    const { data, error } = await supabase.auth.getUser();
    
    console.log(`[Middleware] Auth check for ${pathname}, User:`, data?.user?.id || 'none');
    
    // If no user or error, redirect to login
    if (error || !data.user) {
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
      const isAdminUser = data.user.app_metadata?.role === 'admin' || 
                          data.user.user_metadata?.role === 'admin';
      
      console.log(`[Middleware] Admin check for user ${data.user.id}, metadata check:`, isAdminUser);
      
      if (!isAdminUser) {
        // Make RPC call to check admin status in database
        const { data: adminCheckResult, error: adminCheckError } = await supabase
          .rpc('is_admin', { user_id: data.user.id });
        
        console.log(`[Middleware] Admin DB check result:`, adminCheckResult, adminCheckError?.message);
        
        // If not admin or error checking, redirect to unauthorized page
        if (adminCheckError || !adminCheckResult) {
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
    console.log(`[Middleware] Auth check passed for ${pathname}`);
    return next();
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

// Export the middleware
export const onRequest = authMiddleware; 