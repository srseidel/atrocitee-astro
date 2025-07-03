-- Script to verify admin role setup in the database

-- Check if the is_admin function exists
SELECT 
    routine_name, 
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin';

-- Check if the profiles table has the role column
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'role';

-- Check RLS policies that use is_admin()
SELECT 
    tablename, 
    policyname, 
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND qual::text LIKE '%is_admin%'
ORDER BY tablename, policyname;

-- Check if any users have admin role in app_metadata
SELECT 
    id, 
    email, 
    raw_app_meta_data->'role' as role
FROM auth.users 
WHERE raw_app_meta_data->'role' = '"admin"';

-- Test the is_admin() function (will only work if you're currently logged in as admin)
-- Uncomment this line to test:
-- SELECT is_admin(); 