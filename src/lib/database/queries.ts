import { createServerSupabaseClient } from '@lib/supabase/client';

// Type for database query options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Helper to build a query with common options
export async function buildQuery(
  table: string,
  options: QueryOptions = {},
  context: { cookies: any }
) {
  const supabase = createServerSupabaseClient({ cookies: context.cookies });
  let query = supabase.from(table).select('*');

  // Apply filters
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  // Apply ordering
  if (options.orderBy) {
    query = query.order(options.orderBy, {
      ascending: options.orderDirection === 'asc',
    });
  }

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  return query;
}

// Helper to get a single record by ID
export async function getById(
  table: string,
  id: string,
  context: { cookies: any }
) {
  const supabase = createServerSupabaseClient({ cookies: context.cookies });
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Helper to create a new record
export async function create(
  table: string,
  data: Record<string, any>,
  context: { cookies: any }
) {
  const supabase = createServerSupabaseClient({ cookies: context.cookies });
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Helper to update a record
export async function update(
  table: string,
  id: string,
  data: Record<string, any>,
  context: { cookies: any }
) {
  const supabase = createServerSupabaseClient({ cookies: context.cookies });
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Helper to delete a record
export async function remove(
  table: string,
  id: string,
  context: { cookies: any }
) {
  const supabase = createServerSupabaseClient({ cookies: context.cookies });
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
} 