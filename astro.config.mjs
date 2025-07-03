// astro.config.mjs - Dynamic config loader
// This file dynamically imports the appropriate config based on the environment

import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import node from '@astrojs/node';
import sentry from '@sentry/astro';

// Get environment
const isDev = process.env.NODE_ENV !== 'production';

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
      enabled: !isDev, // Only enable Sentry in production
      tracesSampleRate: 1.0,
    }),
  ],
  output: 'server', // Always use server output to support both static and SSR pages
  adapter: node({
    mode: 'standalone',
  }),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  vite: {
    resolve: { alias: {} },
    optimizeDeps: {
      exclude: ['node:fs', 'node:path', 'fs', 'path', 'node:child_process', 'child_process'],
    },
    ssr: {
      external: [
        'node:fs', 'node:path', 'node:child_process', 'fs', 'path', 'child_process',
        'url', 'worker_threads', 'diagnostics_channel', 'events', 'async_hooks',
      ],
      noExternal: [],
    },
    build: {
      commonjsOptions: { transformMixedEsModules: true },
      rollupOptions: {
        output: {
          chunkFileNames: 'chunks/[name]-[hash].js',
          manualChunks(id) {
            if (id.includes('node_modules/astro/dist/core/middleware')) return 'astro-middleware';
            if (id.includes('node:') || id.includes('node_modules/node-')) return 'node-modules';
            if (id.includes('astro_type_script_index')) return 'astro-scripts';
          },
        },
        onwarn(warning, warn) {
          if (
            warning.code === 'EMPTY_BUNDLE' ||
            (warning.code === 'CIRCULAR_DEPENDENCY' &&
              warning.ids?.some(id => id.includes('middleware')))
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
    },
    // Disable CSP in development
    server: {
      headers: isDev ? {
        'Content-Security-Policy': "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
      } : {},
    },
  },
});