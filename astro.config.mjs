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
    // Temporarily disable Sentry to debug escape error
    // sentry({
    //   dsn: process.env.SENTRY_DSN,
    //   environment: process.env.NODE_ENV,
    //   release: process.env.SENTRY_RELEASE,
    //   enabled: !isDev, // Only enable Sentry in production
    //   tracesSampleRate: 1.0,
    // }),
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
        'escape-html', 'send', '@astrojs/node', 'ws', 'websocket'
      ],
      noExternal: ['@lib/*'],
    },
    build: {
      commonjsOptions: { transformMixedEsModules: true },
      rollupOptions: {
        external: ['escape-html', 'send'],
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
            name: 'browser-polyfills',
            generateBundle(options, bundle) {
              // Add comprehensive browser API polyfills to all chunks during build
              Object.keys(bundle).forEach(fileName => {
                if (bundle[fileName].type === 'chunk') {
                  const polyfills = `
// Browser API polyfills for SSR/prerendering
(function() {
  if (typeof globalThis !== 'undefined') {
    // Define window if not present
    if (typeof globalThis.window === 'undefined') {
      globalThis.window = {
        ...globalThis,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
        location: { href: '', origin: '', pathname: '/' },
        navigator: { userAgent: 'Node.js' },
        localStorage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {}
        },
        sessionStorage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {}
        }
      };
    }
    if (typeof globalThis.self === 'undefined') {
      globalThis.self = globalThis;
    }
    if (typeof globalThis.document === 'undefined') {
      globalThis.document = {
        createElement: () => ({}),
        addEventListener: () => {},
        removeEventListener: () => {},
        querySelector: () => null,
        querySelectorAll: () => []
      };
    }
    // Mock WebSocket if not present
    if (typeof globalThis.WebSocket === 'undefined') {
      globalThis.WebSocket = class MockWebSocket {
        constructor() { this.readyState = 3; }
        addEventListener() {}
        removeEventListener() {}
        send() {}
        close() {}
      };
    }
    // Mock EventSource if not present
    if (typeof globalThis.EventSource === 'undefined') {
      globalThis.EventSource = class MockEventSource {
        constructor() { this.readyState = 2; }
        addEventListener() {}
        removeEventListener() {}
        close() {}
      };
    }
    // Mock other common browser APIs
    if (typeof globalThis.localStorage === 'undefined') {
      globalThis.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
      };
    }
    if (typeof globalThis.sessionStorage === 'undefined') {
      globalThis.sessionStorage = globalThis.localStorage;
    }
    if (typeof globalThis.navigator === 'undefined') {
      globalThis.navigator = { userAgent: 'Node.js' };
    }
    if (typeof globalThis.location === 'undefined') {
      globalThis.location = { href: '', origin: '', pathname: '/' };
    }
  }
})();
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