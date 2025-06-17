#!/usr/bin/env node

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Supabase environment variables are not set');
  console.error('Please set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getProductIds() {
  try {
    console.log('Fetching products from database...');
    
    // Query the products table for printful_id
    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug, printful_id')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('No products found in the database');
      return;
    }
    
    console.log(`\nFound ${data.length} products:`);
    console.log('─'.repeat(80));
    console.log('ID                                    | Printful ID | Name');
    console.log('─'.repeat(80));
    
    data.forEach(product => {
      console.log(`${product.id.padEnd(36)} | ${String(product.printful_id || 'N/A').padEnd(11)} | ${product.name}`);
    });
    
    console.log('\nTo check a specific product, run:');
    console.log(`npm run check-printful <printful_id>`);
    
  } catch (error) {
    console.error('Error fetching product IDs:', error);
    process.exit(1);
  }
}

// Run the query
getProductIds(); 