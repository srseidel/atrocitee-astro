# Restoring Admin Privileges in Supabase

After your Supabase project has been restored, you'll need to manually restore admin privileges to your user account. This is because the `app_metadata` containing the admin role information may not have been preserved during the project restoration.

## Method 1: Using the Supabase Dashboard SQL Editor

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your restored project
3. Go to the "SQL Editor" section in the left sidebar
4. Create a new query
5. Paste the following SQL, replacing `YOUR_USER_EMAIL` with your actual admin email:

```sql
-- First, find the user ID
SELECT id, email FROM auth.users WHERE email = 'YOUR_USER_EMAIL';

-- Then update the app_metadata to include the admin role
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'YOUR_USER_EMAIL';

-- Verify the update was successful
SELECT 
  id, 
  email, 
  raw_app_meta_data->'role' as role
FROM auth.users 
WHERE email = 'YOUR_USER_EMAIL';
```

6. Click "Run" to execute the query
7. Sign out of your application and sign back in to refresh your JWT token

## Method 2: Using the Supabase Management API

If you prefer using the API, you can use the Supabase Management API to update the user:

1. Get your Supabase service role key from the API settings in your project
2. Use the following curl command (replace the placeholders with your actual values):

```bash
curl -X PATCH 'https://api.supabase.com/v1/projects/{PROJECT_ID}/users/{USER_ID}' \
  -H 'Authorization: Bearer {SERVICE_ROLE_KEY}' \
  -H 'Content-Type: application/json' \
  -d '{
    "app_metadata": {
      "role": "admin"
    }
  }'
```

## Method 3: Using the Supabase Auth UI

1. Go to your Supabase dashboard
2. Select your project
3. Navigate to "Authentication" > "Users"
4. Find your admin user and click on it
5. In the user details panel, look for the "Metadata" section
6. Add or edit the `app_metadata` to include `"role": "admin"`
7. Save the changes
8. Sign out and sign back in to refresh your JWT token

## Verifying Admin Access

After updating your user's `app_metadata`, you can verify that the admin privileges are working by:

1. Signing out and signing back in to your application
2. Attempting to access an admin-only page or feature
3. Running the following SQL query in the Supabase SQL Editor:

```sql
-- This will return TRUE if you have admin privileges
SELECT is_admin();
```

If you're still having issues, check that:

1. The `is_admin()` function exists in your database
2. Your RLS policies are correctly configured to use this function
3. Your JWT token has been refreshed (by signing out and back in)

Remember: According to your schema, the `role` column in the `profiles` table is for UI/reference only. The actual authorization is enforced via the `app_metadata` in the JWT token. 