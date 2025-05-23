import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabaseClient({ cookies });
  
  try {
    // Check Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing authorization token' }),
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    // Verify token against a stored secret in your environment variables
    // This is a simplistic example - you should use a proper authentication mechanism
    if (token !== import.meta.env.BACKUP_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    // Parse the backup status JSON
    const backupData = await request.json();
    
    // Store in Supabase
    const { error } = await supabase
      .from('backup_status')
      .upsert({
        id: 'latest',
        data: backupData,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error storing backup status:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store backup data' }),
        { status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing backup status:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};

// Also allow GET to retrieve the latest backup status
export const GET: APIRoute = async ({ cookies }) => {
  const supabase = createServerSupabaseClient({ cookies });
  
  try {
    // Get the latest backup status
    const { data, error } = await supabase
      .from('backup_status')
      .select('*')
      .eq('id', 'latest')
      .single();
    
    if (error) {
      console.error('Error retrieving backup status:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve backup data' }),
        { status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify(data),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving backup status:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}; 