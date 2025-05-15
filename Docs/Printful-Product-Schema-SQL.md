# Printful Product Schema - SQL Implementation

This document contains SQL statements for creating database tables related to Printful product synchronization, versioning, and category management.

## Database Tables

### 1. Update to Products Table

```sql
-- Add Printful-specific fields to the existing products table
ALTER TABLE products 
  ADD COLUMN donation_amount DECIMAL(10, 2),
  ADD COLUMN tags TEXT[] DEFAULT '{}',
  ADD COLUMN printful_product_id INTEGER,
  ADD COLUMN printful_sync_product_id INTEGER;
```

### 2. Product Variants Table

```sql
-- Create table for product variants
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  options JSONB NOT NULL DEFAULT '{}', -- e.g., { "size": "M", "color": "Blue" }
  printful_variant_id INTEGER,
  printful_sync_variant_id INTEGER,
  inventory_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security policies
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Everyone can read active variants
CREATE POLICY "Active variants are viewable by everyone" ON product_variants
  FOR SELECT USING (active = true);

-- Admins can read all variants including inactive ones
CREATE POLICY "Admins can read all variants" ON product_variants
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Only admins can modify variants
CREATE POLICY "Admins can insert variants" ON product_variants
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update variants" ON product_variants
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete variants" ON product_variants
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Create timestamp update trigger
CREATE TRIGGER update_product_variants_timestamp
BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
```

### 3. Printful Sync History Table

```sql
-- Create table for tracking synchronization with Printful
CREATE TABLE printful_sync_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'scheduled', 'webhook')),
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  products_synced INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  details JSONB, -- Additional details about the sync operation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security policies
ALTER TABLE printful_sync_history ENABLE ROW LEVEL SECURITY;

-- Only admins can access sync history
CREATE POLICY "Admins can read sync history" ON printful_sync_history
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert sync history" ON printful_sync_history
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update sync history" ON printful_sync_history
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
```

### 4. Printful Product Changes Table

```sql
-- Create table for tracking changes to Printful products
CREATE TABLE printful_product_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  printful_product_id INTEGER NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('price', 'inventory', 'metadata', 'image', 'variant', 'other')),
  change_severity TEXT NOT NULL CHECK (change_severity IN ('critical', 'standard', 'minor')),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  sync_history_id UUID REFERENCES printful_sync_history(id),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'applied')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security policies
ALTER TABLE printful_product_changes ENABLE ROW LEVEL SECURITY;

-- Only admins can access product changes
CREATE POLICY "Admins can read product changes" ON printful_product_changes
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert product changes" ON printful_product_changes
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update product changes" ON printful_product_changes
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
```

### 5. Tags Table

```sql
-- Create table for product tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security policies
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Everyone can read tags
CREATE POLICY "Tags are viewable by everyone" ON tags
  FOR SELECT USING (true);

-- Only admins can modify tags
CREATE POLICY "Admins can insert tags" ON tags
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update tags" ON tags
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete tags" ON tags
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Create timestamp update trigger
CREATE TRIGGER update_tags_timestamp
BEFORE UPDATE ON tags
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
```

### 6. Product-to-Tag Junction Table

```sql
-- Create junction table for product-tag relationships
CREATE TABLE product_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, tag_id)
);

-- Set up Row Level Security policies
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

-- Everyone can read product tags
CREATE POLICY "Product tags are viewable by everyone" ON product_tags
  FOR SELECT USING (true);

-- Only admins can modify product tags
CREATE POLICY "Admins can insert product tags" ON product_tags
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete product tags" ON product_tags
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
```

### 7. Product-to-Category Junction Table

```sql
-- Create junction table for product-category relationships
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, category_id)
);

-- Set up Row Level Security policies
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read product categories
CREATE POLICY "Product categories are viewable by everyone" ON product_categories
  FOR SELECT USING (true);

-- Only admins can modify product categories
CREATE POLICY "Admins can insert product categories" ON product_categories
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update product categories" ON product_categories
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete product categories" ON product_categories
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
```

## Implementation Steps

1. **Execute in Sequence**: Run these SQL statements in the Supabase SQL Editor in the order listed
2. **Verify Tables**: Check that all tables are created correctly
3. **Test Relationships**: Ensure foreign key constraints are working as expected
4. **Update Application**: Update the application code to use these new tables 