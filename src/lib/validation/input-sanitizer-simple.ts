/**
 * Simplified Input Sanitization for Build Compatibility
 */

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue?: string;
  errors: string[];
  warnings: string[];
  blocked: boolean;
  securityRisk: boolean;
}

// Simple sanitization function
export function sanitizeInput(
  input: string, 
  fieldType: string,
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

  if (!input || typeof input !== 'string') {
    if (options.required && !options.allowEmpty) {
      result.isValid = false;
      result.errors.push('This field is required');
    }
    result.sanitizedValue = '';
    return result;
  }

  let sanitized = input.trim();
  
  // Basic length check
  const maxLength = options.maxLength || 1000;
  if (sanitized.length > maxLength) {
    result.isValid = false;
    result.errors.push(`Input is too long (maximum ${maxLength} characters)`);
    sanitized = sanitized.substring(0, maxLength);
  }

  result.sanitizedValue = sanitized;
  return result;
}

export function validateFormData(
  data: Record<string, string>,
  fieldTypes: Record<string, string>,
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

  for (const [fieldName, value] of Object.entries(data)) {
    const fieldOptions = options[fieldName] || {};
    const result = sanitizeInput(value, fieldTypes[fieldName] || 'text', fieldOptions);

    sanitizedData[fieldName] = result.sanitizedValue || '';

    if (!result.isValid) {
      isValid = false;
      errors[fieldName] = result.errors;
    }

    if (result.warnings.length > 0) {
      warnings[fieldName] = result.warnings;
    }
  }

  return {
    isValid,
    sanitizedData,
    errors,
    warnings,
    hasSecurityRisks: false
  };
}

export function containsSuspiciousContent(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  // Basic suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /\bselect\b.*\bfrom\b/i,
    /\bunion\b.*\bselect\b/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
}

export function deepSanitize(obj: any): any {
  if (typeof obj === 'string') {
    return obj.trim();
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