-- Drop all tables with CASCADE to handle all dependencies automatically
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS charities CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP VIEW IF EXISTS public_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop the timestamp update function
DROP FUNCTION IF EXISTS update_modified_column();

-- Alternatively, if there are other unknown dependencies, you can use CASCADE
-- This is more aggressive and will drop all dependent objects
-- Uncomment the lines below if the above approach doesn't work:
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE; 