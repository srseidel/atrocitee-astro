/**
 * Debug Utility - Ultra-Simple Build-Safe Version
 * 
 * Simplified debug utility that avoids all import.meta.env references
 * during build to prevent initialization conflicts
 */

// Simple environment detection without import.meta.env
const isDev = () => {
  // Use process.env if available (server), otherwise assume browser dev mode
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV !== 'production';
  }
  // Browser fallback - dev mode if console is available (avoid window check for SSR)
  return typeof console !== 'undefined';
};

/**
 * Sanitize sensitive data from any input for safe logging
 */
const sanitizeData = (data: any): any => {
  if (typeof data === 'string') {
    // Remove potential sensitive patterns
    return data
      .replace(/password[^&\s]*[=:][^&\s]*/gi, 'password=***')
      .replace(/token[^&\s]*[=:][^&\s]*/gi, 'token=***')
      .replace(/key[^&\s]*[=:][^&\s]*/gi, 'key=***')
      .replace(/secret[^&\s]*[=:][^&\s]*/gi, 'secret=***');
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    Object.keys(data).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('password') ||
          lowerKey.includes('token') ||
          lowerKey.includes('key') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('auth') ||
          lowerKey.includes('credential')) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = sanitizeData(data[key]);
      }
    });
    return sanitized;
  }
  
  return data;
};

/**
 * Sanitize sensitive data specifically for production logging
 */
const sanitizeForProduction = (data: any): any => {
  return sanitizeData(data);
};

/**
 * Debug utility with environment-aware logging
 */
export const debug = {
  /**
   * Debug level logging - only in debug mode
   */
  log: (...args: any[]) => {
    if (isDev()) {
      const sanitizedArgs = args.map(arg => sanitizeData(arg));
      console.log('[DEBUG]', ...sanitizedArgs);
    }
  },

  /**
   * Info level logging - only in debug mode  
   */
  info: (...args: any[]) => {
    if (isDev()) {
      const sanitizedArgs = args.map(arg => sanitizeData(arg));
      console.info('[INFO]', ...sanitizedArgs);
    }
  },

  /**
   * Warning level logging - only in debug mode
   */
  warn: (...args: any[]) => {
    if (isDev()) {
      const sanitizedArgs = args.map(arg => sanitizeData(arg));
      console.warn('[WARN]', ...sanitizedArgs);
    }
  },

  /**
   * Error level logging - only in debug mode
   * For production errors, use criticalError instead
   */
  error: (...args: any[]) => {
    if (isDev()) {
      const sanitizedArgs = args.map(arg => sanitizeData(arg));
      console.error('[ERROR]', ...sanitizedArgs);
    }
  },

  /**
   * Critical errors that should always be tracked
   * In debug mode: logs to console with full details
   * In production: sends to Sentry with sanitized data
   */
  criticalError: (message: string, error?: any, context?: Record<string, any>) => {
    // Always sanitize context data before any logging
    const sanitizedContext = context ? sanitizeData(context) : context;
    
    if (isDev()) {
      // Development: Console logging with sanitized context only
      console.error('[CRITICAL]', message, error, sanitizedContext);
    } else {
      // Production: Send to Sentry with sanitized data
      try {
        const sanitizedError = error ? sanitizeForProduction(error) : undefined;
        
        // Dynamic import of Sentry to avoid build-time issues
        if (typeof window !== 'undefined' || (typeof process !== 'undefined' && process.env.NODE_ENV === 'production')) {
          import('@sentry/astro').then(({ withScope, captureException, captureMessage }) => {
            withScope((scope) => {
              if (sanitizedContext) {
                Object.keys(sanitizedContext).forEach(key => {
                  scope.setTag(key, sanitizedContext[key]);
                });
              }
              
              if (sanitizedError instanceof Error) {
                captureException(sanitizedError);
              } else {
                captureMessage(message, 'error');
              }
            });
          }).catch(() => {
            // Fallback if Sentry import fails
            console.error('[ERROR]', message);
          });
        }
        
        // Also log a clean message to console for server logs
        console.error('[ERROR]', message);
      } catch (sentryError) {
        // Fallback if Sentry fails
        console.error('[ERROR]', message);
        console.error('[SENTRY_ERROR]', sentryError);
      }
    }
  },

  /**
   * User-facing errors that should be captured but not expose sensitive data
   */
  userError: (userMessage: string, technicalError?: any, context?: Record<string, any>) => {
    if (isDev()) {
      const sanitizedContext = context ? sanitizeData(context) : context;
      console.error('[USER_ERROR]', userMessage, technicalError, sanitizedContext);
    } else {
      // Send technical details to Sentry but show clean message to user
      debug.criticalError(`User Error: ${userMessage}`, technicalError, context);
      console.error('[USER_ERROR]', userMessage); // Clean message only
    }
  },

  /**
   * Performance logging for optimization
   */
  performance: (label: string, timeMs?: number, data?: any) => {
    if (isDev()) {
      const sanitizedData = data ? sanitizeData(data) : data;
      if (timeMs !== undefined) {
        console.log(`[PERF] ${label}: ${timeMs}ms`, sanitizedData);
      } else {
        console.log(`[PERF] ${label}`, sanitizedData);
      }
    }
  },

  /**
   * API request/response logging
   */
  api: (method: string, url: string, status?: number, data?: any) => {
    if (isDev()) {
      const sanitizedData = data ? sanitizeData(data) : data;
      console.log(`[API] ${method} ${url}`, status ? `(${status})` : '', sanitizedData);
    }
  },

  /**
   * Database operation logging
   */
  db: (operation: string, table?: string, data?: any) => {
    if (isDev()) {
      const sanitizedData = data ? sanitizeData(data) : data;
      console.log(`[DB] ${operation}`, table, sanitizedData);
    }
  },

  /**
   * Authentication/authorization logging
   */
  auth: (action: string, user?: string, data?: any) => {
    if (isDev()) {
      const sanitizedData = data ? sanitizeData(data) : data;
      console.log(`[AUTH] ${action}`, user, sanitizedData);
    }
  }
};

/**
 * Performance timing utility
 */
export const perfTimer = (label: string) => {
  const start = performance.now();
  
  return {
    end: (data?: any) => {
      const duration = performance.now() - start;
      debug.performance(label, duration, data);
      return duration;
    }
  };
};

/**
 * Debug mode status (lazy-evaluated to avoid initialization conflicts)
 */
export const debugStatus = {
  get isEnabled() {
    return isDev();
  },
  get isProduction() {
    return !isDev();
  },
  get mode() {
    return isDev() ? 'debug' : 'production';
  }
};