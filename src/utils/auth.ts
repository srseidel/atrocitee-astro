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

// Check if the current user has admin role
export async function isAdmin(context: { cookies: any }): Promise<boolean> {
  const supabase = createServerSupabaseClient({ cookies: context.cookies });
  const { data } = await supabase.auth.getSession();
  
  if (!data.session) {
    return false;
  }
  
  // Fetch the user's profile to check the role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.session.user.id)
    .single();
    
  return profile?.role === 'admin';
}

// Redirect if not authenticated (for use in .astro files)
export async function redirectIfNotAuthenticated(astro: any) {
  const authenticated = await isAuthenticated(astro);
  
  if (!authenticated) {
    return astro.redirect('/auth/login?redirect=' + astro.url.pathname);
  }
  
  return null;
}

// Redirect if not an admin (for use in .astro files)
export async function redirectIfNotAdmin(astro: any) {
  const isUserAdmin = await isAdmin(astro);
  
  if (!isUserAdmin) {
    return astro.redirect('/auth/unauthorized');
  }
  
  return null;
} 