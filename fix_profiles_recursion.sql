-- Fix infinite recursion in profiles RLS policies
-- This script fixes the circular reference issue in the profiles table policies

-- Drop all existing policies for profiles to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create simple, non-recursive policies for profiles
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Create an is_admin function that uses auth.jwt() to avoid recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check if the user has admin role in their JWT claims
  -- This avoids querying the profiles table from within its own RLS policy
  RETURN (auth.jwt() ->> 'role' = 'admin') OR 
         (auth.jwt() ->> 'user_role' = 'admin') OR
         (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
         (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
EXCEPTION WHEN OTHERS THEN
  -- If there's any error accessing JWT, default to not admin
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Create admin policies that use a different approach
-- Instead of checking profiles table, we'll use a service role or bypass RLS for admin operations
-- For now, let's keep it simple and only allow users to manage their own profiles

-- Grant permissions
GRANT ALL ON profiles TO authenticated;

-- Test the policies by trying to select from profiles
DO $$
BEGIN
    -- This should work without infinite recursion now
    PERFORM 1 FROM profiles LIMIT 1;
    RAISE NOTICE 'Profiles table access test successful - no infinite recursion detected';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Profiles table access test failed: %', SQLERRM;
END$$;

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';