// astro.config.mjs - Dynamic config loader
// This file dynamically imports the appropriate config based on the environment

import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import node from '@astrojs/node';
import cloudflare from '@astrojs/cloudflare';
import sentry from '@sentry/astro';

// Get environment
const isDev = !process.env.PROD && process.env.NODE_ENV !== 'production';

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
  adapter: isDev ? node({
    mode: 'standalone',
  }) : cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  vite: {
    resolve: { alias: {} },
    optimizeDeps: {
      exclude: ['node:fs', 'node:path', 'fs', 'path', 'node:child_process', 'child_process', 'escape-html', 'send'],
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    },
    ssr: {
      external: [
        'node:fs', 'node:path', 'node:child_process', 'fs', 'path', 'child_process',
        'url', 'worker_threads', 'diagnostics_channel', 'events', 'async_hooks',
        'escape-html', 'send', '@astrojs/node', 'ws', 'websocket',
        // Externalize modules that access browser APIs
        '@nanostores/persistent', '@nanostores/react',
        // Externalize Supabase realtime that uses WebSockets
        '@supabase/realtime-js', '@supabase/gotrue-js'
      ],
      noExternal: ['@lib/*'],
    },
    build: {
      commonjsOptions: { transformMixedEsModules: true },
      rollupOptions: {
        external: ['escape-html', 'send', '@supabase/realtime-js', '@supabase/gotrue-js'],
        plugins: [
          {
            name: 'fix-escape-conflict',
            generateBundle(options, bundle) {
              // Find and fix escape variable conflicts in generated bundles
              Object.keys(bundle).forEach(fileName => {
                if (bundle[fileName].type === 'chunk') {
                  let code = bundle[fileName].code;
                  // Replace problematic escape import aliasing
                  code = code.replace(/(\w+) as escape/g, '$1 as escapeUtil');
                  code = code.replace(/import\s*\{([^}]*)\s+f\s+as\s+escape([^}]*)\}/g, 'import {$1 f as escapeUtil$2}');
                  bundle[fileName].code = code;
                }
              });
            }
          },
          {
            name: 'ssr-browser-polyfills',
            generateBundle(options, bundle) {
              Object.keys(bundle).forEach(fileName => {
                if (bundle[fileName].type === 'chunk' && fileName.includes('_worker.js')) {
                  // Add browser polyfills only to worker chunks that run during SSR
                  const polyfills = `
// Browser API polyfills for SSR
if (typeof globalThis !== 'undefined' && typeof globalThis.window === 'undefined') {
  globalThis.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { href: '', origin: '', pathname: '/' },
    navigator: { userAgent: 'SSR' },
    document: { addEventListener: () => {}, removeEventListener: () => {} }
  };
  globalThis.document = globalThis.window.document;
  globalThis.navigator = globalThis.window.navigator;
  globalThis.location = globalThis.window.location;
}
`;
                  bundle[fileName].code = polyfills + bundle[fileName].code;
                }
              });
            }
          }
        ],
        output: {
          chunkFileNames: 'chunks/[name]-[hash].js',
          manualChunks(id) {
            if (id.includes('node_modules/astro/dist/core/middleware')) return 'astro-middleware';
            if (id.includes('node:') || id.includes('node_modules/node-')) return 'node-modules';
            if (id.includes('astro_type_script_index')) return 'astro-scripts';
            if (id.includes('escape-html') || id.includes('send')) return 'problematic-deps';
          }
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
    // Temporarily disable CSP to allow Stripe.js
    server: {
      headers: isDev ? {} : {},
    },
  },
});