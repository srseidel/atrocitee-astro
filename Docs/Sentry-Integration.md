# Sentry.io Integration for Atrocitee

This document outlines the implementation of Sentry.io error monitoring in the Atrocitee platform.

## Overview

Sentry.io is used to track and monitor errors in both client-side and server-side code. The integration follows Sentry's recommended pattern for Astro projects, with separate configurations for client and server environments.

## Configuration Files

### 1. Client-Side Configuration (sentry.client.config.js)

```javascript
import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://46121e36fe4737ca78f0cfdd9764ca43@o4509319023558656.ingest.us.sentry.io/4509319029784576",
  
  // Adds request headers and IP for users
  sendDefaultPii: true,
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  
  // Sample rates control how much data is collected
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  
  // Environment identification for proper error segmentation
  environment: import.meta.env.PUBLIC_SENTRY_ENVIRONMENT || 
    (import.meta.env.DEV ? 'development' : 'production')
});
```

This configuration:
- Captures client-side JavaScript errors
- Collects PII data including request headers and user IP
- Includes browser tracing and session replay integrations (currently disabled with 0 sample rates)
- Sets environment based on Astro's environment variables

### 2. Server-Side Configuration (sentry.server.config.js)

```javascript
import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://46121e36fe4737ca78f0cfdd9764ca43@o4509319023558656.ingest.us.sentry.io/4509319029784576",
  
  // Adds request headers and IP for users
  sendDefaultPii: true,
  
  // Cloudflare environment integration settings
  integrations: [],
  
  // Performance monitoring sample rate
  tracesSampleRate: 0,
  
  // Environment identification for proper error segmentation
  environment: process.env.PUBLIC_SENTRY_ENVIRONMENT || 
    (process.env.NODE_ENV === 'development' ? 'development' : 'production'),
    
  // Source maps configuration for better error reporting
  sourceMapsUploadOptions: {
    project: "javascript-astro",
    authToken: process.env.SENTRY_AUTH_TOKEN,
  }
});
```

This configuration:
- Captures server-side errors
- Collects PII data including request headers and user IP
- Configures source maps upload for improved stack traces
- Sets environment based on Node environment variables

### 3. Astro Configuration (astro.config.mjs)

The Sentry integration is added to Astro's configuration:

```javascript
import sentry from '@sentry/astro';

// In integrations array:
!isDev || process.env.ENABLE_SENTRY_IN_DEV ? sentry() : null,
```

This configuration:
- Adds the Sentry Astro integration
- Only enables Sentry in production or when explicitly enabled in development

## Environment Variables and Secrets

The following environment variables are used:

| Variable | Purpose | Configuration Location |
|----------|---------|------------------------|
| PUBLIC_SENTRY_DSN | Sentry project identifier | Client/server config files |
| PUBLIC_SENTRY_ENVIRONMENT | Environment name | Client/server config files |
| SENTRY_AUTH_TOKEN | Authentication for source maps upload | Server config, Cloudflare secrets |

**Important**: The `SENTRY_AUTH_TOKEN` has been added to Cloudflare environment as a secret to enable secure source maps upload in production.

## Error Boundary Integration

React components are wrapped with an ErrorBoundary component that reports uncaught errors to Sentry:

```jsx
import * as Sentry from '@sentry/astro';

// In the ErrorBoundary componentDidCatch method:
Sentry.captureException(error, {
  contexts: {
    react: {
      componentStack: errorInfo.componentStack
    }
  }
});
```

## Testing Error Reporting

A test page has been created at `/test-sentry` to verify error capturing:

1. Navigate to `/test-sentry` in the application
2. Click the "Throw test error" button
3. Check the Sentry dashboard to verify the error was captured

## Utilities

Additional Sentry utility functions have been created in `src/utils/sentry.ts`:

- `captureError`: For custom error tracking with additional context
- `setUserContext`: To associate errors with specific users
- `clearUserContext`: To clear user association on logout
- `addBreadcrumb`: To track user actions for better error context
- `trackPerformance`: Simple performance monitoring

## Future Enhancements

- Set up error notification rules in Sentry dashboard
- Create detailed error reporting documentation
- Implement custom fingerprinting for better error grouping
- Configure alerting thresholds and notification channels 