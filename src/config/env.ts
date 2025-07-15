// Environment variable configuration
// This file provides type-safe access to environment variables

// Default values for development
const ENV = {
  // Supabase Configuration
  PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL as string,
  PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string,
  
  // General Application Config
  PUBLIC_SITE_URL: import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  
  // Sentry.io
  PUBLIC_SENTRY_DSN: import.meta.env.PUBLIC_SENTRY_DSN as string,
  
  // Stripe Configuration
  PUBLIC_STRIPE_PUBLISHABLE_KEY: import.meta.env.STRIPE_PUBLIC_KEY as string,
  STRIPE_SECRET_KEY: import.meta.env.STRIPE_SECRET_KEY as string,
  
  // Printful API Integration
  PRINTFUL_API_KEY: import.meta.env.PRINTFUL_API_KEY as string,
  PUBLIC_PRINTFUL_WEBHOOK_SECRET: import.meta.env.PUBLIC_PRINTFUL_WEBHOOK_SECRET as string,
  
  // Cron and Scheduling
  CRON_SECRET: import.meta.env.CRON_SECRET as string,
};

// Validate required public environment variables
function validateEnv() {
  const requiredEnvVars = [
    'PUBLIC_SUPABASE_URL',
    'PUBLIC_SUPABASE_ANON_KEY',
    'PRINTFUL_API_KEY',
  ];
  
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !ENV[envVar as keyof typeof ENV]
  );
  
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }
}

// Only validate in production to allow easier local development
if (ENV.NODE_ENV === 'production') {
  validateEnv();
}

export default ENV; 