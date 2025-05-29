-- Product Database Schema for Atrocitee
-- This file contains product-related tables that can be safely dropped and recreated

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS printful_product_changes CASCADE;
DROP TABLE IF EXISTS printful_sync_history CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_tags CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS backup_status CASCADE;
DROP TABLE IF EXISTS printful_category_mapping CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS charities CASCADE;
DROP TABLE IF EXISTS atrocitee_categories CASCADE;

-- 1. Atrocitee Categories Table (Create this first as it's referenced by printful_category_mapping)
CREATE TABLE atrocitee_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add timestamps trigger for atrocitee_categories
CREATE TRIGGER update_atrocitee_categories_timestamp
BEFORE UPDATE ON atrocitee_categories
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Enable RLS for atrocitee_categories
ALTER TABLE atrocitee_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for atrocitee_categories
CREATE POLICY "Admin full access to atrocitee categories" ON atrocitee_categories
    FOR ALL
    USING (is_admin());

-- Insert initial core categories
INSERT INTO atrocitee_categories (slug, name, description, is_active)
VALUES 
    ('clothing', 'Clothing', 'Apparel and clothing items', true),
    ('accessories', 'Accessories', 'Fashion accessories and add-ons', true),
    ('home-decor', 'Home Decor', 'Home decoration and interior items', true),
    ('stationery', 'Stationery', 'Office and school supplies', true),
    ('art', 'Art', 'Art prints and wall decorations', true),
    ('tech', 'Tech', 'Technology accessories and gadgets', true),
    ('pet', 'Pet', 'Pet-related products and accessories', true),
    ('sports', 'Sports', 'Sports equipment and accessories', true),
    ('outdoor', 'Outdoor', 'Outdoor gear and equipment', true),
    ('beauty', 'Beauty', 'Beauty and personal care products', true),
    ('wellness', 'Wellness', 'Health and wellness products', true),
    ('food', 'Food', 'Food and beverage related items', true),
    ('drinkware', 'Drinkware', 'Cups, mugs, and drink containers', true),
    ('bags', 'Bags', 'Bags, backpacks, and carrying accessories', true),
    ('jewelry', 'Jewelry', 'Jewelry and personal adornments', true),
    ('kids', 'Kids', 'Children''s products and toys', true),
    ('baby', 'Baby', 'Baby products and accessories', true),
    ('holiday', 'Holiday', 'Holiday and seasonal items', true),
    ('gifts', 'Gifts', 'Gift items and special occasions', true),
    ('limited-edition', 'Limited Edition', 'Special and limited edition products', true)
ON CONFLICT (slug) DO UPDATE 
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- 2. Printful Category Mapping Table (Now we can create this as atrocitee_categories exists)
CREATE TABLE printful_category_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  printful_category_id INTEGER NOT NULL UNIQUE,
  printful_category_name TEXT NOT NULL,
  atrocitee_category_id UUID REFERENCES atrocitee_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add timestamps trigger for printful_category_mapping
CREATE TRIGGER update_printful_category_mapping_timestamp
BEFORE UPDATE ON printful_category_mapping
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Enable RLS for printful_category_mapping
ALTER TABLE printful_category_mapping ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for printful_category_mapping
CREATE POLICY "Admin full access to printful category mapping" ON printful_category_mapping
    FOR ALL
    USING (is_admin());

-- 1. Categories Table
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

-- 2. Tags Table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Charities Table
CREATE TABLE charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Printful specific fields
  printful_id INTEGER UNIQUE,
  printful_external_id TEXT,
  printful_synced BOOLEAN DEFAULT FALSE,
  printful_catalog_variant_id INTEGER,
  
  -- Product metadata
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  thumbnail_url TEXT,
  
  -- Atrocitee specific fields
  atrocitee_active BOOLEAN DEFAULT TRUE,
  atrocitee_featured BOOLEAN DEFAULT FALSE,
  atrocitee_metadata JSONB DEFAULT '{}',
  atrocitee_base_price DECIMAL(10,2),
  atrocitee_donation_amount DECIMAL(10,2),
  atrocitee_charity_id UUID REFERENCES charities(id),
  atrocitee_category_id UUID REFERENCES atrocitee_categories(id),
  
  -- Auditing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Product Variants Table
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Printful specific fields
  printful_id INTEGER UNIQUE,
  printful_external_id TEXT,
  printful_product_id INTEGER REFERENCES products(printful_id),
  printful_synced BOOLEAN DEFAULT FALSE,
  printful_catalog_variant_id INTEGER,
  
  -- Variant metadata
  name TEXT NOT NULL,
  sku TEXT,
  retail_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Variant details
  options JSONB DEFAULT '{}',
  files JSONB DEFAULT '{}',
  
  -- Inventory
  in_stock BOOLEAN DEFAULT TRUE,
  stock_level INTEGER,
  
  -- Auditing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Product Tags Junction Table
CREATE TABLE product_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, tag_id)
);

-- 7. Orders Table
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

-- 8. Order Items Table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Backup Status Table
CREATE TABLE backup_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Printful Sync History Table
CREATE TABLE printful_sync_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  products_synced INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. Printful Product Changes Table
CREATE TABLE printful_product_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  printful_product_id INTEGER NOT NULL,
  change_type TEXT NOT NULL,
  change_severity TEXT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  sync_history_id UUID REFERENCES printful_sync_history(id),
  status TEXT NOT NULL DEFAULT 'pending_review',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add timestamps trigger for all tables
CREATE TRIGGER update_categories_timestamp
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_tags_timestamp
BEFORE UPDATE ON tags
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_charities_timestamp
BEFORE UPDATE ON charities
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_products_timestamp
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_product_variants_timestamp
BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_product_tags_timestamp
BEFORE UPDATE ON product_tags
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_orders_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_order_items_timestamp
BEFORE UPDATE ON order_items
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_backup_status_timestamp
BEFORE UPDATE ON backup_status
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_printful_sync_history_timestamp
BEFORE UPDATE ON printful_sync_history
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_printful_product_changes_timestamp
BEFORE UPDATE ON printful_product_changes
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Enable Row Level Security on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE printful_category_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE printful_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE printful_product_changes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for Admin Access

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'role' = 'admin' OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Categories Policies
CREATE POLICY "Admin full access to categories" ON categories
    FOR ALL
    USING (is_admin());

-- Tags Policies
CREATE POLICY "Admin full access to tags" ON tags
    FOR ALL
    USING (is_admin());

-- Charities Policies
CREATE POLICY "Admin full access to charities" ON charities
    FOR ALL
    USING (is_admin());

-- Products Policies
CREATE POLICY "Admin full access to products" ON products
    FOR ALL
    USING (is_admin());

-- Product Variants Policies
CREATE POLICY "Admin full access to product variants" ON product_variants
    FOR ALL
    USING (is_admin());

-- Product Tags Policies
CREATE POLICY "Admin full access to product tags" ON product_tags
    FOR ALL
    USING (is_admin());

-- Orders Policies
CREATE POLICY "Admin full access to orders" ON orders
    FOR ALL
    USING (is_admin());

-- Order Items Policies
CREATE POLICY "Admin full access to order items" ON order_items
    FOR ALL
    USING (is_admin());

-- Backup Status Policies
CREATE POLICY "Admin full access to backup status" ON backup_status
    FOR ALL
    USING (is_admin());

-- Printful Sync History Policies
CREATE POLICY "Admin full access to printful sync history" ON printful_sync_history
    FOR ALL
    USING (is_admin());

-- Printful Product Changes Policies
CREATE POLICY "Admin full access to printful product changes" ON printful_product_changes
    FOR ALL
    USING (is_admin());

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Migration: Remove redundant atrocitee_tags field (2024-03-23)
-- Description: Removes the redundant atrocitee_tags field from the products table
-- as we're using the product_tags table for the many-to-many relationship

-- First, ensure we have a backup of any data in the field
CREATE TABLE IF NOT EXISTS backup_product_tags AS
SELECT id, atrocitee_tags
FROM products
WHERE atrocitee_tags IS NOT NULL;

-- Remove the field from the products table
ALTER TABLE products DROP COLUMN IF EXISTS atrocitee_tags;

-- Add comment to track the change
COMMENT ON TABLE products IS 'Updated 2024-03-23: Removed redundant atrocitee_tags field, using product_tags table instead';

-- Verify the product_tags table has proper constraints
ALTER TABLE product_tags
  ADD CONSTRAINT fk_product_tags_product
  FOREIGN KEY (product_id)
  REFERENCES products(id)
  ON DELETE CASCADE;

ALTER TABLE product_tags
  ADD CONSTRAINT fk_product_tags_tag
  FOREIGN KEY (tag_id)
  REFERENCES tags(id)
  ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id ON product_tags(tag_id);

-- Add RLS policies for product_tags table
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON product_tags
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON product_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON product_tags
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON product_tags
  FOR DELETE
  TO authenticated
  USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_tags_updated_at
  BEFORE UPDATE ON product_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to track the changes
COMMENT ON TABLE product_tags IS 'Updated 2024-03-23: Enhanced with proper constraints, indexes, and RLS policies'; 