/**
 * Phone Input Component with Validation and Formatting
 * 
 * Provides phone number input with:
 * - Real-time formatting as user types
 * - International phone number validation
 * - Error display and suggestions
 * - Auto-formatting to standard formats
 */

import React, { useState, useEffect } from 'react';
import { parsePhoneNumber, isValidPhoneNumber, AsYouType } from 'libphonenumber-js';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  className?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  country?: string; // Default country code (e.g., 'US')
  showValidation?: boolean;
}

interface ValidationResult {
  valid: boolean;
  formatted?: string;
  error?: string;
  suggestion?: string;
  type?: string; // 'mobile', 'fixed-line', etc.
}

export default function PhoneInput({ 
  value, 
  onChange, 
  onValidationChange,
  className = '',
  placeholder = '(555) 123-4567',
  label = 'Phone Number',
  required = false,
  country = 'US',
  showValidation = true 
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [validation, setValidation] = useState<ValidationResult>({ valid: true });
  const [isFocused, setIsFocused] = useState(false);

  // Validate and format phone number
  const validatePhone = (phoneValue: string): ValidationResult => {
    if (!phoneValue.trim()) {
      return { valid: !required };
    }

    try {
      // Try to parse the phone number
      const parsed = parsePhoneNumber(phoneValue, country as any);
      
      if (!parsed) {
        return {
          valid: false,
          error: 'Invalid phone number format',
          suggestion: `Please enter a valid ${country === 'US' ? 'US' : 'international'} phone number`
        };
      }

      // Check if the number is valid
      if (!parsed.isValid()) {
        return {
          valid: false,
          error: 'Invalid phone number',
          suggestion: 'Please check the number and try again'
        };
      }

      return {
        valid: true,
        formatted: parsed.formatNational(),
        type: parsed.getType()
      };
    } catch (error) {
      // Try basic validation if parsing fails
      const isValid = isValidPhoneNumber(phoneValue, country as any);
      
      if (isValid) {
        try {
          const parsed = parsePhoneNumber(phoneValue, country as any);
          const formatted = parsed ? parsed.formatNational() : phoneValue;
          return {
            valid: true,
            formatted
          };
        } catch {
          return { valid: true };
        }
      }

      return {
        valid: false,
        error: 'Invalid phone number format',
        suggestion: 'Please enter a valid phone number with area code'
      };
    }
  };

  // Format as user types
  const formatAsUserTypes = (input: string): string => {
    try {
      // Clean input to only digits and +
      const cleaned = input.replace(/[^\d+]/g, '');
      const formatter = new AsYouType(country as any);
      return formatter.input(cleaned);
    } catch {
      return input;
    }
  };

  // Update validation when value changes
  useEffect(() => {
    const result = validatePhone(value);
    setValidation(result);
    onValidationChange?.(result.valid);
  }, [value, country, required]);

  // Sync display value with prop value
  useEffect(() => {
    if (!isFocused) {
      // When not focused, show the clean value or formatted version
      setDisplayValue(validation.formatted || value);
    }
  }, [value, validation.formatted, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Format as user types
    const formatted = formatAsUserTypes(input);
    setDisplayValue(formatted);
    
    // Store the formatted value
    onChange(formatted);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Format the final value when user leaves the field
    if (validation.valid && validation.formatted) {
      setDisplayValue(validation.formatted);
      onChange(validation.formatted);
    }
  };

  const inputClasses = `
    w-full px-3 py-2 border rounded-lg 
    focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${validation.valid ? 'border-gray-300' : 'border-red-500'}
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
        type="tel"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={inputClasses}
      />

      {/* Validation Display */}
      {showValidation && (
        <div className="space-y-2">
          {/* Success */}
          {validation.valid && value && !validation.error && (
            <div className="flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>
                Valid phone number
                {validation.type && (
                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    {validation.type.replace('-', ' ')}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Error */}
          {!validation.valid && validation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">{validation.error}</p>
                  {validation.suggestion && (
                    <p className="text-sm text-red-700 mt-1">{validation.suggestion}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Formatting Info */}
          {validation.valid && validation.formatted && validation.formatted !== displayValue && !isFocused && (
            <div className="text-xs text-gray-500">
              Formatted as: {validation.formatted}
            </div>
          )}
        </div>
      )}
    </div>
  );
}