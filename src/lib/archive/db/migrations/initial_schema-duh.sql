-- Drop existing tables if they exist
DROP TABLE IF EXISTS printful_sync_history CASCADE;
DROP TABLE IF EXISTS printful_product_changes CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Printful specific fields
  printful_id INTEGER UNIQUE,
  printful_external_id TEXT,
  printful_synced BOOLEAN DEFAULT FALSE,
  
  -- Product metadata
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

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
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

CREATE TABLE printful_product_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  change_type TEXT NOT NULL,
  change_severity TEXT NOT NULL,
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  status TEXT DEFAULT 'pending_review',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE printful_sync_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  products_synced INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_printful_id ON products(printful_id);
CREATE INDEX IF NOT EXISTS idx_products_printful_external_id ON products(printful_external_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_printful_id ON product_variants(printful_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_printful_product_id ON product_variants(printful_product_id);
CREATE INDEX IF NOT EXISTS idx_printful_sync_history_sync_type ON printful_sync_history(sync_type);
CREATE INDEX IF NOT EXISTS idx_printful_sync_history_status ON printful_sync_history(status);
CREATE INDEX IF NOT EXISTS idx_printful_product_changes_status ON printful_product_changes(status);
CREATE INDEX IF NOT EXISTS idx_printful_product_changes_product_id ON printful_product_changes(product_id);

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE printful_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE printful_product_changes ENABLE ROW LEVEL SECURITY;

-- Create policies for products table
CREATE POLICY "Admins can read all products" ON products
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for product variants
CREATE POLICY "Admins can read all variants" ON product_variants
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert variants" ON product_variants
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update variants" ON product_variants
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete variants" ON product_variants
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for sync history
CREATE POLICY "Admins can read all sync history" ON printful_sync_history
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert sync history" ON printful_sync_history
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create policies for product changes
CREATE POLICY "Admins can read all product changes" ON printful_product_changes
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert product changes" ON printful_product_changes
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update product changes" ON printful_product_changes
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON products TO authenticated;
GRANT ALL ON product_variants TO authenticated;
GRANT ALL ON printful_product_changes TO authenticated;
GRANT ALL ON printful_sync_history TO authenticated;

GRANT ALL ON products TO service_role;
GRANT ALL ON product_variants TO service_role;
GRANT ALL ON printful_product_changes TO service_role;
GRANT ALL ON printful_sync_history TO service_role;

-- Function to check user roles
CREATE OR REPLACE FUNCTION check_user_role(user_email TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.raw_user_meta_data->>'role' as role,
        u.raw_user_meta_data as metadata
    FROM auth.users u
    WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user role to admin
CREATE OR REPLACE FUNCTION update_user_to_admin(user_email TEXT)
RETURNS void AS $$
BEGIN
    UPDATE auth.users 
    SET raw_user_meta_data = 
        CASE 
            WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
            ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
        END
    WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage:
-- SELECT * FROM check_user_role('your-email@example.com');
-- SELECT update_user_to_admin('your-email@example.com'); 