-- Product Database Schema for Atrocitee
-- This file contains product-related tables that can be safely dropped and recreated

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS printful_mockup_tasks CASCADE;
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

-- Grant schema usage first
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant service role access to all tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

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

-- Drop existing policies
DROP POLICY IF EXISTS "Admin full access to atrocitee categories" ON atrocitee_categories;
DROP POLICY IF EXISTS "Public read access to atrocitee categories" ON atrocitee_categories;
DROP POLICY IF EXISTS "Published categories are viewable by everyone" ON atrocitee_categories;
DROP POLICY IF EXISTS "Authenticated users can view all categories" ON atrocitee_categories;

-- Create RLS policies for atrocitee_categories
CREATE POLICY "Published categories are viewable by everyone"
ON atrocitee_categories
FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Authenticated users can view all categories"
ON atrocitee_categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin users can manage categories"
ON atrocitee_categories
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Grant necessary permissions
GRANT SELECT ON atrocitee_categories TO anon;
GRANT SELECT ON atrocitee_categories TO authenticated;
GRANT ALL ON atrocitee_categories TO authenticated;

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

-- Enable RLS for tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admin users can manage tags" ON tags;
DROP POLICY IF EXISTS "Public can view active tags" ON tags;

-- Create RLS policies for tags
CREATE POLICY "Admin users can manage tags" ON tags
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Public can view active tags" ON tags
  FOR SELECT
  USING (active = true);

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

-- Enable RLS for charities
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Charities are viewable by everyone" ON charities;
DROP POLICY IF EXISTS "Only admins can insert charities" ON charities;
DROP POLICY IF EXISTS "Only admins can update charities" ON charities;
DROP POLICY IF EXISTS "Only admins can delete charities" ON charities;

-- Create RLS policies for charities
CREATE POLICY "Charities are viewable by everyone"
ON charities
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Only admins can insert charities"
ON charities
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update charities"
ON charities
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete charities"
ON charities
FOR DELETE
TO authenticated
USING (is_admin());

-- Create a public view for charities that can be accessed during static site generation
DROP VIEW IF EXISTS public_charities;
CREATE OR REPLACE VIEW public_charities
WITH (security_barrier)
AS
  SELECT 
    id,
    name,
    description,
    website_url,
    logo_url,
    active
  FROM public.charities;

-- Grant access to both authenticated and anonymous users
GRANT SELECT ON public_charities TO authenticated, anon;

-- Add a helpful comment
COMMENT ON VIEW public_charities IS 'Public charity information for display on product pages';

-- 4. Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Printful specific fields
  printful_id BIGINT UNIQUE,
  printful_external_id TEXT,
  printful_synced BOOLEAN DEFAULT FALSE,
  printful_catalog_variant_id BIGINT,
  
  -- Product metadata
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  thumbnail_url TEXT,
  
  -- Atrocitee specific fields
  published_status BOOLEAN DEFAULT FALSE,
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

-- Enable RLS for products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Published products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Authenticated users can view all products" ON products;
DROP POLICY IF EXISTS "Admin users can manage all products" ON products;

-- Create RLS policies for products
CREATE POLICY "Published products are viewable by everyone"
ON products
FOR SELECT
TO public
USING (published_status = true);

CREATE POLICY "Authenticated users can view all products"
ON products
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin users can manage all products"
ON products
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Grant necessary permissions
GRANT SELECT ON products TO anon;
GRANT SELECT ON products TO authenticated;
GRANT ALL ON products TO authenticated;

-- 5. Product Variants Table
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Printful specific fields
  printful_id BIGINT UNIQUE, -- Printful's ID for this specific variant
  printful_external_id TEXT, -- External reference ID used in Printful system
  printful_product_id BIGINT, -- ID of the parent product in Printful's system
  printful_synced BOOLEAN DEFAULT FALSE, -- Whether variant is synced with Printful
  
  -- Variant metadata
  name TEXT NOT NULL,
  sku TEXT,
  retail_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Variant details
  options JSONB DEFAULT '{}',
  files JSONB DEFAULT '{}',
  mockup_settings JSONB DEFAULT '{}',
  
  -- Printful variant properties (extracted for easier querying)
  size TEXT,
  color TEXT,
  availability_status TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Inventory
  in_stock BOOLEAN DEFAULT TRUE,
  stock_level INTEGER,
  
  -- Auditing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_variants_printful_id ON product_variants(printful_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_color ON product_variants(color);
CREATE INDEX IF NOT EXISTS idx_product_variants_size ON product_variants(size);
CREATE INDEX IF NOT EXISTS idx_product_variants_availability ON product_variants(is_available);
CREATE INDEX IF NOT EXISTS idx_product_variants_availability_status ON product_variants(availability_status);

-- Add comment to track the changes
COMMENT ON TABLE product_variants IS 'Updated 2024-05-26: Added mockup_settings, size, color, availability columns for better querying and stock management';
COMMENT ON COLUMN product_variants.mockup_settings IS 'Added 2024-05-26: Stores mockup generation settings like selected views';
COMMENT ON COLUMN product_variants.size IS 'Added 2024-05-26: Extracted from Printful API for easier querying and filtering';
COMMENT ON COLUMN product_variants.color IS 'Added 2024-05-26: Extracted from Printful API for easier querying and filtering';
COMMENT ON COLUMN product_variants.availability_status IS 'Added 2024-05-26: Printful availability status (active, discontinued, out_of_stock, etc.)';
COMMENT ON COLUMN product_variants.is_available IS 'Added 2024-05-26: Boolean flag for quick availability filtering';
COMMENT ON COLUMN product_variants.last_synced_at IS 'Added 2024-05-26: Timestamp of last sync with Printful API';
COMMENT ON COLUMN product_variants.printful_id IS 'Printful''s ID for this specific variant - used in variant_ids field for mockup generation';
COMMENT ON COLUMN product_variants.printful_product_id IS 'ID of the parent product in Printful''s system - used as id field for mockup generation';
COMMENT ON COLUMN product_variants.printful_external_id IS 'External reference ID used in Printful system for external tracking';

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

-- 12. Printful Mockup Tasks Table
CREATE TABLE printful_mockup_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  task_id VARCHAR(255) NOT NULL,
  view_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance with mockup tasks
CREATE INDEX IF NOT EXISTS idx_printful_mockup_tasks_product_variant_id 
  ON printful_mockup_tasks(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_printful_mockup_tasks_task_id 
  ON printful_mockup_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_printful_mockup_tasks_status 
  ON printful_mockup_tasks(status);

-- Add comment to track the changes
COMMENT ON TABLE printful_mockup_tasks IS 'Added 2024-05-25: Table for tracking Printful mockup generation tasks';

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

CREATE TRIGGER update_printful_mockup_tasks_timestamp
BEFORE UPDATE ON printful_mockup_tasks
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Enable RLS for product_variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admin users can manage product variants" ON product_variants;
DROP POLICY IF EXISTS "Public can view variants of published products" ON product_variants;
DROP POLICY IF EXISTS "Published variants are viewable by everyone" ON product_variants;
DROP POLICY IF EXISTS "Authenticated users can view all variants" ON product_variants;

-- Create RLS policies for product_variants
CREATE POLICY "Published variants are viewable by everyone"
ON product_variants
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_variants.product_id
    AND products.published_status = true
  )
);

CREATE POLICY "Authenticated users can view all variants"
ON product_variants
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin users can manage product variants"
ON product_variants
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Grant necessary permissions
GRANT SELECT ON product_variants TO anon;
GRANT SELECT ON product_variants TO authenticated;
GRANT ALL ON product_variants TO authenticated;

-- Enable RLS for printful_sync_history
ALTER TABLE printful_sync_history ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Admin full access to sync history" ON printful_sync_history;

-- Create RLS policies for printful_sync_history
CREATE POLICY "Admin users can manage sync history" ON printful_sync_history
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Enable RLS for printful_product_changes
ALTER TABLE printful_product_changes ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Admin full access to product changes" ON printful_product_changes;

-- Create RLS policies for printful_product_changes
CREATE POLICY "Admin users can manage product changes" ON printful_product_changes
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Enable RLS for printful_mockup_tasks
ALTER TABLE printful_mockup_tasks ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Admin full access to mockup tasks" ON printful_mockup_tasks;

-- Create RLS policies for printful_mockup_tasks
CREATE POLICY "Admin users can manage mockup tasks" ON printful_mockup_tasks
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add comment to track the changes
COMMENT ON TABLE products IS 'Updated 2024-03-25: Renamed atrocitee_active to published_status for better clarity';
COMMENT ON COLUMN products.published_status IS 'Indicates if the product is published (true) or unpublished (false) on the website';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_printful_id ON products(printful_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_published_status ON products(published_status);
CREATE INDEX IF NOT EXISTS idx_products_atrocitee_category_id ON products(atrocitee_category_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- Migration: Remove redundant atrocitee_tags field (2024-03-23)
-- Description: Removes the redundant atrocitee_tags field from the products table
-- as we're using the product_tags table for the many-to-many relationship

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

-- Drop all existing policies first
DROP POLICY IF EXISTS "Enable read access for all users" ON product_tags;
DROP POLICY IF EXISTS "Admin users can insert tags" ON product_tags;
DROP POLICY IF EXISTS "Admin users can update tags" ON product_tags;
DROP POLICY IF EXISTS "Admin users can delete tags" ON product_tags;
DROP POLICY IF EXISTS "Anyone can view active tags" ON tags;
DROP POLICY IF EXISTS "Admin users can manage tags" ON tags;
DROP POLICY IF EXISTS "Public can view all product tags" ON product_tags;
DROP POLICY IF EXISTS "Admin users can manage product tags" ON product_tags;
DROP POLICY IF EXISTS "Public can view all tags" ON tags;
DROP POLICY IF EXISTS "Admin users can select tags" ON tags;
DROP POLICY IF EXISTS "Admin users can insert tags" ON tags;
DROP POLICY IF EXISTS "Admin users can update tags" ON tags;
DROP POLICY IF EXISTS "Admin users can delete tags" ON tags;
DROP POLICY IF EXISTS "Public can view active tags" ON tags;
DROP POLICY IF EXISTS "Anyone can view tags" ON tags;
DROP POLICY IF EXISTS "Admin users can select product_tags" ON product_tags;
DROP POLICY IF EXISTS "Admin users can insert product_tags" ON product_tags;
DROP POLICY IF EXISTS "Admin users can update product_tags" ON product_tags;
DROP POLICY IF EXISTS "Admin users can delete product_tags" ON product_tags;
DROP POLICY IF EXISTS "Public can view product_tags" ON product_tags;
DROP POLICY IF EXISTS "Anyone can view product tags" ON product_tags;

-- Remove any existing RLS
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags DISABLE ROW LEVEL SECURITY;

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

-- Grant base permissions
GRANT ALL ON tags TO authenticated;
GRANT ALL ON product_tags TO authenticated;
GRANT ALL ON tags TO service_role;
GRANT ALL ON product_tags TO service_role;

-- Create policies for tags
CREATE POLICY "Public can view all tags" ON tags
  FOR SELECT
  USING (true);

CREATE POLICY "Admin users can manage tags" ON tags
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create policies for product_tags
CREATE POLICY "Public can view all product tags" ON product_tags
  FOR SELECT
  USING (true);

CREATE POLICY "Admin users can manage product tags" ON product_tags
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant permissions to all tables
GRANT ALL ON atrocitee_categories TO authenticated;
GRANT ALL ON printful_category_mapping TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON tags TO authenticated;
GRANT ALL ON charities TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON product_variants TO authenticated;
GRANT ALL ON product_tags TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON backup_status TO authenticated;
GRANT ALL ON printful_sync_history TO authenticated;
GRANT ALL ON printful_product_changes TO authenticated;
GRANT ALL ON printful_mockup_tasks TO authenticated;

-- Enable RLS for all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories
DROP POLICY IF EXISTS "Admin users can manage categories" ON categories;
DROP POLICY IF EXISTS "Public read access to active categories" ON categories;

CREATE POLICY "Admin users can manage categories" ON categories
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Public read access to active categories" ON categories
  FOR SELECT
  USING (active = true);

-- Create RLS policies for charities
DROP POLICY IF EXISTS "Admin users can manage charities" ON charities;
DROP POLICY IF EXISTS "Public read access to active charities" ON charities;

CREATE POLICY "Admin users can manage charities" ON charities
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Public read access to active charities" ON charities
  FOR SELECT
  USING (active = true);

-- Create RLS policies for orders
DROP POLICY IF EXISTS "Admin users can manage all orders" ON orders;
DROP POLICY IF EXISTS "Users can manage their own orders" ON orders;

CREATE POLICY "Admin users can manage all orders" ON orders
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own orders" ON orders
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create RLS policies for order_items
DROP POLICY IF EXISTS "Admin users can manage all order items" ON order_items;
DROP POLICY IF EXISTS "Users can manage their own order items" ON order_items;

CREATE POLICY "Admin users can manage all order items" ON order_items
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own order items" ON order_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));

-- Create RLS policies for backup_status
DROP POLICY IF EXISTS "Admin users can manage backup status" ON backup_status;

CREATE POLICY "Admin users can manage backup status" ON backup_status
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin()); 