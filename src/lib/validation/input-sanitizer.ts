/**
 * Input Sanitization and Security Validation Utilities
 * 
 * Provides comprehensive input validation to prevent:
 * - SQL injection attacks
 * - XSS (Cross-Site Scripting) attacks
 * - Command injection
 * - Path traversal attacks
 * - Other malicious input patterns
 */

// Dangerous patterns that should be blocked
const DANGEROUS_PATTERNS = [
  // SQL injection patterns
  /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b|\bTRUNCATE\b)/i,
  /(\bUNION\b|\bJOIN\b|\bWHERE\b|\bHAVING\b|\bGROUP BY\b|\bORDER BY\b)/i,
  /(\bEXEC\b|\bEXECUTE\b|\bSP_\b|\bXP_\b)/i,
  /(--|\/\*|\*\/|;|"|`)/,
  /'\s*(OR|AND|SELECT|INSERT|UPDATE|DELETE|DROP|UNION)/i, // Only flag apostrophes followed by SQL keywords
  /(\bOR\b|\bAND\b)\s*\d+\s*=\s*\d+/i,
  /\b(OR|AND)\s+\w+\s*=\s*\w+/i,
  
  // XSS patterns
  /<script[^>]*>.*?<\/script>/i,
  /<iframe[^>]*>.*?<\/iframe>/i,
  /<object[^>]*>.*?<\/object>/i,
  /<embed[^>]*>/i,
  /<link[^>]*>/i,
  /<meta[^>]*>/i,
  /javascript:/i,
  /vbscript:/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /onerror\s*=/i,
  /onmouseover\s*=/i,
  /onfocus\s*=/i,
  /onblur\s*=/i,
  
  // Command injection patterns
  /(\||&&|;|`|\$\(|\$\{)/,
  /\b(rm|del|format|fdisk|mkfs)\b/i,
  /\b(wget|curl|nc|netcat|telnet|ssh)\b/i,
  /\b(eval|exec|system|shell_exec|passthru)\b/i,
  
  // Path traversal patterns
  /\.\.\//,
  /\.\.\\/,
  /\.\./,
  /~[\/\\]/,
  /\/etc\/|\/var\/|\/tmp\/|\/bin\/|\/usr\//i,
  /[C-F]:[\\\/]/i,
  
  // Other suspicious patterns
  /\bNULL\b|\bnil\b|\bundefined\b/i,
  /%[0-9a-f]{2}/i, // URL encoded characters
  /\\x[0-9a-f]{2}/i, // Hex encoded characters
  /\\u[0-9a-f]{4}/i, // Unicode encoded characters
  /\x00|\x08|\x09|\x0A|\x0D|\x1A|\x22|\x27|\x5C/, // Control characters
];

// Field-specific validation patterns
const FIELD_PATTERNS = {
  name: {
    allowed: /^[a-zA-Z\s'\-\.À-ÿ]{1,100}$/,
    description: 'Names can only contain letters, spaces, apostrophes, hyphens, periods, and accented characters'
  },
  email: {
    allowed: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    description: 'Invalid email format'
  },
  phone: {
    allowed: /^[\+]?[1-9][\d\s\-\(\)\.]{7,15}$/,
    description: 'Phone numbers can only contain digits, spaces, hyphens, parentheses, periods, and plus sign'
  },
  address: {
    allowed: /^[a-zA-Z0-9\s,'\-\.#\/]{1,200}$/,
    description: 'Address can contain letters, numbers, spaces, and common punctuation'
  },
  city: {
    allowed: /^[a-zA-Z\s'\-\.]{1,100}$/,
    description: 'City names can only contain letters, spaces, apostrophes, hyphens, and periods'
  },
  state: {
    allowed: /^[A-Z]{2}$/,
    description: 'State must be a 2-letter code'
  },
  postalCode: {
    allowed: /^[a-zA-Z0-9\s\-]{3,12}$/,
    description: 'Postal codes can contain letters, numbers, spaces, and hyphens'
  },
  displayName: {
    allowed: /^[a-zA-Z0-9\s'\-\.\_]{1,50}$/,
    description: 'Display names can contain letters, numbers, spaces, and basic punctuation'
  }
};

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue?: string;
  errors: string[];
  warnings: string[];
  blocked: boolean;
  securityRisk: boolean;
}

/**
 * Sanitize and validate input string
 */
export function sanitizeInput(
  input: string, 
  fieldType: keyof typeof FIELD_PATTERNS,
  options: {
    maxLength?: number;
    required?: boolean;
    allowEmpty?: boolean;
  } = {}
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    blocked: false,
    securityRisk: false
  };

  // Handle null/undefined/empty
  if (!input || typeof input !== 'string') {
    if (options.required && !options.allowEmpty) {
      result.isValid = false;
      result.errors.push('This field is required');
    }
    result.sanitizedValue = '';
    return result;
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Check for dangerous patterns first
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      result.blocked = true;
      result.securityRisk = true;
      result.isValid = false;
      result.errors.push('Input contains potentially dangerous content and has been blocked');
      return result;
    }
  }

  // Length validation
  const maxLength = options.maxLength || 1000;
  if (sanitized.length > maxLength) {
    result.isValid = false;
    result.errors.push(`Input is too long (maximum ${maxLength} characters)`);
    sanitized = sanitized.substring(0, maxLength);
    result.warnings.push('Input was truncated to maximum length');
  }

  // Field-specific validation
  const fieldPattern = FIELD_PATTERNS[fieldType];
  if (fieldPattern && !fieldPattern.allowed.test(sanitized)) {
    result.isValid = false;
    result.errors.push(fieldPattern.description);
  }

  // Additional sanitization
  sanitized = sanitized
    // Remove null bytes and control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace again after normalization
    .trim();

  // Final security check after sanitization
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      result.blocked = true;
      result.securityRisk = true;
      result.isValid = false;
      result.errors.push('Input contains potentially dangerous content after sanitization');
      return result;
    }
  }

  result.sanitizedValue = sanitized;
  return result;
}

/**
 * Validate multiple form fields at once
 */
export function validateFormData(
  data: Record<string, string>,
  fieldTypes: Record<string, keyof typeof FIELD_PATTERNS>,
  options: Record<string, { maxLength?: number; required?: boolean; allowEmpty?: boolean }> = {}
): {
  isValid: boolean;
  sanitizedData: Record<string, string>;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  hasSecurityRisks: boolean;
} {
  const sanitizedData: Record<string, string> = {};
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};
  let isValid = true;
  let hasSecurityRisks = false;

  for (const [fieldName, value] of Object.entries(data)) {
    const fieldType = fieldTypes[fieldName];
    if (!fieldType) {
      // Skip unknown fields but log a warning
      console.warn(`Unknown field type for field: ${fieldName}`);
      sanitizedData[fieldName] = String(value || '').trim();
      continue;
    }

    const fieldOptions = options[fieldName] || {};
    const result = sanitizeInput(value, fieldType, fieldOptions);

    sanitizedData[fieldName] = result.sanitizedValue || '';

    if (!result.isValid) {
      isValid = false;
      errors[fieldName] = result.errors;
    }

    if (result.warnings.length > 0) {
      warnings[fieldName] = result.warnings;
    }

    if (result.securityRisk) {
      hasSecurityRisks = true;
    }
  }

  return {
    isValid,
    sanitizedData,
    errors,
    warnings,
    hasSecurityRisks
  };
}

/**
 * Check if a string contains any suspicious patterns
 */
export function containsSuspiciousContent(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe || typeof unsafe !== 'string') return '';
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Deep sanitize an object recursively
 */
export function deepSanitize(obj: any): any {
  if (typeof obj === 'string') {
    return escapeHtml(obj.trim());
  }
  
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      return obj.map(deepSanitize);
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = deepSanitize(value);
    }
    return sanitized;
  }
  
  return obj;
}