import { createServerClient } from '@supabase/ssr';
import { env } from '@lib/config/env';
import { debug } from '@lib/utils/debug';

import type { AstroCookies } from 'astro';
import type { TypedSupabaseClient } from '../../types/supabase';

// Create a Supabase client for admin operations using RLS policies
export const createAdminSupabaseClient = ({
  cookies,
  request,
}: {
  cookies: AstroCookies;
  request: Request;
}): TypedSupabaseClient => {
  if (!env.supabase.url || !env.supabase.anonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(
    env.supabase.url,
    env.supabase.anonKey,
    {
      cookies: {
        getAll() {
          if (!request) return [];
          const cookieHeader = request.headers.get('cookie') || '';
          return cookieHeader
            .split(';')
            .map(cookie => cookie.trim())
            .filter(Boolean)
            .map(cookie => {
              const [name, ...rest] = cookie.split('=');
              return { name, value: rest.join('=') };
            });
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookies.set(name, value, options);
            });
          } catch (error) {
            debug.criticalError('Error setting admin client cookies', error, { cookieKey: name });
          }
        }
      }
    }
  );
}; 