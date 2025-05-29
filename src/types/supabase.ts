import type { Database } from './database/schema';
import type { SupabaseClient } from '@supabase/supabase-js';

export type TypedSupabaseClient = SupabaseClient<Database>;

export interface Profile {
  id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface ProfilesResponse {
  data: Profile | null;
  error: any;
} 