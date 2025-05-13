# Supabase Database Schema Implementation

## Overview

This document outlines the implementation plan for the Atrocitee database schema in Supabase. The schema will support user management, product data, order processing, and charity tracking.

## Database Tables

### 1. profiles

The `profiles` table extends the built-in Supabase Auth `users` table with additional information:

```sql
CREATE TABLE profiles (
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

-- Create a secure view that can be safely exposed
CREATE VIEW public_profiles AS
  SELECT id, display_name, avatar_url, role
  FROM profiles;

-- Set up Row Level Security policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Note: We don't apply RLS policies to views, only to tables
-- The public_profiles view is already secure by only exposing limited fields

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
```

### 2. categories

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Only admins can modify categories
CREATE POLICY "Admins can insert categories" ON categories
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger to update timestamps
CREATE TRIGGER update_categories_timestamp
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
```

### 3. products

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  inventory_count INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  image_urls TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  version_name TEXT,
  version_description TEXT,
  previous_version_id UUID REFERENCES products(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Everyone can read active products
CREATE POLICY "Active products are viewable by everyone" ON products
  FOR SELECT USING (active = true);

-- Admins can read all products including inactive ones
CREATE POLICY "Admins can read all products" ON products
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Only admins can modify products
CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger to update timestamps
CREATE TRIGGER update_products_timestamp
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
```

### 4. charities

```sql
CREATE TABLE charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security policies
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;

-- Everyone can read active charities
CREATE POLICY "Active charities are viewable by everyone" ON charities
  FOR SELECT USING (active = true);

-- Admins can read all charities including inactive ones
CREATE POLICY "Admins can read all charities" ON charities
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Only admins can modify charities
CREATE POLICY "Admins can insert charities" ON charities
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update charities" ON charities
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete charities" ON charities
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger to update timestamps
CREATE TRIGGER update_charities_timestamp
BEFORE UPDATE ON charities
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
```

### 5. orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_address JSON,
  billing_address JSON,
  payment_intent_id TEXT,
  charity_id UUID REFERENCES charities(id),
  charity_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all orders
CREATE POLICY "Admins can read all orders" ON orders
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can update orders
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger to update timestamps
CREATE TRIGGER update_orders_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
```

### 6. order_items

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security policies
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can read their own order items
CREATE POLICY "Users can read own order items" ON order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

-- Admins can read all order items
CREATE POLICY "Admins can read all order items" ON order_items
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can modify order items
CREATE POLICY "Admins can insert order items" ON order_items
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update order items" ON order_items
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete order items" ON order_items
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
```

## Utility Functions

For proper role-based access control, the following utility functions need to be implemented:

```sql
-- Create a security definer function to check admin status
-- This bypasses RLS and allows middleware to check roles without permission issues
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This function is used by the application middleware to check if a user is an admin. The `SECURITY DEFINER` attribute ensures it runs with the privileges of the user who created it (postgres), bypassing Row Level Security. This solves the circular dependency problem of needing admin privileges to check if a user is an admin.

## Implementation Steps

1. **Connect to Supabase SQL Editor**:
   - Open the Supabase dashboard
   - Navigate to the SQL Editor
   - Create a new query

2. **Run the Schema Creation SQL**:
   - Execute the `update_modified_column()` function first
   - Then execute the SQL statements for each table sequentially
   - Verify that tables, triggers, and RLS policies are created correctly
   - Note that RLS policies should not be applied to views - only to tables

3. **Configure Supabase Authentication**:
   - Ensure that the authentication settings are configured correctly
   - Set up email templates for authentication flows

4. **Create Admin User**:
   - Register a new user through the application
   - Use the SQL Editor to update the user's role to 'admin':
     ```sql
     UPDATE profiles
     SET role = 'admin'
     WHERE id = '[user_id]';
     ```

## Database Backups

Supabase provides automatic daily backups for all projects. For additional backup security:

1. **Schedule Regular Exports**:
   - Use Supabase's database export feature to download regular backups
   - Store these backups in a secure off-site location

2. **Configure Retention Policy**:
   - Determine how long backups should be retained based on business requirements
   - Implement a rotation system for backup files

## Common Issues and Troubleshooting

1. **"Public_profiles is not a table" Error**:
   - This occurs when trying to apply RLS policies to a view
   - Remember that RLS policies can only be applied to tables, not to views
   - The security of views is inherited from the underlying tables

2. **Dropping Tables with Dependencies**:
   - When needing to drop tables with dependencies, use the CASCADE option:
     ```sql
     DROP TABLE table_name CASCADE;
     ```
   - This will automatically drop all dependent objects

3. **Permission Denied for Table Profiles**:
   - This happens when checking admin status directly from the profiles table
   - RLS policies prevent access to the profiles table before admin status is determined
   - Use the `is_admin` security definer function instead of direct table queries
   - This bypasses RLS for this specific security check

## Next Steps

After implementing the database schema:

1. Update the application to use the new schema
2. Implement functionality to manage products, categories, and charities
3. Create an admin dashboard that leverages the admin role permissions
4. Test the RLS policies to ensure proper data access control 