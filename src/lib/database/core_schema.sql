-- Core Database Schema for Atrocitee
-- This file contains user-related tables that should not be dropped during rebuilds

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create timestamp update function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add a comment clarifying the role column is for UI/reference only
COMMENT ON COLUMN profiles.role IS 'For UI/reference only. All admin authorization is enforced via app_metadata in the JWT.';

-- Create a secure view that can be safely exposed
CREATE OR REPLACE VIEW public_profiles AS
  SELECT id, display_name, avatar_url, role
  FROM profiles;

-- Drop existing trigger first
DROP TRIGGER IF EXISTS update_profiles_timestamp ON profiles;

-- Add timestamps trigger
CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admin users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin users can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Create is_admin functions that check app_metadata
-- Version without parameters (checks current user)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role') = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Version with user_id parameter
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- First check if the requesting user is an admin
  IF NOT (SELECT is_admin()) THEN
    RETURN FALSE;
  END IF;

  -- If we're an admin, check the target user's role
  SELECT ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role')
  INTO user_role
  FROM auth.users
  WHERE id = user_id;

  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON public_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated; 