-- Printful Sync Products Database Schema
-- This SQL creates or modifies tables required for syncing products from Printful to Atrocitee
-- Run this in the Supabase SQL Editor to implement the schema

-- ========== DROP EXISTING TABLES IF NEEDED ==========
-- Use with caution - this will delete all data in these tables
-- IMPORTANT: Tables are dropped to ensure clean creation with proper permissions
DROP TABLE IF EXISTS printful_product_changes CASCADE;
DROP TABLE IF EXISTS printful_sync_history CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS printful_category_mapping CASCADE;
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
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE categories IS 'Product categories for organizing the store';

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

-- ========== PRODUCTS TABLE ==========
-- This table stores the main product information synced from Printful
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Printful specific fields
  printful_id INTEGER UNIQUE, -- The sync product ID from Printful
  printful_external_id TEXT,  -- Store's external ID in Printful system
  printful_synced BOOLEAN DEFAULT false, -- Whether product is synced with Printful
  is_ignored BOOLEAN DEFAULT false, -- Whether product is ignored in Printful sync
  
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
  
  -- Variant metadata
  name TEXT, -- Variant name (e.g., "Small / Black")
  sku TEXT, -- Stock Keeping Unit
  retail_price DECIMAL(10, 2), -- Price shown to customers
  
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

-- ========== FUNCTIONS ==========
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
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