// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

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
    })
  ],
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
    }
  }
});