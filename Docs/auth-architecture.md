# Atrocitee Authentication Architecture

## Overview

This document outlines our approach to authentication in the Atrocitee platform. We use a hybrid rendering strategy where most pages are statically generated for performance, while pages requiring authentication are server-rendered.

## Authentication Strategy

1. **Supabase Auth**: We use Supabase Auth with `@supabase/ssr` for authentication
2. **Hybrid Rendering**: 
   - Public pages: Static generation (default in Astro)
   - Protected pages: Server-side rendering (using `export const prerender = false;`)
3. **Route Protection**: Two-layered approach:
   - **Middleware**: Initial auth check and redirection via `src/middleware.ts`
   - **Component-level**: Additional checks in page components

## Protected Page Types

The following page types require authentication and should be server-rendered:

1. **Admin Pages**:
   - `/admin/*` - All admin pages
   - Responsibilities: Product management, order management, charity configuration
   - **Important**: Must include `export const prerender = false;` in the frontmatter

2. **User Account Pages**:
   - `/account/*` - User profile, order history, settings
   - Purpose: Personal account management for registered users
   - **Important**: Must include `export const prerender = false;` in the frontmatter

3. **API Endpoints for Protected Data**:
   - `/api/protected/*` - Endpoints requiring authentication
   - Example: `/api/printful/test` - Admin-only API endpoints
   - **Important**: Must include `export const prerender = false;` at the top of the file

4. **Checkout Flow** (when requiring user data):
   - `/checkout/authenticated/*` - User-specific checkout process
   - Purpose: Logged-in checkout experience with saved information

## Middleware-based Authentication

Since v1.2.0, we use Astro middleware for route-based authentication:

```typescript
// src/middleware.ts
import { createServerSupabaseClient } from './lib/supabase';
import type { MiddlewareHandler } from 'astro';

// Pattern matching for protected routes
const ADMIN_ROUTE_PATTERN = /^\/admin\//;
const ACCOUNT_ROUTE_PATTERN = /^\/account\//;

// Authentication middleware
const authMiddleware: MiddlewareHandler = async ({ cookies, request, url }, next) => {
  // 1. Check if route requires authentication
  // 2. Verify user session using Supabase
  // 3. For admin routes, verify admin permissions
  // 4. Redirect if unauthorized
};

export const onRequest = authMiddleware;
```

Benefits of middleware approach:
- Centralized authentication logic
- Consistent behavior across routes
- Simplified page components 
- Early interception of unauthorized requests

## Implementation Pattern for Protected Pages

For all protected pages, use the following pattern:

```astro
---
// 1. Mark as server-rendered (CRITICAL - without this, auth will fail)
export const prerender = false;

// 2. Import components and page-specific data
import MainLayout from "../../layouts/MainLayout.astro";

// 3. The middleware handles authentication, so no explicit auth check is needed here
// 4. Page-specific data loading
---

<!-- Page Content -->
```

## Authentication Components

1. **LoginForm**: Client-side component for user login
2. **RegisterForm**: Client-side component for user registration
3. **PasswordResetForm**: Client-side component for password reset

## Auth Utilities

Located in `src/utils/auth.ts`:

1. `isAuthenticated(context)`: Checks if the current user is authenticated
2. `getUser(context)`: Gets the current user's data
3. `isAdmin(context)`: Checks if the current user has admin privileges 
4. `redirectIfNotAuthenticated(astro)`: Redirects to login if not authenticated
5. `redirectIfNotAdmin(astro)`: Redirects to unauthorized page if not admin

## Admin Role Verification

Admin status is verified through:
1. Check user's `app_metadata.role` for "admin" value (set via Supabase dashboard or SQL)
2. Check user's `user_metadata.role` for "admin" value (fallback)
3. Call to `rpc('is_admin')` function in Supabase database

## Security Considerations

1. Row Level Security (RLS) in Supabase for data protection
2. Server-side session verification for all protected routes
3. HTTP-only cookies for secure session management
4. Separation of anonymous/public key (client-side) from service role key (server-only)
5. All authentication-dependent pages must use `export const prerender = false;`

## Testing Authentication

To test the authentication flow:
1. Register a new account at `/auth/register`
2. Confirm email if email verification is enabled
3. Log in at `/auth/login`
4. Try accessing a protected page like `/admin` 
5. To check admin status, visit `/auth/check-role` 