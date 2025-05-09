// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Enable server-side rendering with static pre-rendering for some pages
  adapter: cloudflare(),
  integrations: [
    tailwind(),
    react()
  ],
  vite: {
    resolve: {
      alias: {
        // Use the browser version of react-dom/server to avoid MessageChannel issues
        'react-dom/server': 'react-dom/server.browser'
      }
    }
  }
});