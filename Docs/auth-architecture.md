# Atrocitee Authentication Architecture

## Overview

This document outlines our approach to authentication in the Atrocitee platform. We use a hybrid rendering strategy where most pages are statically generated for performance, while pages requiring authentication are server-rendered.

## Authentication Strategy

1. **Supabase Auth**: We use Supabase Auth with `@supabase/ssr` for authentication
2. **Hybrid Rendering**: 
   - Public pages: Static generation (default in Astro)
   - Protected pages: Server-side rendering (using `export const prerender = false;`)
3. **Route Protection**: Authenticated routes check session state on the server

## Protected Page Types

The following page types require authentication and should be server-rendered:

1. **Admin Pages**:
   - `/admin/*` - All admin pages
   - Responsibilities: Product management, order management, charity configuration

2. **User Account Pages**:
   - `/account/*` - User profile, order history, settings
   - Purpose: Personal account management for registered users

3. **Checkout Flow** (when requiring user data):
   - `/checkout/authenticated/*` - User-specific checkout process
   - Purpose: Logged-in checkout experience with saved information

## Implementation Pattern

For all protected pages, use the following pattern:

```astro
---
// 1. Mark as server-rendered
export const prerender = false;

// 2. Import auth utilities
import { redirectIfNotAuthenticated, getUser } from '../../utils/auth';

// 3. Check authentication and redirect if not authenticated
const redirectResponse = await redirectIfNotAuthenticated(Astro);
if (redirectResponse) return redirectResponse;

// 4. Get user data for the page
const user = await getUser(Astro);
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
3. `redirectIfNotAuthenticated(astro)`: Redirects to login if not authenticated

## Security Considerations

1. Row Level Security (RLS) in Supabase for data protection
2. Server-side session verification for all protected routes
3. HTTP-only cookies for secure session management
4. Separation of anonymous/public key (client-side) from service role key (server-only)

## Testing Authentication

To test the authentication flow:
1. Register a new account at `/auth/register`
2. Confirm email if email verification is enabled
3. Log in at `/auth/login`
4. Try accessing a protected page like `/admin` 