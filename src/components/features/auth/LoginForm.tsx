import { createBrowserClient } from '@supabase/ssr';
import { useState } from 'react';

interface AuthError {
  message: string;
}

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY
      );

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        setError((signInError as AuthError).message);
      } else {
        // Get the redirect URL from the query parameters or default to /admin/dashboard
        const url = new URL(window.location.href);
        const redirectTo = url.searchParams.get('redirect') || '/admin/dashboard';
        window.location.href = redirectTo;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
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
      </div>
      
      {error && (
        <div className="alert-brand-error mt-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        
        <a href="/auth/forgot-password" className="text-sm text-primary hover:text-primary-dark">
          Forgot password?
        </a>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          Don't have an account?{' '}
          <a href="/auth/register" className="text-primary hover:text-primary-dark">
            Register
          </a>
        </p>
      </div>
    </form>
  );
} 