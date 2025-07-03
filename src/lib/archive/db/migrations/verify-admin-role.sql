-- Run this in Supabase SQL editor to verify user roles

-- Check profiles table roles
SELECT id, email, role 
FROM profiles
ORDER BY role;

-- Check app_metadata roles in auth.users (this is what actually controls permissions)
SELECT 
    id, 
    email, 
    raw_app_meta_data->'role' as app_metadata_role
FROM auth.users 
ORDER BY email;

-- Check if the is_admin function exists
SELECT 
    routine_name, 
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin';

-- Check RLS policies that use is_admin()
SELECT 
    tablename, 
    policyname, 
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND qual::text LIKE '%is_admin%'
ORDER BY tablename, policyname;

-- To fix admin role for a specific user, run:
/*
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'YOUR_ADMIN_EMAIL@example.com';

-- Then verify the update
SELECT 
  id, 
  email, 
  raw_app_meta_data->'role' as role
FROM auth.users 
WHERE email = 'YOUR_ADMIN_EMAIL@example.com';
*/ 