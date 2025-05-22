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
    console.log("[DEBUG] isAdmin: No session found");
    return false;
  }
  
  // Call the is_admin database function (security definer)
  // This bypasses RLS for checking the admin role
  const { data: result, error } = await supabase
    .rpc('is_admin', { user_id: data.session.user.id });
  
  if (error) {
    console.log("[DEBUG] isAdmin error:", error.message);
    // Fallback to direct query if RPC not available yet
    try {
      // Try direct query with service role if available
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single();
      
      const isAdminUser = profile?.role === 'admin';
      console.log("[DEBUG] Fallback admin check:", { 
        role: profile?.role, 
        isAdmin: isAdminUser 
      });
      return isAdminUser;
    } catch (err) {
      console.log("[DEBUG] Both checks failed:", err);
      return false;
    }
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