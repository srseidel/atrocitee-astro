-- Printful Sync Products Database Schema (Merged Version)
-- This SQL first drops any conflicting tables, then creates the schema for syncing products from Printful to Atrocitee
-- Run this in the Supabase SQL Editor to implement the schema

-- ========== DROP EXISTING TABLES IF NEEDED ==========
-- Use with caution - this will delete all data in these tables
-- Comment out any tables you want to preserve

-- Drop dependent tables first to avoid foreign key constraint issues
DROP TABLE IF EXISTS printful_product_changes CASCADE;
DROP TABLE IF EXISTS printful_sync_history CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS printful_category_mapping CASCADE;
DROP TABLE IF EXISTS product_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== CATEGORIES TABLE ==========
-- This table stores product categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE categories IS 'Product categories for organizing the store';

-- ========== TAGS TABLE ==========
-- This table stores product tags for more granular filtering
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE tags IS 'Product tags for detailed filtering and organization';

-- Make sure RLS is enabled
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS printful_category_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_tags ENABLE ROW LEVEL SECURITY;

-- ========== PRODUCTS TABLE ==========
-- This table stores the main product information synced from Printful
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Printful specific fields
  printful_id INTEGER UNIQUE, -- The sync product ID from Printful
  printful_external_id TEXT,  -- Store's external ID in Printful system
  printful_synced BOOLEAN DEFAULT false, -- Whether product is synced with Printful
  is_ignored BOOLEAN DEFAULT false, -- Whether product is ignored in Printful sync
  printful_catalog_variant_id INTEGER, -- Printful template/catalog ID
  
  -- Product metadata
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE, -- URL-friendly version of name
  thumbnail_url TEXT, -- Main product image URL
  
  -- Atrocitee specific fields
  category_id UUID REFERENCES categories(id), -- Link to category
  default_charity_id UUID, -- Reference to default charity (add foreign key if table exists)
  tags JSONB, -- Store tags as JSON array
  
  -- Status and visibility
  active BOOLEAN DEFAULT true, -- Whether product is visible on site
  featured BOOLEAN DEFAULT false, -- Whether product is featured
  
  -- Auditing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE products IS 'Products synced from Printful with Atrocitee custom fields';

-- ========== PRODUCT_TAGS JUNCTION TABLE ==========
-- This table links products to tags (many-to-many relationship)
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, tag_id)
);

COMMENT ON TABLE product_tags IS 'Junction table linking products and tags';

-- ========== PRINTFUL CATEGORY MAPPING TABLE ==========
-- This table maps Printful categories to Atrocitee categories
CREATE TABLE IF NOT EXISTS printful_category_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Printful category information
  printful_category_id INTEGER NOT NULL, -- Printful's category ID
  printful_category_name TEXT NOT NULL, -- Printful's category name
  
  -- Mapping to Atrocitee category
  atrocitee_category_id UUID REFERENCES categories(id), -- Link to Atrocitee category
  
  -- Status flags
  is_active BOOLEAN DEFAULT true, -- Whether this mapping is active
  
  -- Auditing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  UNIQUE(printful_category_id)
);

COMMENT ON TABLE printful_category_mapping IS 'Maps Printful categories to Atrocitee categories for product synchronization';

-- ========== PRODUCT VARIANTS TABLE ==========
-- This table stores variant information for each product (sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Printful specific fields
  printful_id INTEGER UNIQUE, -- The sync variant ID from Printful
  printful_external_id TEXT, -- Store's external variant ID in Printful system
  printful_product_id INTEGER, -- Reference to parent Printful product
  printful_synced BOOLEAN DEFAULT false, -- Whether variant is synced with Printful
  printful_catalog_variant_id INTEGER, -- Reference to Printful catalog variant
  
  -- Variant metadata
  name TEXT, -- Variant name (e.g., "Small / Black")
  sku TEXT, -- Stock Keeping Unit
  retail_price DECIMAL(10, 2), -- Price shown to customers
  currency TEXT DEFAULT 'USD', -- Currency code
  
  -- Variant details
  options JSONB, -- Variant attributes (size, color, etc.) as JSON
  files JSONB, -- Print files information as JSON
  
  -- Inventory
  in_stock BOOLEAN DEFAULT true,
  stock_level INTEGER,
  
  -- Auditing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE product_variants IS 'Product variants synced from Printful';

-- ========== PRINTFUL SYNC HISTORY TABLE ==========
-- This table tracks sync operations between Printful and our system
CREATE TABLE IF NOT EXISTS printful_sync_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Sync metadata
  sync_type TEXT NOT NULL, -- Type of sync (manual, scheduled, webhook, etc.)
  status TEXT NOT NULL, -- Status of sync operation (success, partial, failed)
  message TEXT, -- Informational or error message
  
  -- Sync statistics
  products_synced INTEGER DEFAULT 0, -- Number of products successfully synced
  products_failed INTEGER DEFAULT 0, -- Number of products that failed to sync
  
  -- Timing information
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Auditing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE printful_sync_history IS 'Records of product synchronization operations with Printful';

-- ========== PRINTFUL PRODUCT CHANGES TABLE ==========
-- This table tracks changes detected during product synchronization
CREATE TABLE IF NOT EXISTS printful_product_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Printful references
  printful_product_id INTEGER,
  
  -- Change details
  change_type TEXT NOT NULL, -- Type of change (price, inventory, metadata, etc.)
  change_severity TEXT NOT NULL, -- Importance of change (critical, standard, minor)
  field_name TEXT NOT NULL, -- Name of the field that changed
  old_value TEXT, -- Previous value
  new_value TEXT, -- New value
  
  -- Change status
  status TEXT NOT NULL, -- Status (pending_review, approved, rejected)
  
  -- Review information
  sync_history_id UUID REFERENCES printful_sync_history(id),
  reviewed_by UUID, -- User who reviewed the change
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Auditing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE printful_product_changes IS 'Tracks changes to products detected during Printful synchronization';

-- ========== INDEXES ==========
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_printful_id ON products(printful_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_printful_id ON product_variants(printful_id);

CREATE INDEX IF NOT EXISTS idx_printful_product_changes_product_id ON printful_product_changes(product_id);
CREATE INDEX IF NOT EXISTS idx_printful_product_changes_status ON printful_product_changes(status);

CREATE INDEX IF NOT EXISTS idx_printful_category_mapping_printful_id ON printful_category_mapping(printful_category_id);
CREATE INDEX IF NOT EXISTS idx_printful_category_mapping_atrocitee_id ON printful_category_mapping(atrocitee_category_id);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_active ON tags(active);

CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id ON product_tags(tag_id);

-- ========== FUNCTIONS ==========
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========== TRIGGERS ==========
-- Add triggers to update the updated_at column when records are modified
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_printful_sync_history_updated_at ON printful_sync_history;
CREATE TRIGGER update_printful_sync_history_updated_at
BEFORE UPDATE ON printful_sync_history
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_printful_product_changes_updated_at ON printful_product_changes;
CREATE TRIGGER update_printful_product_changes_updated_at
BEFORE UPDATE ON printful_product_changes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_printful_category_mapping_updated_at ON printful_category_mapping;
CREATE TRIGGER update_printful_category_mapping_updated_at
BEFORE UPDATE ON printful_category_mapping
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON tags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_tags_updated_at ON product_tags;
CREATE TRIGGER update_product_tags_updated_at
BEFORE UPDATE ON product_tags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ========== SAMPLE ROW LEVEL SECURITY POLICIES ==========
-- These are example RLS policies - customize as needed

-- Products table policy: only allow viewing active products for regular users
DROP POLICY IF EXISTS "Public users can view active products" ON products;
CREATE POLICY "Public users can view active products" 
  ON products FOR SELECT 
  USING (active = true);

-- Products table policy: allow admins full access
DROP POLICY IF EXISTS "Admin users have full access to products" ON products;
CREATE POLICY "Admin users have full access to products" 
  ON products
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Product variants table policy: only allow viewing variants of active products for regular users
DROP POLICY IF EXISTS "Public users can view variants of active products" ON product_variants;
CREATE POLICY "Public users can view variants of active products" 
  ON product_variants FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_variants.product_id AND active = true
    )
  );

-- Product variants table policy: allow admins full access
DROP POLICY IF EXISTS "Admin users have full access to product variants" ON product_variants;
CREATE POLICY "Admin users have full access to product variants" 
  ON product_variants
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Category mapping table policy: allow admins full access
DROP POLICY IF EXISTS "Admin users have full access to category mapping" ON printful_category_mapping;
CREATE POLICY "Admin users have full access to category mapping" 
  ON printful_category_mapping
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Category mapping table policy: allow public read access
DROP POLICY IF EXISTS "Public users can view category mappings" ON printful_category_mapping;
CREATE POLICY "Public users can view category mappings" 
  ON printful_category_mapping FOR SELECT 
  USING (is_active = true);

-- Add RLS policies for printful_sync_history table
DROP POLICY IF EXISTS "Admin users have full access to sync history" ON printful_sync_history;
CREATE POLICY "Admin users have full access to sync history" 
  ON printful_sync_history
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Add a function to check if a table exists
DROP FUNCTION IF EXISTS check_table_exists(text);
CREATE OR REPLACE FUNCTION check_table_exists(table_name_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = table_name_param
  ) INTO table_exists;
  
  RETURN jsonb_build_object('exists', table_exists);
END;
$$;

-- Grant RLS permissions to authenticated users
ALTER TABLE IF EXISTS printful_sync_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON printful_sync_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON printful_product_changes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON printful_category_mapping TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_variants TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant all on the public schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Fix the reviewer field in printful_product_changes to use UUID instead of foreign key
-- (since profiles table appears to be missing or the relationship isn't set correctly)
ALTER TABLE IF EXISTS printful_product_changes 
  DROP COLUMN IF EXISTS reviewer_id;

-- Add reviewer_id column as UUID without foreign key constraint
ALTER TABLE IF EXISTS printful_product_changes 
  ADD COLUMN IF NOT EXISTS reviewer_id UUID;

-- Categories table policy: public read access for active categories
DROP POLICY IF EXISTS "Public users can view active categories" ON categories;
CREATE POLICY "Public users can view active categories" 
  ON categories FOR SELECT 
  USING (active = true);

-- Categories table policy: admin full access
DROP POLICY IF EXISTS "Admin users have full access to categories" ON categories;
CREATE POLICY "Admin users have full access to categories" 
  ON categories
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Tags table policy: public read access for active tags
DROP POLICY IF EXISTS "Public users can view active tags" ON tags;
CREATE POLICY "Public users can view active tags" 
  ON tags FOR SELECT 
  USING (active = true);

-- Tags table policy: admin full access
DROP POLICY IF EXISTS "Admin users have full access to tags" ON tags;
CREATE POLICY "Admin users have full access to tags" 
  ON tags
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Product tags table policy: public read access
DROP POLICY IF EXISTS "Public users can view product tags" ON product_tags;
CREATE POLICY "Public users can view product tags" 
  ON product_tags FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_tags.product_id AND active = true
    )
  );

-- Product tags table policy: admin full access
DROP POLICY IF EXISTS "Admin users have full access to product tags" ON product_tags;
CREATE POLICY "Admin users have full access to product tags" 
  ON product_tags
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ========== NOTES ==========
-- 1. This schema supports the Printful sync products workflow
-- 2. Fields match the Printful API getSyncProducts response
-- 3. Added Atrocitee-specific fields for categories, charities, and tags
-- 4. Added a category mapping table to link Printful categories to Atrocitee categories
-- 5. Included RLS policies for security
-- 6. Added triggers to maintain updated_at timestamps
-- 7. Created indexes for performance optimization
--
-- IMPORTANT: Before running this in production, make sure to backup any existing data!

-- ========== INSERT INITIAL CATEGORIES ==========
-- Insert basic product categories
INSERT INTO categories (name, slug, description, active)
VALUES 
  ('T-Shirts', 't-shirts', 'All styles of t-shirts and tops', true),
  ('Hoodies', 'hoodies', 'Sweatshirts, hoodies, and other warm tops', true),
  ('Hats', 'hats', 'Caps, beanies, and other headwear', true),
  ('Stickers', 'stickers', 'Stickers and decals', true),
  ('Accessories', 'accessories', 'Various accessories and other items', true)
ON CONFLICT (slug) DO NOTHING;

-- ========== INSERT INITIAL TAGS ==========
-- Insert common tags for political merchandise
INSERT INTO tags (name, slug, description, active)
VALUES
  ('Political', 'political', 'Politically-themed merchandise', true),
  ('Environmental', 'environmental', 'Products related to environmental causes', true),
  ('Social Justice', 'social-justice', 'Merchandise supporting social justice causes', true),
  ('Activism', 'activism', 'Products for activists and political engagement', true),
  ('Human Rights', 'human-rights', 'Merchandise focused on human rights issues', true),
  ('Progressive', 'progressive', 'Products with progressive political messages', true),
  ('Conservative', 'conservative', 'Products with conservative political messages', true),
  ('Current Events', 'current-events', 'Products related to recent news and events', true),
  ('Trending', 'trending', 'Currently popular and trending designs', true),
  ('Limited Edition', 'limited-edition', 'Limited time or limited quantity products', true)
ON CONFLICT (slug) DO NOTHING;

-- Create a security definer function to check admin status
-- This bypasses RLS and allows middleware to check roles without permission issues
DROP FUNCTION IF EXISTS is_admin(UUID);
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role = 'admin';
EXCEPTION
  WHEN OTHERS THEN
    -- Default to false for any errors
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the function can be called by authenticated users
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated; 