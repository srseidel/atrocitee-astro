/**
 * Debug Utility - Simple Console-Only Version
 * 
 * Provides environment-aware logging without external dependencies
 * to prevent build conflicts on Cloudflare
 */

// Simple environment detection
const isDev = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV !== 'production';
  }
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
   */
  error: (...args: any[]) => {
    if (isDev()) {
      const sanitizedArgs = args.map(arg => sanitizeData(arg));
      console.error('[ERROR]', ...sanitizedArgs);
    }
  },

  /**
   * Critical errors that should always be logged
   */
  criticalError: (message: string, error?: any, context?: Record<string, any>) => {
    const sanitizedContext = context ? sanitizeData(context) : context;
    console.error('[CRITICAL]', message, error, sanitizedContext);
  },

  /**
   * User-facing errors
   */
  userError: (userMessage: string, technicalError?: any, context?: Record<string, any>) => {
    const sanitizedContext = context ? sanitizeData(context) : context;
    console.error('[USER_ERROR]', userMessage, technicalError, sanitizedContext);
  },

  /**
   * Performance logging
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
 * Debug mode status
 */
export const debugStatus = {
  isEnabled: isDev(),
  mode: isDev() ? 'debug' : 'production'
};