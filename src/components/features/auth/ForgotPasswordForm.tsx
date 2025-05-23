import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="alert-brand-success p-6 rounded-lg text-center">
        <h3 className="text-xl font-bold mb-2">Password Reset Email Sent</h3>
        <p className="mb-4">
          We've sent a password reset link to <strong>{email}</strong>. 
          Please check your email inbox and follow the instructions.
        </p>
        <p className="text-sm text-neutral-500 mb-4">
          If you don't see the email in your inbox, please check your spam folder.
          The link will expire if not used within a few hours.
        </p>
        <a href="/auth/login" className="btn btn-primary">
          Return to Login
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="form-group">
        <label htmlFor="email" className="form-label">Email Address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
          required
        />
        <p className="text-xs text-neutral-500 mt-1">
          Enter the email address associated with your account
        </p>
      </div>
      
      {error && (
        <div className="alert-brand-error mt-4">
          <p>{error}</p>
        </div>
      )}
      
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading ? 'Sending Reset Link...' : 'Reset Password'}
      </button>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          Remembered your password?{' '}
          <a href="/auth/login" className="text-primary hover:text-primary-dark">
            Sign in
          </a>
        </p>
      </div>
    </form>
  );
} 