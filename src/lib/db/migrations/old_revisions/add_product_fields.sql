-- Add new fields to products table
ALTER TABLE products
  -- Add base price field
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2),
  -- Add donation amount field
  ADD COLUMN IF NOT EXISTS donation_amount DECIMAL(10, 2),
  -- Add featured flag
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
  -- Add tags as JSONB array
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  -- Add metadata field for additional product data
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update existing products to set base_price from their variants
UPDATE products p
SET base_price = (
  SELECT MIN(retail_price)
  FROM product_variants
  WHERE product_id = p.id
)
WHERE base_price IS NULL;

-- Add comment to explain the fields
COMMENT ON COLUMN products.base_price IS 'Base price of the product, typically the lowest variant price';
COMMENT ON COLUMN products.donation_amount IS 'Fixed donation amount for this product';
COMMENT ON COLUMN products.featured IS 'Whether this product is featured on the homepage';
COMMENT ON COLUMN products.tags IS 'Array of tags associated with this product';
COMMENT ON COLUMN products.metadata IS 'Additional product metadata stored as JSON';

-- Create index on featured products for faster homepage queries
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;

-- Create index on base_price for faster price-based queries
CREATE INDEX IF NOT EXISTS idx_products_base_price ON products(base_price); 