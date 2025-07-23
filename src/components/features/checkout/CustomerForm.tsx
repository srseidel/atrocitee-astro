/**
 * Customer Form Component
 * 
 * Collects customer information for checkout including
 * shipping and billing addresses
 */

import React, { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@lib/supabase/client';
import AddressInput from '@components/common/AddressInput';
import PhoneInput from '@components/common/PhoneInput';

interface CustomerInfo {
  email: string;
  name: string;
  phone?: string;
  shipping: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  billing?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

interface CustomerFormProps {
  onSubmit: (customerInfo: CustomerInfo) => void;
  onBack: () => void;
}

export default function CustomerForm({ onSubmit, onBack }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerInfo>({
    email: '',
    name: '',
    phone: '',
    shipping: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
    },
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileNotice, setProfileNotice] = useState<string>('');
  const [isShippingAddressValid, setIsShippingAddressValid] = useState(true);
  const [isBillingAddressValid, setIsBillingAddressValid] = useState(true);
  const [isPhoneValid, setIsPhoneValid] = useState(true);

  // Load user profile data on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        // User not logged in, use empty form
        setProfileNotice('');
        setIsLoadingProfile(false);
        return;
      }

      // Get user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // No profile found, but user is authenticated - use email from auth
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
        }));
        setProfileNotice('Using your account email. You can update other information below.');
        setIsLoadingProfile(false);
        return;
      }

      // Profile found - pre-populate form
      const displayName = profile.display_name || '';
      const fullName = profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : displayName;

      setFormData(prev => ({
        ...prev,
        email: user.email || profile.email || '',
        name: fullName || '',
        phone: profile.phone || '',
        shipping: {
          line1: profile.address_line1 || '',
          line2: profile.address_line2 || '',
          city: profile.city || '',
          state: profile.state || '',
          postal_code: profile.postal_code || '',
          country: profile.country || 'US',
        },
      }));

      setProfileNotice('Information loaded from your account. You can modify it for this order if needed.');
      setIsLoadingProfile(false);

    } catch (error) {
      console.error('Error loading profile:', error);
      setProfileNotice('');
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    section?: 'shipping' | 'billing'
  ) => {
    const { name, value } = e.target;
    
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate name
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    // Check address validation
    if (!isShippingAddressValid) {
      newErrors.shipping_address = 'Please fix shipping address validation errors';
    }

    if (!sameAsShipping && !isBillingAddressValid) {
      newErrors.billing_address = 'Please fix billing address validation errors';
    }

    // Check phone validation (optional field)
    if (formData.phone && !isPhoneValid) {
      newErrors.phone = 'Please fix phone number validation errors';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const customerInfo: CustomerInfo = {
      ...formData,
      billing: sameAsShipping ? formData.shipping : formData.billing,
    };

    onSubmit(customerInfo);
  };

  const handleSameAsShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSameAsShipping(e.target.checked);
    
    if (e.target.checked) {
      // Remove billing address if same as shipping
      setFormData(prev => ({
        ...prev,
        billing: undefined,
      }));
    } else {
      // Initialize billing address
      setFormData(prev => ({
        ...prev,
        billing: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'US',
        },
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer Information</h2>
      
      {/* Loading State */}
      {isLoadingProfile && (
        <div className="flex items-center justify-center py-4 mb-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-600">Loading your account information...</span>
        </div>
      )}
      
      {/* Profile Notice */}
      {!isLoadingProfile && profileNotice && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-blue-800 text-sm">{profileNotice}</p>
          </div>
        </div>
      )}
      
      {/* Contact Information */}
      <div className="space-y-4 mb-6">
        <h3 className="text-md font-medium text-gray-900">Contact Information</h3>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="your@email.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          {!isLoadingProfile && formData.email && profileNotice && (
            <p className="mt-1 text-xs text-gray-500">
              ✓ Loaded from your account
            </p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="John Doe"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          {!isLoadingProfile && formData.name && profileNotice && (
            <p className="mt-1 text-xs text-gray-500">
              ✓ Loaded from your account
            </p>
          )}
        </div>

        <div>
          <PhoneInput
            value={formData.phone || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
            onValidationChange={setIsPhoneValid}
            label="Phone Number (Optional)"
            placeholder="(555) 123-4567"
            country="US"
            required={false}
            showValidation={true}
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          {!isLoadingProfile && formData.phone && profileNotice && (
            <p className="mt-1 text-xs text-gray-500">
              ✓ Loaded from your account
            </p>
          )}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-medium text-gray-900">Shipping Address</h3>
          {!isLoadingProfile && formData.shipping.line1 && profileNotice && (
            <span className="text-xs text-gray-500">✓ From your account</span>
          )}
        </div>
        
        <AddressInput
          address={{
            address_line1: formData.shipping.line1,
            address_line2: formData.shipping.line2 || '',
            city: formData.shipping.city,
            state: formData.shipping.state,
            postal_code: formData.shipping.postal_code,
            country: formData.shipping.country
          }}
          onChange={(address) => {
            setFormData(prev => ({
              ...prev,
              shipping: {
                line1: address.address_line1,
                line2: address.address_line2,
                city: address.city,
                state: address.state,
                postal_code: address.postal_code,
                country: address.country
              }
            }));
          }}
          onValidationChange={setIsShippingAddressValid}
          showValidation={true}
        />
        
        {errors.shipping_address && (
          <p className="text-sm text-red-600">{errors.shipping_address}</p>
        )}
      </div>

      {/* Billing Address */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="same_as_shipping"
            checked={sameAsShipping}
            onChange={handleSameAsShippingChange}
            className="mr-2"
          />
          <label htmlFor="same_as_shipping" className="text-sm font-medium text-gray-700">
            Billing address is same as shipping address
          </label>
        </div>

        {!sameAsShipping && formData.billing && (
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">Billing Address</h3>
            
            <AddressInput
              address={{
                address_line1: formData.billing.line1,
                address_line2: formData.billing.line2 || '',
                city: formData.billing.city,
                state: formData.billing.state,
                postal_code: formData.billing.postal_code,
                country: formData.billing.country
              }}
              onChange={(address) => {
                setFormData(prev => ({
                  ...prev,
                  billing: {
                    line1: address.address_line1,
                    line2: address.address_line2,
                    city: address.city,
                    state: address.state,
                    postal_code: address.postal_code,
                    country: address.country
                  }
                }));
              }}
              onValidationChange={setIsBillingAddressValid}
              showValidation={true}
            />
            
            {errors.billing_address && (
              <p className="text-sm text-red-600">{errors.billing_address}</p>
            )}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Back to Cart
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Continue to Payment
        </button>
      </div>
    </form>
  );
}