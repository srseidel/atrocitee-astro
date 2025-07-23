-- Fix Account Settings Database Permissions
-- Run this in your Supabase SQL editor to fix the authentication and permissions issues

-- 1. Setup RLS for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
  )
);

-- 2. Setup RLS for charities table
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read active charities" ON charities;
DROP POLICY IF EXISTS "Allow admins to read all charities" ON charities;

-- Allow all authenticated users to read active charities
CREATE POLICY "Allow authenticated users to read active charities"
ON charities
FOR SELECT
TO authenticated
USING (active = true);

-- Allow admins to read all charities (active and inactive)
CREATE POLICY "Allow admins to read all charities"
ON charities
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 3. Add default_charity_id field to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'default_charity_id'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN default_charity_id UUID REFERENCES charities(id) ON DELETE SET NULL;
        
        -- Add an index for performance
        CREATE INDEX idx_profiles_default_charity_id ON profiles(default_charity_id);
        
        -- Add a comment explaining the field
        COMMENT ON COLUMN profiles.default_charity_id IS 'Default charity for user donations - can be overridden per order';
    END IF;
END $$;

-- 4. Create some sample charities if none exist
INSERT INTO charities (id, name, description, website_url, active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'American Red Cross',
    'The American Red Cross provides emergency assistance, disaster relief, and disaster preparedness education.',
    'https://www.redcross.org',
    true,
    now(),
    now()
WHERE NOT EXISTS (SELECT 1 FROM charities WHERE name = 'American Red Cross');

INSERT INTO charities (id, name, description, website_url, active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Doctors Without Borders',
    'International humanitarian organization providing medical assistance to people affected by conflict, epidemics, disasters, or exclusion from healthcare.',
    'https://www.doctorswithoutborders.org',
    true,
    now(),
    now()
WHERE NOT EXISTS (SELECT 1 FROM charities WHERE name = 'Doctors Without Borders');

INSERT INTO charities (id, name, description, website_url, active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'World Wildlife Fund',
    'International non-governmental organization working on issues regarding the conservation, research and restoration of the environment.',
    'https://www.worldwildlife.org',
    true,
    now(),
    now()
WHERE NOT EXISTS (SELECT 1 FROM charities WHERE name = 'World Wildlife Fund');

-- 5. Verify everything is working
-- Check if tables exist and have the right permissions
DO $$
BEGIN
    -- Test if profiles table is accessible
    PERFORM 1 FROM profiles LIMIT 1;
    RAISE NOTICE 'Profiles table is accessible';
EXCEPTION 
    WHEN OTHERS THEN 
        RAISE NOTICE 'Issue with profiles table: %', SQLERRM;
END$$;

DO $$
BEGIN
    -- Test if charities table is accessible
    PERFORM 1 FROM charities LIMIT 1;
    RAISE NOTICE 'Charities table is accessible';
EXCEPTION 
    WHEN OTHERS THEN 
        RAISE NOTICE 'Issue with charities table: %', SQLERRM;
END$$;

-- Show summary
SELECT 
    'Database Setup Complete!' as status,
    (SELECT COUNT(*) FROM charities WHERE active = true) as active_charities,
    (SELECT COUNT(*) FROM profiles) as total_profiles;