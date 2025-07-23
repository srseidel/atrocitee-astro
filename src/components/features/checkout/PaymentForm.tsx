/**
 * Payment Form Component
 * 
 * Handles Stripe payment processing with Elements
 */

import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';

interface CustomerInfo {
  email: string;
  name: string;
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

interface PaymentFormProps {
  clientSecret: string;
  customerInfo: CustomerInfo;
  onSuccess: () => void;
  onError: (error: string) => void;
  onBack: () => void;
}

export default function PaymentForm({
  clientSecret,
  customerInfo,
  onSuccess,
  onError,
  onBack,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      // Confirm the payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          payment_method_data: {
            billing_details: {
              name: customerInfo.name,
              email: customerInfo.email,
              address: {
                line1: customerInfo.billing?.line1 || customerInfo.shipping.line1,
                line2: customerInfo.billing?.line2 || customerInfo.shipping.line2,
                city: customerInfo.billing?.city || customerInfo.shipping.city,
                state: customerInfo.billing?.state || customerInfo.shipping.state,
                postal_code: customerInfo.billing?.postal_code || customerInfo.shipping.postal_code,
                country: customerInfo.billing?.country || customerInfo.shipping.country,
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setMessage(error.message || 'Payment failed');
        } else {
          setMessage('An unexpected error occurred');
        }
        onError(error.message || 'Payment failed');
      } else {
        // Payment succeeded
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setMessage(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Information</h2>
      
      {/* Customer Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Order Details</h3>
        <p className="text-sm text-gray-600">{customerInfo.name}</p>
        <p className="text-sm text-gray-600">{customerInfo.email}</p>
        <p className="text-sm text-gray-600">
          {customerInfo.shipping.line1}
          {customerInfo.shipping.line2 && `, ${customerInfo.shipping.line2}`}
        </p>
        <p className="text-sm text-gray-600">
          {customerInfo.shipping.city}, {customerInfo.shipping.state} {customerInfo.shipping.postal_code}
        </p>
      </div>

      {/* Payment Element */}
      <div className="mb-6">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
          }}
        />
      </div>

      {/* Error Message */}
      {message && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{message}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        
        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Complete Order'
          )}
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Your payment information is secure and encrypted
        </p>
      </div>
    </form>
  );
}