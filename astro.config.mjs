// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import sentry from '@sentry/astro';

// Determine if we're in development or production mode
const isDev = process.env.NODE_ENV === 'development';

// https://astro.build/config
export default defineConfig({
  // In development, use static output to avoid SSR issues
  // In production, use server output for dynamic features
  output: isDev ? 'static' : 'server',
  adapter: cloudflare(),
  integrations: [
    tailwind(),
    react({
      include: ['**/react/*', '**/components/**/*.tsx', '**/components/**/*.jsx']
    }),
    // Add Sentry integration without direct configuration
    // Configuration is handled in sentry.client.config.js and sentry.server.config.js
    !isDev || process.env.ENABLE_SENTRY_IN_DEV ? sentry() : null,
  ].filter(Boolean), // Filter out null values
  vite: {
    // CLOUDFLARE COMPATIBILITY FIX:
    // For Cloudflare deployment: Use React DOM's edge-compatible server module
    // to fix "MessageChannel is not defined" errors in Cloudflare's edge environment.
    //
    // See Docs/Cloudflare-React-MessageChannel-Fix.md for more details.
    ...(isDev ? {} : {
      resolve: {
        alias: {
          // Only apply this in production builds
          'react-dom/server': 'react-dom/server.edge'
        }
      }
    }),
    // These additional optimizations help with the build process
    optimizeDeps: {
      exclude: ['react-dom/server']
    },
    ssr: {
      noExternal: ['react-dom/server']
    },
    // Define public environment variables for Sentry
    define: {
      'import.meta.env.PUBLIC_SENTRY_DSN': JSON.stringify("https://46121e36fe4737ca78f0cfdd9764ca43@o4509319023558656.ingest.us.sentry.io/4509319029784576"),
      'import.meta.env.PUBLIC_SENTRY_ENVIRONMENT': JSON.stringify(
        process.env.PUBLIC_SENTRY_ENVIRONMENT || 
        (isDev ? 'development' : 'production')
      ),
    }
  }
});