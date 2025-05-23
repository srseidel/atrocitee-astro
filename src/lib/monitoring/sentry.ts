// Sentry configuration and utility functions
import * as Sentry from '@sentry/astro';
import { Scope } from '@sentry/browser';

// Initialize Sentry - this will be called by the Sentry integration in astro.config.mjs
export function initSentry() {
  const dsn = import.meta.env.PUBLIC_SENTRY_DSN;
  const environment = import.meta.env.PUBLIC_SENTRY_ENVIRONMENT || 'development';
  
  Sentry.init({
    dsn: dsn,
    environment: environment,
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // In production, you'll want to adjust this to a lower value
    tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
    // Session replay is available in @sentry/browser but we're skipping it for now
    // as it's not part of the basic MVP requirements
  });
}

// Custom error tracking for specific scenarios
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { 
    contexts: { 
      custom: context 
    } 
  });
}

// Set user information when a user logs in
export function setUserContext(userId: string, email?: string, role?: string) {
  Sentry.setUser({
    id: userId,
    email: email,
    role: role
  });
}

// Clear user information on logout
export function clearUserContext() {
  Sentry.setUser(null);
}

// Add breadcrumb for important user actions (navigation, feature usage, etc.)
export function addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
  });
}

// Basic performance monitoring can be implemented in the future
// For the MVP, we'll focus on error tracking
export function trackPerformance(name: string, operation: () => Promise<any>) {
  // Simple timing implementation without Sentry transaction API
  console.time(name);
  
  return operation()
    .then(result => {
      console.timeEnd(name);
      return result;
    })
    .catch(error => {
      console.timeEnd(name);
      Sentry.captureException(error, { 
        contexts: { 
          operation: { name }
        } 
      });
      throw error;
    });
} 