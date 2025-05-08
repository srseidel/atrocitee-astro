import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '../../lib/supabase';

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [linkValid, setLinkValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for errors or hash fragment
    const url = new URL(window.location.href);
    const hash = window.location.hash;
    const urlError = url.searchParams.get('error');
    const errorCode = url.searchParams.get('error_code');
    const errorDescription = url.searchParams.get('error_description');
    
    // Check for valid reset flow or errors
    if (urlError || errorCode) {
      setLinkValid(false);
      setErrorMessage(errorDescription || 'Your password reset link is invalid or has expired.');
    } else if (hash.includes('type=recovery')) {
      setLinkValid(true);
    } else {
      setLinkValid(false);
      setErrorMessage('This page is only accessible through a password reset link sent to your email.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });
      
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

  if (!linkValid) {
    return (
      <div className="alert-brand-error p-6 rounded-lg text-center">
        <h3 className="text-xl font-bold mb-2">Invalid or Expired Reset Link</h3>
        <p className="mb-4">
          {errorMessage}
        </p>
        <p className="text-sm text-neutral-500 mb-4">
          Please request a new password reset link to continue.
        </p>
        <a href="/auth/forgot-password" className="btn btn-primary">
          Request New Reset Link
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="alert-brand-success p-6 rounded-lg text-center">
        <h3 className="text-xl font-bold mb-2">Password Reset Successful</h3>
        <p className="mb-4">Your password has been successfully reset.</p>
        <a href="/auth/login" className="btn btn-primary">
          Sign In
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="form-group">
        <label htmlFor="password" className="form-label">New Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
          required
          minLength={8}
        />
        <p className="text-xs text-neutral-500 mt-1">
          Must be at least 8 characters
        </p>
      </div>
      
      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="form-input"
          required
        />
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
        {loading ? 'Resetting Password...' : 'Reset Password'}
      </button>
    </form>
  );
} 