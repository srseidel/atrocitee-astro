# Setting Up Supabase with Cloudflare Pages

## Environment Variables

The "fetch failed" error when using authentication pages in the staging environment typically occurs when the Supabase environment variables aren't properly configured in your Cloudflare Pages project settings.

### Required Environment Variables

Make sure the following environment variables are available to your application:

- `PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### How to Set Environment Variables with wrangler.toml

If you're using a `wrangler.toml` file to configure your Cloudflare Pages project, you must define your environment variables in the wrangler.toml file, not in the Cloudflare dashboard:

1. Open or create your `wrangler.toml` file at the root of your project
2. Add your environment variables in the appropriate section:

   ```toml
   [vars]
   PUBLIC_SUPABASE_URL = "https://your-project.supabase.co"
   PUBLIC_SUPABASE_ANON_KEY = "your-anon-key"
   
   # Use environment-specific variables for different environments
   [env.preview]
   vars = { PUBLIC_SUPABASE_URL = "https://your-staging-project.supabase.co", PUBLIC_SUPABASE_ANON_KEY = "your-staging-anon-key" }
   ```

3. For sensitive values that shouldn't be in your code repository, use Cloudflare dashboard's secret environment variables:

   ```bash
   # Set a secret (do this once)
   npx wrangler secret put PUBLIC_SUPABASE_ANON_KEY
   ```

### How to Set Environment Variables in Cloudflare Dashboard (when not using wrangler.toml)

If you're not using wrangler.toml, you can set environment variables directly in the Cloudflare dashboard:

1. Go to the Cloudflare Dashboard
2. Navigate to **Pages** > **Your Project**
3. Click on **Settings** > **Environment variables**
4. Add both environment variables for each environment (Production and Preview)
5. Save the changes

> **IMPORTANT**: When using wrangler.toml, only secret values should be set in the Cloudflare dashboard. Regular environment variables must be defined in the wrangler.toml file

### Preventing Build-Time Errors

In our project, we've included fallbacks for the Supabase environment variables during build time, but they won't work for actual API requests:

```js
// Environment variables with fallbacks for build time
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
```

While this prevents build errors, the actual application needs real values to make API calls.

### Troubleshooting "Fetch Failed" Errors

If you're still seeing "fetch failed" errors in the staging environment:

1. **Verify Environment Variables**: Double-check that you've set the environment variables correctly in the Cloudflare Pages dashboard.

2. **Check Browser Console**: Open the browser's developer tools console to see the specific error details. This can provide more information about what's failing.

3. **Test API Endpoint**: Try to access your Supabase endpoint directly to ensure it's publicly accessible:
   ```
   curl https://your-supabase-url.supabase.co/rest/v1/
   ```

4. **Check CORS Settings**: Ensure your Supabase project has the correct CORS settings to allow requests from your Cloudflare domain.

5. **Local vs Production**: If it works locally but not in production, compare the network requests to identify differences.

## Additional Configuration

### KV Storage for Sessions

Cloudflare Pages requires KV storage for sessions. If you're seeing a warning about "Invalid binding `SESSION`", you need to configure this in your wrangler configuration:

1. Create or edit the `wrangler.toml` file at the root of your project:
   ```toml
   [[kv_namespaces]]
   binding = "SESSION"
   id = "your-kv-id"
   preview_id = "your-preview-kv-id"
   ```

2. Create the KV namespace in Cloudflare Workers dashboard if you haven't already.

3. Update your Cloudflare Pages settings to include this binding. 