/**
 * Secure Form Hook
 * 
 * Provides secure form handling with input sanitization and validation
 */

import { useState, useCallback } from 'react';
import { validateFormData, sanitizeInput, type ValidationResult } from '@lib/validation/input-sanitizer';

interface FieldConfig {
  type: 'name' | 'email' | 'phone' | 'address' | 'city' | 'state' | 'postalCode' | 'displayName';
  required?: boolean;
  maxLength?: number;
  allowEmpty?: boolean;
}

interface FormConfig {
  [fieldName: string]: FieldConfig;
}

interface UseSecureFormResult {
  values: Record<string, string>;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  isValid: boolean;
  hasSecurityRisks: boolean;
  setValue: (field: string, value: string) => void;
  validateField: (field: string) => ValidationResult;
  validateForm: () => boolean;
  resetForm: () => void;
  getSanitizedData: () => Record<string, string>;
}

export function useSecureForm(
  config: FormConfig,
  initialValues: Record<string, string> = {}
): UseSecureFormResult {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [warnings, setWarnings] = useState<Record<string, string[]>>({});
  const [isValid, setIsValid] = useState(true);
  const [hasSecurityRisks, setHasSecurityRisks] = useState(false);

  const setValue = useCallback((field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear existing errors for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    
    // Clear existing warnings for this field
    setWarnings(prev => {
      const newWarnings = { ...prev };
      delete newWarnings[field];
      return newWarnings;
    });
  }, []);

  const validateField = useCallback((field: string): ValidationResult => {
    const fieldConfig = config[field];
    if (!fieldConfig) {
      throw new Error(`No configuration found for field: ${field}`);
    }

    const value = values[field] || '';
    const result = sanitizeInput(value, fieldConfig.type, {
      required: fieldConfig.required,
      maxLength: fieldConfig.maxLength,
      allowEmpty: fieldConfig.allowEmpty
    });

    // Update field-specific errors and warnings
    if (!result.isValid) {
      setErrors(prev => ({ ...prev, [field]: result.errors }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (result.warnings.length > 0) {
      setWarnings(prev => ({ ...prev, [field]: result.warnings }));
    } else {
      setWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings[field];
        return newWarnings;
      });
    }

    return result;
  }, [values, config]);

  const validateForm = useCallback((): boolean => {
    const fieldTypes: Record<string, any> = {};
    const options: Record<string, any> = {};

    // Convert config to the format expected by validateFormData
    for (const [fieldName, fieldConfig] of Object.entries(config)) {
      fieldTypes[fieldName] = fieldConfig.type;
      options[fieldName] = {
        required: fieldConfig.required,
        maxLength: fieldConfig.maxLength,
        allowEmpty: fieldConfig.allowEmpty
      };
    }

    const validation = validateFormData(values, fieldTypes, options);

    setErrors(validation.errors);
    setWarnings(validation.warnings);
    setIsValid(validation.isValid);
    setHasSecurityRisks(validation.hasSecurityRisks);

    return validation.isValid && !validation.hasSecurityRisks;
  }, [values, config]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setWarnings({});
    setIsValid(true);
    setHasSecurityRisks(false);
  }, [initialValues]);

  const getSanitizedData = useCallback((): Record<string, string> => {
    const fieldTypes: Record<string, any> = {};
    const options: Record<string, any> = {};

    for (const [fieldName, fieldConfig] of Object.entries(config)) {
      fieldTypes[fieldName] = fieldConfig.type;
      options[fieldName] = {
        required: fieldConfig.required,
        maxLength: fieldConfig.maxLength,
        allowEmpty: fieldConfig.allowEmpty
      };
    }

    const validation = validateFormData(values, fieldTypes, options);
    return validation.sanitizedData;
  }, [values, config]);

  return {
    values,
    errors,
    warnings,
    isValid,
    hasSecurityRisks,
    setValue,
    validateField,
    validateForm,
    resetForm,
    getSanitizedData
  };
}