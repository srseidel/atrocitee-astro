// Environment configuration - lazy-evaluated to avoid build initialization conflicts
export const env = {
  // Supabase
  supabase: {
    get url() {
      try {
        return import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
      } catch {
        return 'https://placeholder-url.supabase.co';
      }
    },
    get anonKey() {
      try {
        return import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
      } catch {
        return 'placeholder-key';
      }
    }
  },
  
  // Printful
  printful: {
    get apiKey() {
      try {
        return import.meta.env.PRINTFUL_API_KEY;
      } catch {
        return undefined;
      }
    },
    get storeId() {
      try {
        return import.meta.env.PRINTFUL_STORE_ID;
      } catch {
        return undefined;
      }
    }
  },
  
  // Sentry
  sentry: {
    get dsn() {
      try {
        return import.meta.env.PUBLIC_SENTRY_DSN;
      } catch {
        return undefined;
      }
    },
    get environment() {
      try {
        return import.meta.env.PROD ? 'production' : 'development';
      } catch {
        return 'production';
      }
    }
  },
  
  // App
  app: {
    get isDev() {
      try {
        return import.meta.env.DEV;
      } catch {
        return false;
      }
    },
    get isProd() {
      try {
        return import.meta.env.PROD;
      } catch {
        return true;
      }
    },
    get isSSR() {
      try {
        return import.meta.env.SSR;
      } catch {
        return true;
      }
    },
    get isBuild() {
      try {
        return import.meta.env.PROD && import.meta.env.SSR && !import.meta.env.DEV;
      } catch {
        return true;
      }
    }
  }
};

// Type-safe environment variable access
export type Env = typeof env;

// Helper to check if we're in a build context
export const isBuildContext = () => env.app.isBuild;

// Helper to check if we're in a development context
export const isDevContext = () => env.app.isDev;

// Helper to check if we're in a production context
export const isProdContext = () => env.app.isProd; 