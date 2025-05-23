import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://7100a982ab62eb0613637edb1d26e93f@o4509319023558656.ingest.us.sentry.io/4509319237599232",
  
  // Adds request headers and IP for users
  sendDefaultPii: true,
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  
  // Set sample rates for performance monitoring and session replay
  // Using 0 as specified in your original config to disable these features
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  
  // Add environment identification
  environment: import.meta.env.PUBLIC_SENTRY_ENVIRONMENT || 
    (import.meta.env.DEV ? 'development' : 'production')
}); 