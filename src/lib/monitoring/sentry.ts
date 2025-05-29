// Sentry configuration and utility functions
import * as Sentry from '@sentry/astro';

import { env } from '../env';

// Initialize Sentry
export function initSentry(): void {
  if (env.sentry.dsn) {
    Sentry.init({
      dsn: env.sentry.dsn,
      debug: env.sentry.debug,
      environment: env.sentry.environment,
      beforeSend(event: Record<string, unknown>): Record<string, unknown> | null {
        // Don't send events in development
        if (env.sentry.environment === 'development') {
          return null;
        }
        return event;
      },
    });
  }
  // eslint-disable-next-line no-console
  console.log("Sentry initialized");
}

// Custom error tracking for specific scenarios
export function captureError(error: Error, context?: Record<string, unknown>): void {
  Sentry.captureException(error, { 
    contexts: { 
      custom: context 
    } 
  });
  // eslint-disable-next-line no-console
  console.log("Sentry error:", error);
}

// Set user information when a user logs in
export function setUserContext(userId: string, email?: string, role?: string): void {
  Sentry.setUser({
    id: userId,
    email: email,
    role: role
  });
}

// Clear user information on logout
export function clearUserContext(): void {
  Sentry.setUser(null);
}

// Add breadcrumb for important user actions (navigation, feature usage, etc.)
export function addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
  });
}

// Basic performance monitoring can be implemented in the future
// For the MVP, we'll focus on error tracking
export function trackPerformance<T>(name: string, operation: () => Promise<T>): Promise<T> {
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
      // eslint-disable-next-line no-console
      console.log("Sentry error:", error);
      throw error;
    });
} 