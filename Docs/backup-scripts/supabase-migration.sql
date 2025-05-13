-- Create the backup_status table
CREATE TABLE IF NOT EXISTS public.backup_status (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.backup_status ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users with admin role to select backup data
CREATE POLICY "Allow admins to view backup status" 
ON public.backup_status 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'admin'
    )
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