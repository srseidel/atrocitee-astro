# Admin Role Implementation

## Overview

This document outlines the plan for implementing the admin role functionality in the Atrocitee application. The admin role will provide privileged users with the ability to manage products, categories, charities, and user accounts.

## Prerequisites

Before implementing the admin role, the following must be completed:

1. Database schema implementation as outlined in `Supabase-Schema-Implementation.md`
2. Authentication system with the `@supabase/ssr` package
3. Profiles table with a `role` field to distinguish between regular users and admins

## Implementation Steps

### 1. Create Admin Middleware

First, create a middleware function to verify admin access:

```typescript
// src/utils/admin-middleware.ts
import { createServerSupabaseClient } from '@/lib/supabase';
import type { AstroGlobal } from 'astro';

export async function isAdmin(Astro: AstroGlobal): Promise<boolean> {
  const supabase = createServerSupabaseClient({ cookies: Astro.cookies });
  const { data } = await supabase.auth.getSession();
  
  if (!data.session) {
    return false;
  }
  
  // Fetch the user's profile to check the role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.session.user.id)
    .single();
    
  return profile?.role === 'admin';
}
```

### 2. Create Admin Layout

Create an admin layout for consistent admin page styling:

```astro
<!-- src/layouts/AdminLayout.astro -->
---
import { isAdmin } from '@/utils/admin-middleware';

// Redirect non-admin users
if (!await isAdmin(Astro)) {
  return Astro.redirect('/auth/login?error=unauthorized');
}

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - Admin | Atrocitee</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  </head>
  <body>
    <div class="min-h-screen bg-gray-100">
      <aside class="fixed inset-y-0 left-0 w-64 bg-gray-800 text-white">
        <div class="p-4">
          <h1 class="text-xl font-bold">Atrocitee Admin</h1>
        </div>
        <nav class="mt-8">
          <ul>
            <li>
              <a href="/admin" class="block px-4 py-2 hover:bg-gray-700">Dashboard</a>
            </li>
            <li>
              <a href="/admin/products" class="block px-4 py-2 hover:bg-gray-700">Products</a>
            </li>
            <li>
              <a href="/admin/categories" class="block px-4 py-2 hover:bg-gray-700">Categories</a>
            </li>
            <li>
              <a href="/admin/charities" class="block px-4 py-2 hover:bg-gray-700">Charities</a>
            </li>
            <li>
              <a href="/admin/orders" class="block px-4 py-2 hover:bg-gray-700">Orders</a>
            </li>
            <li>
              <a href="/admin/users" class="block px-4 py-2 hover:bg-gray-700">Users</a>
            </li>
          </ul>
        </nav>
      </aside>
      <main class="ml-64 p-8">
        <h1 class="text-2xl font-bold mb-6">{title}</h1>
        <slot />
      </main>
    </div>
  </body>
</html>
```

### 3. Create Admin Dashboard Page

```astro
<!-- src/pages/admin/index.astro -->
---
import AdminLayout from '@/layouts/AdminLayout.astro';
import { createServerSupabaseClient } from '@/lib/supabase';

const supabase = createServerSupabaseClient({ cookies: Astro.cookies });

// Fetch summary statistics
const { data: productsCount } = await supabase
  .from('products')
  .select('id', { count: 'exact', head: true });

const { data: ordersCount } = await supabase
  .from('orders')
  .select('id', { count: 'exact', head: true });

const { data: usersCount } = await supabase
  .from('profiles')
  .select('id', { count: 'exact', head: true });

// Fetch recent orders
const { data: recentOrders } = await supabase
  .from('orders')
  .select('id, created_at, status, total_amount, profiles(display_name)')
  .order('created_at', { ascending: false })
  .limit(5);
---

<AdminLayout title="Dashboard">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <!-- Summary Cards -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h3 class="text-gray-500 text-sm font-medium">Products</h3>
      <p class="text-3xl font-bold">{productsCount?.count || 0}</p>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow">
      <h3 class="text-gray-500 text-sm font-medium">Orders</h3>
      <p class="text-3xl font-bold">{ordersCount?.count || 0}</p>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow">
      <h3 class="text-gray-500 text-sm font-medium">Users</h3>
      <p class="text-3xl font-bold">{usersCount?.count || 0}</p>
    </div>
  </div>
  
  <!-- Recent Orders -->
  <div class="bg-white p-6 rounded-lg shadow">
    <h2 class="text-xl font-semibold mb-4">Recent Orders</h2>
    
    <table class="min-w-full">
      <thead>
        <tr>
          <th class="text-left py-2">Order ID</th>
          <th class="text-left py-2">Customer</th>
          <th class="text-left py-2">Date</th>
          <th class="text-left py-2">Status</th>
          <th class="text-left py-2">Amount</th>
        </tr>
      </thead>
      <tbody>
        {recentOrders?.map((order) => (
          <tr class="border-t border-gray-200">
            <td class="py-2">{order.id.slice(0, 8)}</td>
            <td class="py-2">{order.profiles?.display_name || 'Unknown'}</td>
            <td class="py-2">{new Date(order.created_at).toLocaleDateString()}</td>
            <td class="py-2">
              <span class={`inline-block px-2 py-1 rounded text-xs ${
                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status}
              </span>
            </td>
            <td class="py-2">${order.total_amount.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</AdminLayout>
```

### 4. Create CRUD Pages for Admin Resources

Create the following admin pages:

1. Products Management
   - List products
   - Create/edit product form
   - Delete product functionality

2. Categories Management
   - List categories
   - Create/edit category form
   - Delete category functionality

3. Charities Management
   - List charities
   - Create/edit charity form
   - Delete charity functionality

4. Users Management
   - List users
   - Edit user details
   - Change user role

### 5. Create Admin API Endpoints

Since Astro doesn't natively support server-side form handling in component files, create API endpoints for data operations:

```typescript
// src/pages/api/admin/products.ts
import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isAdmin } from '@/utils/admin-middleware';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Check admin authorization
  const isUserAdmin = await isAdmin({ cookies } as any);
  if (!isUserAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const supabase = createServerSupabaseClient({ cookies });
  const formData = await request.formData();
  
  // Process product creation/update
  const product = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
    price: parseFloat(formData.get('price') as string),
    category_id: formData.get('category_id') as string,
    // other fields...
  };
  
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();
    
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return redirect('/admin/products');
};
```

### 6. Update Navigation to Include Admin Links

Update the main navigation component to include admin links for admin users:

```astro
<!-- src/components/layout/Header.astro -->
---
import { createServerSupabaseClient } from '@/lib/supabase';

const supabase = createServerSupabaseClient({ cookies: Astro.cookies });
const { data } = await supabase.auth.getSession();

let isUserAdmin = false;
if (data.session) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.session.user.id)
    .single();
    
  isUserAdmin = profile?.role === 'admin';
}
---

<header>
  <!-- Existing header code -->
  
  {data.session && (
    <div class="relative group">
      <button class="flex items-center">
        Account <span class="ml-1">▼</span>
      </button>
      <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block">
        {isUserAdmin && (
          <a href="/admin" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Admin Dashboard
          </a>
        )}
        <a href="/account" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          My Account
        </a>
        <a href="/auth/logout" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          Logout
        </a>
      </div>
    </div>
  )}
</header>
```

### 7. Create an Admin User

To create the first admin user:

1. Register a normal user through the application
2. Use the Supabase SQL Editor to update the user's role:

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = '[user_id]';
```

### 8. Test Admin Functionality

Verify that:

1. Regular users cannot access the admin section
2. Admin users can access all admin functionality
3. CRUD operations for managed resources work correctly
4. Row Level Security policies properly enforce permissions

## Extra Security Considerations

1. **JWT Validation**:
   - Implement JWT claim validation in admin middleware to ensure roles cannot be spoofed

2. **Rate Limiting**:
   - Add rate limiting to admin APIs to prevent brute force attacks

3. **Audit Logging**:
   - Implement audit logs for all admin actions to track changes

## Next Steps

After implementing the admin role:

1. Enhance the admin dashboard with more analytics
2. Add bulk operations for managing multiple items at once
3. Implement advanced filtering and searching in admin lists
4. Create detailed reporting functionality
5. Add image upload capabilities for products and categories 