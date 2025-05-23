// Environment configuration
export const env = {
  // Supabase
  supabase: {
    url: import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co',
    anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
  },
  
  // Printful
  printful: {
    apiKey: import.meta.env.PRINTFUL_API_KEY,
    storeId: import.meta.env.PRINTFUL_STORE_ID,
  },
  
  // Sentry
  sentry: {
    dsn: import.meta.env.PUBLIC_SENTRY_DSN,
    environment: import.meta.env.NODE_ENV || 'development',
  },
  
  // App
  app: {
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    isSSR: import.meta.env.SSR,
    isBuild: process.env.NODE_ENV === 'production' && import.meta.env.SSR && !import.meta.env.DEV,
  },
} as const;

// Type-safe environment variable access
export type Env = typeof env;

// Helper to check if we're in a build context
export const isBuildContext = env.app.isBuild;

// Helper to check if we're in a development context
export const isDevContext = env.app.isDev;

// Helper to check if we're in a production context
export const isProdContext = env.app.isProd; 