import { useState } from 'react';
import { debug } from '@lib/utils/debug';

import { signUp } from '@lib/supabase/client';

interface AuthError {
  message: string;
}

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Password validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await signUp(email, password);
      
      if (signUpError) {
        setError((signUpError as AuthError).message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      debug.criticalError('Registration form error', err, { email: email ? 'provided' : 'missing' });
    } finally {
      setLoading(false);
    }
  };

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
      </div>
      
      <div className="form-group">
        <label htmlFor="password" className="form-label">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
          required
        />
        <p className="text-xs text-neutral-500 mt-1">
          Must be at least 8 characters
        </p>
      </div>
      
      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
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
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          Already have an account?{' '}
          <a href="/auth/login" className="text-primary hover:text-primary-dark">
            Sign in
          </a>
        </p>
      </div>
    </form>
  );
} 