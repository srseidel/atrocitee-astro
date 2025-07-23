/**
 * Secure Input Component
 * 
 * Provides input validation with security checks and sanitization
 */

import React, { useState, useEffect } from 'react';
import { sanitizeInput, type ValidationResult } from '@lib/validation/input-sanitizer';

interface SecureInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  fieldType: 'name' | 'email' | 'phone' | 'address' | 'city' | 'state' | 'postalCode' | 'displayName';
  label?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  className?: string;
  showValidation?: boolean;
  type?: 'text' | 'email' | 'tel';
}

export default function SecureInput({
  value,
  onChange,
  onValidationChange,
  fieldType,
  label,
  placeholder,
  required = false,
  maxLength,
  className = '',
  showValidation = true,
  type = 'text'
}: SecureInputProps) {
  const [validation, setValidation] = useState<ValidationResult>({ 
    isValid: true, 
    errors: [], 
    warnings: [], 
    blocked: false, 
    securityRisk: false 
  });
  const [hasBlurred, setHasBlurred] = useState(false);

  // Validate input when value changes
  useEffect(() => {
    const result = sanitizeInput(value, fieldType, {
      required,
      maxLength,
      allowEmpty: !required
    });

    setValidation(result);
    onValidationChange?.(result.isValid && !result.securityRisk);
  }, [value, fieldType, required, maxLength]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Basic real-time sanitization - remove obvious dangerous characters
    const basicSanitized = inputValue
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/[<>'"]/g, ''); // Remove basic XSS characters
    
    onChange(basicSanitized);
  };

  const handleBlur = () => {
    setHasBlurred(true);
    
    // Apply full sanitization on blur
    if (validation.sanitizedValue && validation.sanitizedValue !== value) {
      onChange(validation.sanitizedValue);
    }
  };

  const inputClasses = `
    w-full px-3 py-2 border rounded-lg 
    focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${validation.securityRisk || validation.blocked ? 'border-red-600 bg-red-50' : 
      !validation.isValid ? 'border-red-500' : 'border-gray-300'}
    ${className}
  `.trim();

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input */}
      <input
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        className={inputClasses}
        disabled={validation.blocked}
      />

      {/* Character count */}
      {maxLength && value.length > maxLength * 0.8 && (
        <div className="text-xs text-gray-500 text-right">
          {value.length}/{maxLength} characters
        </div>
      )}

      {/* Validation Display */}
      {showValidation && hasBlurred && (
        <div className="space-y-2">
          {/* Security Risk Alert */}
          {validation.securityRisk && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Security Alert</p>
                  <p className="text-sm text-red-700 mt-1">
                    Input contains potentially dangerous content and has been blocked for your security.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validation.errors.length > 0 && !validation.securityRisk && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Input Error</p>
                  <ul className="mt-1 list-disc list-inside text-sm text-red-700">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Validation Warnings */}
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Notice</p>
                  <ul className="mt-1 list-disc list-inside text-sm text-yellow-700">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Success */}
          {validation.isValid && !validation.securityRisk && validation.errors.length === 0 && validation.warnings.length === 0 && value.trim() && (
            <div className="flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Input validated successfully
            </div>
          )}
        </div>
      )}
    </div>
  );
}