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
    
    // Get session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log(`[Middleware] Auth check for ${pathname}, Session:`, session?.user?.id || 'none');
    
    // If no session or error, redirect to login
    if (error || !session) {
      console.log(`[Middleware] No authenticated session found:`, error?.message);
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
      const isAdminUser = session.user.app_metadata?.role === 'admin' || 
                          session.user.user_metadata?.role === 'admin';
      
      console.log(`[Middleware] Admin check for user ${session.user.id}, metadata check:`, isAdminUser);
      
      if (!isAdminUser) {
        // Make RPC call to check admin status in database
        const { data: adminCheckResult, error: adminCheckError } = await supabase
          .rpc('is_admin', { user_id: session.user.id });
        
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

// Combined middleware for auth and CSP
export const onRequest: MiddlewareHandler = async (context, next) => {
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
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://*.supabase.co https://api.printful.com;"
    );
  }
  
  return response;
}; 