#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...\n');
  
  try {
    // Check if the new columns exist by trying to select them
    const { data, error } = await supabase
      .from('product_variants')
      .select('id, size, color, availability_status, is_available, last_synced_at')
      .limit(1);

    if (error) {
      console.error('❌ Error checking product_variants structure:', error);
      return false;
    }

    console.log('✅ New columns exist in product_variants table');
    console.log('📊 Current variant count:', data?.length || 0);
    
    // Check products count
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .limit(10);

    if (productError) {
      console.error('❌ Error checking products:', productError);
      return false;
    }

    console.log('📊 Current product count:', products?.length || 0);
    
    if (products && products.length > 0) {
      console.log('📝 Products in database:');
      products.forEach(p => console.log(`  - ${p.name} (${p.id})`));
    }

    return true;
  } catch (error) {
    console.error('❌ Database check failed:', error);
    return false;
  }
}

async function main() {
  const isHealthy = await checkDatabaseStructure();
  
  if (isHealthy) {
    console.log('\n✅ Database structure looks good!');
    console.log('💡 You can now run a fresh sync to repopulate the variants.');
  } else {
    console.log('\n❌ Database structure issues detected.');
    console.log('💡 You may need to run the schema migration again.');
  }
}

main().catch(console.error); 