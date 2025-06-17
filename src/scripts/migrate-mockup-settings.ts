/**
 * Script to migrate product variant mockup settings from options.selected_views to mockup_settings.selected_views
 * 
 * Usage: npx ts-node src/scripts/migrate-mockup-settings.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function migrateVariantMockupSettings() {
  console.log('Starting migration of mockup settings from options to mockup_settings...');
  
  // Get all variants
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('id, options');
  
  if (error) {
    console.error('Error fetching variants:', error);
    return;
  }
  
  console.log(`Found ${variants.length} variants to process`);
  
  // Track statistics
  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  // Process each variant
  for (const variant of variants) {
    try {
      // Check if options has selected_views
      let oldOptions: any = variant.options;
      
      // Handle different data structures
      if (Array.isArray(oldOptions)) {
        // If options is an array of {id, value} objects, we need to look for an object with id='selected_views'
        const selectedViewsOption = oldOptions.find(opt => opt.id === 'selected_views');
        if (!selectedViewsOption) {
          console.log(`Variant ${variant.id} has no selected_views in options array, skipping`);
          skippedCount++;
          continue;
        }
        
        const selectedViews = selectedViewsOption.value;
        
        // Update the mockup_settings
        const { error: updateError } = await supabase
          .from('product_variants')
          .update({
            mockup_settings: {
              selected_views: selectedViews
            }
          })
          .eq('id', variant.id);
        
        if (updateError) {
          console.error(`Error updating variant ${variant.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`Migrated variant ${variant.id} - selected views: ${selectedViews.length}`);
          migratedCount++;
        }
      } else if (typeof oldOptions === 'object' && oldOptions !== null) {
        // If options is an object with selected_views property
        if (!oldOptions.selected_views) {
          console.log(`Variant ${variant.id} has no selected_views in options object, skipping`);
          skippedCount++;
          continue;
        }
        
        const selectedViews = oldOptions.selected_views;
        
        // Update the mockup_settings
        const { error: updateError } = await supabase
          .from('product_variants')
          .update({
            mockup_settings: {
              selected_views: selectedViews
            }
          })
          .eq('id', variant.id);
        
        if (updateError) {
          console.error(`Error updating variant ${variant.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`Migrated variant ${variant.id} - selected views: ${selectedViews.length}`);
          migratedCount++;
        }
      } else {
        console.log(`Variant ${variant.id} has invalid options format, skipping`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`Error processing variant ${variant.id}:`, error);
      errorCount++;
    }
  }
  
  console.log('Migration complete!');
  console.log(`Migrated: ${migratedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
}

// Run the migration
migrateVariantMockupSettings().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 