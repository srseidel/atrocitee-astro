// Import middleware from relative path since aliases don't work in Node.js entrypoint files
import { authMiddleware } from './lib/auth/middleware';
import { defineMiddleware } from 'astro:middleware';

// Combine auth and CSP middleware
export const onRequest = defineMiddleware(async (context, next) => {
  // First run auth middleware
  const authResponse = await authMiddleware(context, next);
  
  // If auth middleware returned void, get the response from next()
  const response = authResponse || await next();
  
  // Then add CSP headers (including Stripe domains)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://static.cloudflareinsights.com https://js.stripe.com; " +
    "script-src-elem 'self' 'unsafe-inline' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://fonts.googleapis.com; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "connect-src 'self' ws: wss: http: https: ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:* https://*.supabase.co https://api.printful.com https://api.stripe.com https://sentry.io https://cloudflareinsights.com; " +
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'none'; " +
    "upgrade-insecure-requests;"
  );

  return response;
}); 