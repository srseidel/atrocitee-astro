// Import middleware from relative path since aliases don't work in Node.js entrypoint files
import { authMiddleware } from './lib/auth/middleware';
import { defineMiddleware } from 'astro:middleware';

// Combine auth and CSP middleware
export const onRequest = defineMiddleware(async (context, next) => {
  // First run auth middleware
  const authResponse = await authMiddleware(context, next);
  
  // If auth middleware returned void, get the response from next()
  const response = authResponse || await next();
  
  // Then add CSP headers (including Stripe domains and Cloudflare assets)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; " +
    "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; " +
    "style-src 'self' 'unsafe-inline' https: data: blob:; " +
    "style-src-elem 'self' 'unsafe-inline' https: data: blob:; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data: https:; " +
    "connect-src 'self' ws: wss: http: https: data: blob:; " +
    "frame-src 'self' https:; " +
    "media-src 'self' data: https: blob:; " +
    "worker-src 'self' blob:; " +
    "child-src 'self' blob:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self' https:; " +
    "frame-ancestors 'none';"
  );

  return response;
}); 