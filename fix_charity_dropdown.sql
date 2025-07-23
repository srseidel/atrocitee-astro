-- Fix charity dropdown access
-- This script ensures authenticated users can read active charities

-- Check current charity policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'charities';

-- Drop existing charity policies to recreate them properly
DROP POLICY IF EXISTS "Allow authenticated users to read active charities" ON charities;
DROP POLICY IF EXISTS "Allow admins to read all charities" ON charities;
DROP POLICY IF EXISTS "Charities are viewable by everyone" ON charities;
DROP POLICY IF EXISTS "Only admins can insert charities" ON charities;
DROP POLICY IF EXISTS "Only admins can update charities" ON charities;
DROP POLICY IF EXISTS "Only admins can delete charities" ON charities;

-- Create simple charity policies that work without admin recursion
-- Allow all authenticated users to read active charities (this is what the dropdown needs)
CREATE POLICY "Authenticated users can read active charities"
ON charities
FOR SELECT
TO authenticated
USING (active = true);

-- Allow anonymous users to read active charities too (for public pages)
CREATE POLICY "Anonymous users can read active charities"
ON charities
FOR SELECT
TO anon
USING (active = true);

-- Simple admin policies using the new is_admin() function
CREATE POLICY "Admin users can manage charities"
ON charities
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Grant necessary permissions
GRANT SELECT ON charities TO authenticated;
GRANT SELECT ON charities TO anon;
GRANT ALL ON charities TO authenticated;

-- Test charity access
DO $$
BEGIN
    -- Test if we can read charities
    PERFORM 1 FROM charities WHERE active = true LIMIT 1;
    RAISE NOTICE 'Charity table access test successful';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Charity table access test failed: %', SQLERRM;
END$$;

-- Show some test data
SELECT id, name, active FROM charities LIMIT 5;