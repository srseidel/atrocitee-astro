-- Printful Sync Products Database Schema
-- This SQL creates or modifies tables required for syncing products from Printful to Atrocitee
-- Run this in the Supabase SQL Editor to implement the schema

-- ========== DROP EXISTING TABLES IF NEEDED ==========
-- Use with caution - this will delete all data in these tables
-- IMPORTANT: Tables are dropped to ensure clean creation with proper permissions
DROP TABLE IF EXISTS printful_sync_history CASCADE;
DROP TABLE IF EXISTS printful_product_changes CASCADE;
DROP TABLE IF EXISTS printful_category_mapping CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DISABLE RLS on all tables to troubleshoot permission issues
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS printful_sync_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS printful_product_changes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS printful_category_mapping DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_tags DISABLE ROW LEVEL SECURITY;

-- ========== CATEGORIES TABLE ==========
-- This table stores product categories (needed for category mapping)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Product categories for organizing the store';

-- ========== PRINTFUL CATEGORY MAPPING TABLE ==========
-- This table maps Printful categories to Atrocitee categories
CREATE TABLE IF NOT EXISTS printful_category_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Printful category information
  printful_category_id INTEGER NOT NULL,
  printful_category_name TEXT NOT NULL,
  
  -- Mapping to Atrocitee category
  atrocitee_category_id UUID REFERENCES categories(id),
  
  -- Status flags
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Auditing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE printful_category_mapping IS 'Maps Printful categories to Atrocitee categories for product synchronization';

-- ========== PRODUCTS TABLE ==========
-- This table stores the main product information synced from Printful
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Printful specific fields
  printful_id INTEGER UNIQUE,
  printful_external_id TEXT,
  printful_synced BOOLEAN DEFAULT FALSE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  thumbnail_url TEXT,
  
  -- Atrocitee specific fields
  atrocitee_active BOOLEAN DEFAULT TRUE,
  atrocitee_featured BOOLEAN DEFAULT FALSE,
  atrocitee_tags TEXT[] DEFAULT '{}',
  atrocitee_metadata JSONB DEFAULT '{}',
  atrocitee_base_price DECIMAL(10,2),
  atrocitee_donation_amount DECIMAL(10,2),
  
  -- Auditing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Products synced from Printful with Atrocitee custom fields';

-- ========== PRODUCT VARIANTS TABLE ==========
-- This table stores variant information for each product (sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Printful specific fields
  printful_id INTEGER UNIQUE,
  printful_external_id TEXT,
  printful_product_id INTEGER REFERENCES products(printful_id),
  printful_synced BOOLEAN DEFAULT FALSE,
  
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

COMMENT ON TABLE product_variants IS 'Product variants synced from Printful';

-- ========== PRINTFUL SYNC HISTORY TABLE ==========
-- This table tracks sync operations between Printful and our system
CREATE TABLE IF NOT EXISTS printful_sync_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Sync metadata
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  
  -- Sync statistics
  products_synced INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  
  -- Timing information
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE printful_sync_history IS 'Records of product synchronization operations with Printful';

-- ========== PRINTFUL PRODUCT CHANGES TABLE ==========
-- This table tracks changes detected during product synchronization
CREATE TABLE IF NOT EXISTS printful_product_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  product_id UUID REFERENCES products(id),
  
  -- Change details
  change_type TEXT NOT NULL,
  change_severity TEXT NOT NULL,
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  
  -- Change status
  status TEXT DEFAULT 'pending_review',
  
  -- Review information
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Auditing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE printful_product_changes IS 'Tracks changes to products detected during Printful synchronization';

-- ========== INDEXES ==========
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_printful_id ON products(printful_id);
CREATE INDEX IF NOT EXISTS idx_products_printful_external_id ON products(printful_external_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_printful_id ON product_variants(printful_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_printful_product_id ON product_variants(printful_product_id);
CREATE INDEX IF NOT EXISTS idx_printful_sync_history_sync_type ON printful_sync_history(sync_type);
CREATE INDEX IF NOT EXISTS idx_printful_sync_history_status ON printful_sync_history(status);
CREATE INDEX IF NOT EXISTS idx_printful_product_changes_status ON printful_product_changes(status);
CREATE INDEX IF NOT EXISTS idx_printful_product_changes_product_id ON printful_product_changes(product_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_printful_category_mapping_printful_id ON printful_category_mapping(printful_category_id);

-- ========== FUNCTIONS ==========
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to check if a table exists (for troubleshooting)
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

-- ========== GRANT PERMISSIONS ==========
-- Grant full permissions to authenticated users for all tables
GRANT ALL ON products TO authenticated;
GRANT ALL ON product_variants TO authenticated; 
GRANT ALL ON printful_sync_history TO authenticated;
GRANT ALL ON printful_product_changes TO authenticated;
GRANT ALL ON printful_category_mapping TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON tags TO authenticated;
GRANT ALL ON product_tags TO authenticated;

-- Make sure sequences are also granted
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant public schema access
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant execution permission on functions
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION check_table_exists(text) TO authenticated;

-- ========== NOTES ==========
-- 1. This schema supports the Printful sync products workflow
-- 2. Fields match the Printful API getSyncProducts response
-- 3. Added Atrocitee-specific fields for categories, charities, and tags
-- 4. RLS policies have been DISABLED for troubleshooting
-- 5. Added triggers to maintain updated_at timestamps
-- 6. Created indexes for performance optimization
-- 7. Explicitly dropped tables to ensure clean recreation
-- 8. Added comprehensive GRANT statements to fix permission issues

-- Insert default categories to get started (only if not already present)
INSERT INTO categories (name, slug, description, active)
VALUES 
  ('T-Shirts', 't-shirts', 'All styles of t-shirts and tops', true),
  ('Hoodies', 'hoodies', 'Sweatshirts, hoodies, and other warm tops', true),
  ('Hats', 'hats', 'Caps, beanies, and other headwear', true),
  ('Stickers', 'stickers', 'Stickers and decals', true),
  ('Accessories', 'accessories', 'Various accessories and other items', true)
ON CONFLICT (slug) DO NOTHING; 

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE printful_category_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE printful_product_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE printful_sync_history ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to manage categories"
ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage products"
ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage product variants"
ON product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage category mappings"
ON printful_category_mapping FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage product changes"
ON printful_product_changes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage sync history"
ON printful_sync_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create policies for service role
CREATE POLICY "Allow service role to manage categories"
ON categories FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role to manage products"
ON products FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role to manage product variants"
ON product_variants FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role to manage category mappings"
ON printful_category_mapping FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role to manage product changes"
ON printful_product_changes FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role to manage sync history"
ON printful_sync_history FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for products table
CREATE POLICY "Admins can read all products" ON products
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 