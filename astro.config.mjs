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
  site: 'https://atrocitee.com',
  integrations: [
    tailwind(),
    react({
      include: ['**/react/*', '**/components/**/*.tsx', '**/features/**/*.tsx'],
    }),
    sentry({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.SENTRY_RELEASE,
      enabled: process.env.NODE_ENV === 'production',
      tracesSampleRate: 1.0,
    }),
  ],
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile'
  }),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },
  vite: {
    // Always use resolve.alias for consistent behavior
    resolve: {
      alias: {
        // No custom React DOM aliases needed
      },
    },
    // Disable pre-transform of CommonJS modules to ESM
    optimizeDeps: {
      exclude: ['node:fs', 'node:path', 'fs', 'path', 'node:child_process', 'child_process'],
    },
    ssr: {
      // External dependencies that shouldn't be bundled
      external: [
        'node:fs',
        'node:path',
        'node:child_process',
        'fs',
        'path',
        'child_process',
        'url',
        'worker_threads',
        'diagnostics_channel',
        'events',
        'async_hooks',
      ],
      // Let Astro handle React DOM
      noExternal: [],
    },
    // Fix circular dependencies in chunks and empty chunks
    build: {
      // Prevent empty chunks
      rollupOptions: {
        output: {
          // Combine small chunks
          chunkFileNames: 'chunks/[name]-[hash].js',
          // Avoid empty chunks
          manualChunks(id) {
            // Group all Astro middleware modules into a single chunk
            if (id.includes('node_modules/astro/dist/core/middleware')) {
              return 'astro-middleware';
            }
            // Group all node built-in modules
            if (id.includes('node:') || id.includes('node_modules/node-')) {
              return 'node-modules';
            }
            // Group all astro script chunks together
            if (id.includes('astro_type_script_index')) {
              return 'astro-scripts';
            }
            // Keep default chunking for everything else
            return undefined;
          }
        },
        // Suppress empty chunk warnings
        onwarn(warning, warn) {
          if (warning.code === 'EMPTY_BUNDLE' || 
              (warning.code === 'CIRCULAR_DEPENDENCY' && warning.ids && warning.ids.some(id => id.includes('middleware')))) {
            return;
          }
          warn(warning);
        }
      }
    }
  },
});