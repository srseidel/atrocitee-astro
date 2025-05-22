import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  // Only check if variables exist, don't expose their values
  const envCheck = {
    hasPrintfulApiKey: !!import.meta.env.PRINTFUL_API_KEY,
    hasPrintfulBaseUrl: !!import.meta.env.PRINTFUL_API_BASE_URL,
    hasPrintfulStoreId: !!import.meta.env.PRINTFUL_STORE_ID,
    hasSupabaseUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  };

  return new Response(JSON.stringify(envCheck, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}; 