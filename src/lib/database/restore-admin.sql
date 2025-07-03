-- Script to restore admin privileges to a user
-- Replace 'YOUR_USER_EMAIL' with the actual email of the admin user

-- First, find the user ID
SELECT id, email FROM auth.users WHERE email = 'scott@taxistake.com';

-- Then update the app_metadata to include the admin role
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'scott@taxistake.com';

-- Verify the update was successful
SELECT 
  id, 
  email, 
  raw_app_meta_data->'role' as role
FROM auth.users 
WHERE email = 'scott@taxistake.com';

-- Note: After running this script, you may need to sign out and sign back in 
-- for the changes to take effect in your JWT token. 