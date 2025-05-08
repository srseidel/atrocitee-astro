import { createServerSupabaseClient } from '../lib/supabase';

// Middleware to check if user is authenticated
export async function isAuthenticated(context: { cookies: any }) {
  const supabase = createServerSupabaseClient({ cookies: context.cookies });
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

// Get user data
export async function getUser(context: { cookies: any }) {
  const supabase = createServerSupabaseClient({ cookies: context.cookies });
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
}

// Redirect if not authenticated (for use in .astro files)
export async function redirectIfNotAuthenticated(astro: any) {
  const authenticated = await isAuthenticated(astro);
  
  if (!authenticated) {
    return astro.redirect('/auth/login?redirect=' + astro.url.pathname);
  }
  
  return null;
} 