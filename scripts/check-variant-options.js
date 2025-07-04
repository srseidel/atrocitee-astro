#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkVariantOptions() {
  console.log('🔍 Checking variant options in database...\n');
  
  // Get all variants with their options
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select(`
      id,
      name,
      sku,
      options,
      products (
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching variants:', error);
    return;
  }

  console.log(`📊 Found ${variants.length} variants\n`);

  variants.forEach((variant, index) => {
    console.log(`\n--- Variant ${index + 1} ---`);
    console.log(`Product: ${variant.products?.name || 'Unknown'}`);
    console.log(`Variant: ${variant.name}`);
    console.log(`SKU: ${variant.sku}`);
    console.log(`Options type: ${typeof variant.options}`);
    console.log(`Options is array: ${Array.isArray(variant.options)}`);
    console.log(`Options content:`, JSON.stringify(variant.options, null, 2));
    
    // Analyze the options structure
    if (Array.isArray(variant.options)) {
      console.log(`📋 Options array has ${variant.options.length} items:`);
      variant.options.forEach((option, i) => {
        console.log(`  ${i + 1}. ${option.id}: ${option.value}`);
      });
    } else if (variant.options && typeof variant.options === 'object') {
      const keys = Object.keys(variant.options);
      console.log(`📋 Options object has ${keys.length} keys: ${keys.join(', ')}`);
      keys.forEach(key => {
        console.log(`  ${key}: ${variant.options[key]}`);
      });
    } else {
      console.log(`❌ Options is not array or object: ${variant.options}`);
    }
  });
  
  console.log('\n✅ Analysis complete!');
}

checkVariantOptions().catch(console.error); 