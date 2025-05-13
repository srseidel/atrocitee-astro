import { createServerSupabaseClient } from '../lib/supabase';

// Middleware to check if user is authenticated
export async function isAuthenticated(context: { cookies: any }) {
  const supabase = createServerSupabaseClient({ cookies: context.cookies });
  const { data, error } = await supabase.auth.getUser();
  return !!data.user && !error;
}

// Get user data
export async function getUser(context: { cookies: any }) {
  const supabase = createServerSupabaseClient({ cookies: context.cookies });
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

// Check if the current user has admin role
export async function isAdmin(context: { cookies: any }): Promise<boolean> {
  const supabase = createServerSupabaseClient({ cookies: context.cookies });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    console.log("[DEBUG] isAdmin: No user found");
    return false;
  }
  
  // Use the user's metadata to check for admin role
  // This avoids querying the profiles table directly
  if (userData.user.app_metadata?.role === 'admin' || 
      userData.user.user_metadata?.role === 'admin') {
    console.log("[DEBUG] User metadata indicates admin role");
    return true;
  }
  
  // Call the is_admin database function (security definer)
  // This bypasses RLS for checking the admin role
  const { data: result, error } = await supabase
    .rpc('is_admin', { user_id: userData.user.id });
  
  if (error) {
    console.log("[DEBUG] isAdmin error:", error.message);
    // No fallback to querying profiles directly - this causes permission issues
    return false;
  }
  
  console.log("[DEBUG] isAdmin check result:", result);
  return !!result;
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