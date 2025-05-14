import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://46121e36fe4737ca78f0cfdd9764ca43@o4509319023558656.ingest.us.sentry.io/4509319029784576",
  
  // Adds request headers and IP for users
  sendDefaultPii: true,
  
  // Cloudflare environment doesn't support Node profiling integrations
  // so we're not adding them here
  integrations: [],
  
  // Set sample rate for performance monitoring
  // Using 0 as specified in your original config to disable this feature
  tracesSampleRate: 0,
  
  // Add environment identification
  environment: process.env.PUBLIC_SENTRY_ENVIRONMENT || 
    (process.env.NODE_ENV === 'development' ? 'development' : 'production'),
    
  // Include source maps configuration if needed
  sourceMapsUploadOptions: {
    project: "javascript-astro",
    authToken: process.env.SENTRY_AUTH_TOKEN,
  }
}); 