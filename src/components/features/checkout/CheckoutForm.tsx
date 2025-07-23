/**
 * Checkout Form Component
 * 
 * Handles the complete checkout process including:
 * - Cart validation and display
 * - Customer information collection
 * - Stripe payment integration
 * - Order processing
 */

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useSecureCart } from '@lib/hooks/useSecureCart';
import OrderSummary from './OrderSummary';
import CustomerForm from './CustomerForm';
import PaymentForm from './PaymentForm';
import LoadingSpinner from '@components/common/LoadingSpinner';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY);

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

export default function CheckoutForm() {
  const { items, totalPrice, loading, error, validateCart } = useSecureCart();
  const [step, setStep] = useState<'cart' | 'customer' | 'payment' | 'processing' | 'success' | 'error'>('cart');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [orderResult, setOrderResult] = useState<any>(null);
  const [processingError, setProcessingError] = useState<string>('');

  // Calculate order totals
  const subtotal = totalPrice;
  const tax = subtotal * 0.08; // 8% tax
  const shipping = 5.99; // Flat rate shipping
  const total = subtotal + tax + shipping;

  // Validate cart on load
  useEffect(() => {
    validateCart();
  }, []);

  // Move to customer form if cart is valid
  useEffect(() => {
    if (!loading && !error && items.length > 0 && step === 'cart') {
      setStep('customer');
    } else if (!loading && items.length === 0 && step === 'cart') {
      // Redirect to cart if empty
      window.location.href = '/cart';
    }
  }, [loading, error, items.length, step]);

  const handleCustomerSubmit = async (info: CustomerInfo) => {
    setCustomerInfo(info);
    setStep('processing');

    try {
      // Create payment intent
      const response = await fetch('/api/v1/checkout/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          shipping: info.shipping,
          customerEmail: info.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setStep('payment');
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setProcessingError(error instanceof Error ? error.message : 'Failed to create payment intent');
      setStep('error');
    }
  };

  const handlePaymentSuccess = async () => {
    if (!customerInfo || !paymentIntentId) return;

    setStep('processing');

    try {
      // Confirm payment and create order
      const response = await fetch('/api/v1/checkout/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          items,
          customerInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm payment');
      }

      setOrderResult(data);
      setStep('success');
    } catch (error) {
      console.error('Error confirming payment:', error);
      setProcessingError(error instanceof Error ? error.message : 'Failed to confirm payment');
      setStep('error');
    }
  };

  const handlePaymentError = (error: string) => {
    setProcessingError(error);
    setStep('error');
  };

  // Loading state
  if (loading || step === 'cart') {
    return (
      <div className="max-w-2xl mx-auto">
        <LoadingSpinner message="Loading cart..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Cart Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/cart'}
            className="btn btn-primary"
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Cart is Empty</h2>
          <p className="text-gray-600 mb-4">Add some items to your cart before checking out.</p>
          <button
            onClick={() => window.location.href = '/shop'}
            className="btn btn-primary"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Forms */}
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${step === 'customer' ? 'text-primary' : step === 'payment' || step === 'processing' || step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'customer' ? 'border-primary bg-primary text-white' : step === 'payment' || step === 'processing' || step === 'success' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Customer Info</span>
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className={`flex items-center ${step === 'payment' ? 'text-primary' : step === 'processing' || step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'payment' ? 'border-primary bg-primary text-white' : step === 'processing' || step === 'success' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Payment</span>
          </div>
        </div>

        {/* Customer Form */}
        {step === 'customer' && (
          <CustomerForm
            onSubmit={handleCustomerSubmit}
            onBack={() => window.location.href = '/cart'}
          />
        )}

        {/* Payment Form */}
        {step === 'payment' && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              clientSecret={clientSecret}
              customerInfo={customerInfo!}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onBack={() => setStep('customer')}
            />
          </Elements>
        )}

        {/* Processing State */}
        {step === 'processing' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <LoadingSpinner message="Processing your order..." />
          </div>
        )}

        {/* Success State */}
        {step === 'success' && orderResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h2 className="text-lg font-semibold text-green-800">Order Confirmed!</h2>
            </div>
            <p className="text-green-600 mt-2">
              Your order <span className="font-medium">#{orderResult.orderNumber}</span> has been confirmed.
            </p>
            <p className="text-sm text-green-600 mt-1">
              You will receive a confirmation email shortly.
            </p>
            <button
              onClick={() => window.location.href = '/shop'}
              className="mt-4 btn btn-primary"
            >
              Continue Shopping
            </button>
          </div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <h2 className="text-lg font-semibold text-red-800">Payment Error</h2>
            </div>
            <p className="text-red-600 mt-2">{processingError}</p>
            <button
              onClick={() => {
                setStep('customer');
                setProcessingError('');
              }}
              className="mt-4 btn btn-primary"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:sticky lg:top-8">
        <OrderSummary
          items={items}
          subtotal={subtotal}
          tax={tax}
          shipping={shipping}
          total={total}
        />
      </div>
    </div>
  );
}