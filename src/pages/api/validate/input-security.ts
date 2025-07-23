/**
 * Server-side Input Security Validation API
 * 
 * Provides server-side validation for form inputs to prevent
 * injection attacks and ensure data integrity
 */

import type { APIRoute } from 'astro';
import { validateFormData, containsSuspiciousContent, deepSanitize } from '@lib/validation/input-sanitizer';

export const prerender = false;

interface ValidationRequest {
  data: Record<string, string>;
  fieldTypes: Record<string, string>;
  options?: Record<string, { maxLength?: number; required?: boolean; allowEmpty?: boolean }>;
}

interface ValidationResponse {
  isValid: boolean;
  sanitizedData: Record<string, string>;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  hasSecurityRisks: boolean;
  blocked: string[]; // Fields that were blocked for security reasons
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as ValidationRequest;
    
    if (!body.data || !body.fieldTypes) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: data and fieldTypes'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Deep sanitize the input data first
    const cleanData = deepSanitize(body.data);
    const blocked: string[] = [];

    // Check each field for suspicious content
    for (const [fieldName, value] of Object.entries(cleanData)) {
      if (typeof value === 'string' && containsSuspiciousContent(value)) {
        blocked.push(fieldName);
      }
    }

    // If any fields are blocked, return security error
    if (blocked.length > 0) {
      return new Response(JSON.stringify({
        isValid: false,
        sanitizedData: {},
        errors: {},
        warnings: {},
        hasSecurityRisks: true,
        blocked,
        message: `Security validation failed for fields: ${blocked.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Perform comprehensive validation
    const validation = validateFormData(
      cleanData,
      body.fieldTypes as any,
      body.options || {}
    );

    const response: ValidationResponse = {
      isValid: validation.isValid && !validation.hasSecurityRisks,
      sanitizedData: validation.sanitizedData,
      errors: validation.errors,
      warnings: validation.warnings,
      hasSecurityRisks: validation.hasSecurityRisks,
      blocked: []
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Input security validation error:', error);
    
    return new Response(JSON.stringify({
      error: 'Input validation service temporarily unavailable',
      isValid: false,
      hasSecurityRisks: true
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};