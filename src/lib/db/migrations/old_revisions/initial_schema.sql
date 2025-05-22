-- Drop existing tables if they exist
DROP TABLE IF EXISTS printful_sync_history CASCADE;
DROP TABLE IF EXISTS printful_product_changes CASCADE;
DROP TABLE IF EXISTS printful_category_mapping CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Create tables
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail_url TEXT,
  printful_id INTEGER UNIQUE,
  printful_external_id TEXT,
  printful_synced BOOLEAN DEFAULT false,
  is_ignored BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  category_id UUID REFERENCES categories(id),
  -- New fields for product configuration
  base_price DECIMAL(10, 2),
  donation_amount DECIMAL(10, 2),
  featured BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  retail_price DECIMAL(10,2) NOT NULL,
  options JSONB,
  files JSONB,
  printful_id INTEGER UNIQUE,
  printful_external_id TEXT,
  printful_product_id INTEGER,
  printful_synced BOOLEAN DEFAULT false,
  in_stock BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE printful_category_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printful_category_id INTEGER NOT NULL UNIQUE,
  printful_category_name TEXT NOT NULL,
  atrocitee_category_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE printful_product_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  printful_product_id INTEGER NOT NULL,
  change_type TEXT NOT NULL,
  change_severity TEXT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  sync_history_id UUID,
  status TEXT NOT NULL DEFAULT 'pending_review',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE printful_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  products_synced INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments to explain the fields
COMMENT ON COLUMN products.base_price IS 'Base price of the product, typically the lowest variant price';
COMMENT ON COLUMN products.donation_amount IS 'Fixed donation amount for this product';
COMMENT ON COLUMN products.featured IS 'Whether this product is featured on the homepage';
COMMENT ON COLUMN products.tags IS 'Array of tags associated with this product';
COMMENT ON COLUMN products.metadata IS 'Additional product metadata stored as JSON';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_base_price ON products(base_price);

-- Grant necessary permissions
GRANT ALL ON categories TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON product_variants TO authenticated;
GRANT ALL ON printful_category_mapping TO authenticated;
GRANT ALL ON printful_product_changes TO authenticated;
GRANT ALL ON printful_sync_history TO authenticated;

GRANT ALL ON categories TO service_role;
GRANT ALL ON products TO service_role;
GRANT ALL ON product_variants TO service_role;
GRANT ALL ON printful_category_mapping TO service_role;
GRANT ALL ON printful_product_changes TO service_role;
GRANT ALL ON printful_sync_history TO service_role;

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