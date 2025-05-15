/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly PUBLIC_SITE_URL: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly PUBLIC_SENTRY_DSN: string;
  readonly PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  
  // Printful API Configuration
  readonly PRINTFUL_API_KEY: string;
  readonly PUBLIC_PRINTFUL_WEBHOOK_SECRET: string;
  
  // Cron and scheduling
  readonly CRON_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 