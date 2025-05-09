// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    tailwind(),
    react({
      include: ['**/react/*', '**/components/**/*.tsx', '**/components/**/*.jsx']
    })
  ],
  vite: {
    // CLOUDFLARE COMPATIBILITY FIX:
    // Use React DOM's edge-compatible server module to fix "MessageChannel is not defined" errors
    // in Cloudflare's edge environment. The default 'react-dom/server' uses Node.js APIs that aren't
    // available in Cloudflare Workers/Pages, but 'react-dom/server.edge' is specifically built for
    // edge runtimes and doesn't use MessageChannel.
    // See Docs/Cloudflare-React-MessageChannel-Fix.md for more details.
    resolve: {
      alias: {
        'react-dom/server': 'react-dom/server.edge'
      }
    },
    // These additional optimizations help with the build process
    optimizeDeps: {
      exclude: ['react-dom/server']
    },
    ssr: {
      noExternal: ['react-dom/server']
    }
  }
});