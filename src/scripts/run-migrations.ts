import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { env } from '@lib/config/env';

async function runMigrations() {
  const supabase = createClient(env.supabase.url, env.supabase.serviceKey);
  
  // Read and execute the migration file
  const migrationPath = join(process.cwd(), 'src/lib/db/migrations/20240323_populate_categories.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    if (error) throw error;
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations(); 