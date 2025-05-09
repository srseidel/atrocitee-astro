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
    // Use React DOM server.edge for Cloudflare compatibility
    resolve: {
      alias: {
        'react-dom/server': 'react-dom/server.edge'
      }
    },
    // Handle the MessageChannel issue
    optimizeDeps: {
      exclude: ['react-dom/server']
    },
    ssr: {
      noExternal: ['react-dom/server']
    }
  }
});