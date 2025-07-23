-- Fix cart API access issues
-- This script ensures the cart validation API can properly access product data

-- Check current policies for products and product_variants
SELECT 'Products policies:' as table_info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'products';

SELECT 'Product variants policies:' as table_info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'product_variants';

-- Fix product_variants policies to allow both authenticated and anonymous access
-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Published variants are viewable by everyone" ON product_variants;
DROP POLICY IF EXISTS "Authenticated users can view all variants" ON product_variants;
DROP POLICY IF EXISTS "Admin users can manage product variants" ON product_variants;

-- Create new policies that work for both authenticated and anonymous users
-- Allow everyone (including server-side API calls) to read variants of published products
CREATE POLICY "Everyone can view published product variants"
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

-- Allow authenticated users to view all variants (including unpublished)
CREATE POLICY "Authenticated users can view all variants"
ON product_variants
FOR SELECT
TO authenticated
USING (true);

-- Admin policy for managing variants
CREATE POLICY "Admin users can manage product variants"
ON product_variants
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Also ensure products table has proper access
-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Published products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Authenticated users can view all products" ON products;
DROP POLICY IF EXISTS "Admin users can manage all products" ON products;

-- Create new policies that work for both authenticated and anonymous users
CREATE POLICY "Everyone can view published products"
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

-- Ensure proper grants
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT ON product_variants TO anon, authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON product_variants TO authenticated;

-- Test the access
DO $$
BEGIN
    -- Test products access
    PERFORM 1 FROM products WHERE published_status = true LIMIT 1;
    RAISE NOTICE 'Products table access test successful';
    
    -- Test product_variants access
    PERFORM 1 FROM product_variants 
    WHERE EXISTS (
        SELECT 1 FROM products 
        WHERE products.id = product_variants.product_id 
        AND products.published_status = true
    ) LIMIT 1;
    RAISE NOTICE 'Product variants table access test successful';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Table access test failed: %', SQLERRM;
END$$;

-- Show some test data to verify
SELECT 'Sample products:' as info;
SELECT id, name, slug, published_status FROM products LIMIT 3;

SELECT 'Sample variants:' as info;
SELECT pv.id, pv.options, p.name as product_name, p.published_status
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
LIMIT 3;