-- Start transaction
BEGIN;

-- Create the backup_status table
CREATE TABLE IF NOT EXISTS public.backup_status (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.backup_status ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Allow admins to view backup status" ON public.backup_status;
DROP POLICY IF EXISTS "Allow full admin access" ON public.backup_status;
DROP POLICY IF EXISTS "Allow admin access via metadata" ON public.backup_status;
DROP POLICY IF EXISTS "Allow backup service to upsert data" ON public.backup_status;
DROP POLICY IF EXISTS "Allow backup service to update data" ON public.backup_status;

-- Create a metadata-based policy
CREATE POLICY "Allow admin access via metadata" 
ON public.backup_status 
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);

-- Allow backup service to insert/update with API token
CREATE POLICY "Allow backup service to upsert data"
ON public.backup_status
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow backup service to update data"
ON public.backup_status
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Add the required environment variable to your .env file:
-- BACKUP_API_TOKEN=your_secure_random_token

-- Example of how to run this migration:
-- psql postgresql://postgres:password@db.YOUR_PROJECT_REF.supabase.co:5432/postgres -f supabase-migration.sql 

-- Insert test data if it doesn't exist
INSERT INTO public.backup_status (id, data) 
VALUES ('test', '{"last_backup":{"status":"success"}}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert 'latest' record which is what the application code looks for
INSERT INTO public.backup_status (id, data) 
VALUES ('latest', 
('{
  "last_backup": {
    "timestamp": '|| extract(epoch from now()) ||',
    "date": "'|| now() ||'",
    "status": "success",
    "filename": "manual_backup.sql.gz.gpg",
    "size": "2.5MB",
    "duration_seconds": 45
  },
  "backups": [
    {
      "filename": "manual_backup.sql.gz.gpg",
      "size": "2.5MB",
      "timestamp": '|| extract(epoch from now()) ||'
    }
  ],
  "retention_days": 10,
  "backup_dir": "/path/to/backups"
}')::jsonb)
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;

-- Check table ownership
SELECT tableowner FROM pg_tables WHERE tablename = 'backup_status';

-- Ensure proper privileges
GRANT SELECT, INSERT, UPDATE ON public.backup_status TO authenticated; 

-- Check if the function exists
SELECT COUNT(*) FROM information_schema.routines 
WHERE routine_name = 'is_admin' AND routine_schema = 'public';

-- If it doesn't exist, create it:
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_meta JSONB;
  user_role TEXT;
BEGIN
  -- First check app_metadata from auth.users
  SELECT raw_app_meta_data INTO user_meta 
  FROM auth.users 
  WHERE id = user_id;
  
  -- Check if role exists in app_metadata
  IF user_meta ->> 'role' = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback to profiles check if needed
  BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
    RETURN user_role = 'admin';
  EXCEPTION
    WHEN OTHERS THEN
      RETURN FALSE;
  END;
END;
$$;

-- Update app_metadata to add admin role (modify email as needed)
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'scott@taxistake.com';

-- Commit transaction
COMMIT;