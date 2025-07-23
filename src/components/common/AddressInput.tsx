/**
 * Address Input Component with Real-time Validation
 * 
 * Provides address input fields with:
 * - Real-time validation
 * - State/ZIP code correlation checking
 * - Auto-suggestions
 * - Error and warning display
 */

import React, { useState, useEffect, useCallback } from 'react';

interface AddressData {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: {
    city?: string;
    state?: string;
    postal_code?: string;
  };
  confidence?: 'high' | 'medium' | 'low';
  verified_address?: {
    address_line1: string;
    city: string;
    state: string;
    postal_code: string;
  };
}

interface AddressInputProps {
  address: AddressData;
  onChange: (address: AddressData) => void;
  onValidationChange?: (isValid: boolean) => void;
  className?: string;
  showValidation?: boolean;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function AddressInput({ 
  address, 
  onChange, 
  onValidationChange,
  className = '',
  showValidation = true 
}: AddressInputProps) {
  const [validation, setValidation] = useState<ValidationResult>({ valid: true, errors: [], warnings: [] });
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);

  // Debounce address changes to avoid too many API calls
  const debouncedAddress = useDebounce(address, 800);

  // Validate address when debounced address changes
  useEffect(() => {
    // Only validate if we have enough information
    if (debouncedAddress.address_line1 && debouncedAddress.city && debouncedAddress.state && debouncedAddress.postal_code) {
      validateAddress(debouncedAddress);
    } else if (hasValidated) {
      // Clear validation if required fields are missing
      setValidation({ valid: false, errors: [], warnings: [] });
      onValidationChange?.(false);
    }
  }, [debouncedAddress]);

  const validateAddress = async (addressData: AddressData) => {
    setIsValidating(true);
    
    try {
      const response = await fetch('/api/validate/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });

      if (response.ok) {
        const result: ValidationResult = await response.json();
        setValidation(result);
        setHasValidated(true);
        onValidationChange?.(result.valid);
      } else {
        setValidation({ 
          valid: false, 
          errors: ['Unable to validate address'], 
          warnings: [] 
        });
        onValidationChange?.(false);
      }
    } catch (error) {
      console.error('Address validation error:', error);
      setValidation({ 
        valid: true, // Don't block if validation fails
        errors: [], 
        warnings: ['Address validation temporarily unavailable'] 
      });
      onValidationChange?.(true);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (field: keyof AddressData, value: string) => {
    const updatedAddress = { ...address, [field]: value };
    onChange(updatedAddress);
  };

  const applySuggestion = (field: keyof AddressData, value: string) => {
    handleInputChange(field, value);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Address Line 1 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1 *
        </label>
        <input
          type="text"
          value={address.address_line1}
          onChange={(e) => handleInputChange('address_line1', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="123 Main Street"
        />
      </div>

      {/* Address Line 2 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2
        </label>
        <input
          type="text"
          value={address.address_line2}
          onChange={(e) => handleInputChange('address_line2', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Apartment, suite, etc. (optional)"
        />
      </div>

      {/* City, State, ZIP in a row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* City */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            value={address.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="New York"
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <input
            type="text"
            value={address.state}
            onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="NY"
            maxLength={2}
          />
        </div>

        {/* ZIP Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code *
          </label>
          <input
            type="text"
            value={address.postal_code}
            onChange={(e) => handleInputChange('postal_code', e.target.value.replace(/\D/g, '').substring(0, 5))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="10001"
            maxLength={5}
          />
        </div>
      </div>

      {/* Validation Status */}
      {showValidation && (
        <div className="space-y-2">
          {/* Loading State */}
          {isValidating && (
            <div className="flex items-center text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Validating address...
            </div>
          )}

          {/* Validation Success with Confidence Level */}
          {hasValidated && !isValidating && validation.valid && validation.errors.length === 0 && validation.warnings.length === 0 && (
            <div className="flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>
                Address validated successfully
                {validation.confidence && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                    validation.confidence === 'high' ? 'bg-green-100 text-green-800' :
                    validation.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {validation.confidence} confidence
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Verified Address Display */}
          {hasValidated && !isValidating && validation.verified_address && validation.confidence === 'high' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800">Verified Address</p>
                  <p className="text-sm text-green-700 mt-1">
                    {validation.verified_address.address_line1}<br />
                    {validation.verified_address.city}, {validation.verified_address.state} {validation.verified_address.postal_code}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validation.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Address validation errors:</p>
                  <ul className="mt-1 list-disc list-inside text-sm text-red-700">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Validation Warnings with Confidence Context */}
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-yellow-800">Please verify:</p>
                    {validation.confidence && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        validation.confidence === 'high' ? 'bg-green-100 text-green-800' :
                        validation.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {validation.confidence} confidence
                      </span>
                    )}
                  </div>
                  <ul className="mt-1 list-disc list-inside text-sm text-yellow-700">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {validation.suggestions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 mb-2">Suggested corrections:</p>
                  <div className="space-y-1">
                    {validation.suggestions.city && (
                      <button
                        onClick={() => applySuggestion('city', validation.suggestions!.city!)}
                        className="text-sm text-blue-700 hover:text-blue-900 underline block"
                      >
                        Use "{validation.suggestions.city}" for city
                      </button>
                    )}
                    {validation.suggestions.state && (
                      <button
                        onClick={() => applySuggestion('state', validation.suggestions!.state!)}
                        className="text-sm text-blue-700 hover:text-blue-900 underline block"
                      >
                        Use "{validation.suggestions.state}" for state
                      </button>
                    )}
                    {validation.suggestions.postal_code && (
                      <button
                        onClick={() => applySuggestion('postal_code', validation.suggestions!.postal_code!)}
                        className="text-sm text-blue-700 hover:text-blue-900 underline block"
                      >
                        Use "{validation.suggestions.postal_code}" for ZIP code
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}