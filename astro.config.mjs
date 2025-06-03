// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import sentry from '@sentry/astro';
import { VitePWA } from 'vite-plugin-pwa';

// Determine if we're in development or production mode
const isDev = process.env.NODE_ENV === 'development';

// https://astro.build/config
export default defineConfig({
  // In development, use static output to avoid SSR issues
  // In production, use server output for dynamic features
  output: isDev ? 'static' : 'server',
  adapter: cloudflare({
    imageService: 'compile'
  }),
  
  // Configure which pages should be prerendered (static)
  prefetch: true,

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
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Atrocitee',
          short_name: 'Atrocitee',
          description: 'Atrocitee - Shop for a Cause',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    // CLOUDFLARE COMPATIBILITY FIX:
    // For Cloudflare deployment: Use React DOM's edge-compatible server module
    // to fix "MessageChannel is not defined" errors in Cloudflare's edge environment.
    //
    // See Docs/Cloudflare-React-MessageChannel-Fix.md for more details.
    ...(isDev ? {} : {
      resolve: {
        alias: {
          // Only apply this in production builds
          'react-dom/server': 'react-dom/server.edge',
          // Add new import aliases
          '@components': '/src/components',
          '@layouts': '/src/layouts',
          '@lib': '/src/lib',
          '@utils': '/src/utils',
          '@types': '/src/types',
          '@content': '/src/content',
          '@config': '/src/config'
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
      'import.meta.env.PUBLIC_SENTRY_DSN': JSON.stringify("https://7100a982ab62eb0613637edb1d26e93f@o4509319023558656.ingest.us.sentry.io/4509319237599232"),
      'import.meta.env.PUBLIC_SENTRY_ENVIRONMENT': JSON.stringify(
        process.env.PUBLIC_SENTRY_ENVIRONMENT || 
        (isDev ? 'development' : 'production')
      ),
    }
  }
});