import type { APIRoute } from 'astro';
import { PrintfulService } from '../../../lib/printful/service';
import { createServerSupabaseClient } from '../../../lib/supabase';

// Ensure this endpoint is server-rendered
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check if Printful API key is available
    if (!import.meta.env.PRINTFUL_API_KEY) {
      console.error('Missing Printful API key in environment variables');
      throw new Error('Printful API key is not configured. Please check your environment variables.');
    }

    console.log('Printful API key format check:', {
      hasKey: !!import.meta.env.PRINTFUL_API_KEY,
      keyStartsWithPk: import.meta.env.PRINTFUL_API_KEY.startsWith('pk_'),
      keyLength: import.meta.env.PRINTFUL_API_KEY.length
    });

    // Initialize services
    const printfulService = PrintfulService.getInstance();
    const supabase = createServerSupabaseClient({ cookies });
    
    // Create sync history record
    const { data: syncHistory, error: syncError } = await supabase
      .from('printful_sync_history')
      .insert({
        sync_type: 'products',
        status: 'in_progress',
        message: 'Starting product sync',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (syncError) {
      console.error('Failed to create sync history:', syncError);
      throw new Error('Failed to start sync process');
    }

    // Get all products from Printful
    let printfulProducts;
    try {
      console.log('Attempting to fetch products from Printful...');
      printfulProducts = await printfulService.getProducts();
      console.log('Successfully fetched products from Printful:', {
        productCount: printfulProducts?.length || 0
      });
    } catch (error) {
      console.error('Failed to fetch products from Printful:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch products from Printful');
    }
    
    let productsSynced = 0;
    let productsFailed = 0;
    const errors: string[] = [];

    // Process each product
    for (const printfulProduct of printfulProducts) {
      try {
        // Get variants for this product
        const variants = await printfulService.getProductVariants(printfulProduct.id);
        
        // Get the base price from the first variant
        const basePrice = variants.length > 0 ? parseFloat(variants[0].retail_price) : 0;

        // Check if product exists in our database by printful_id
        const { data: existingProduct, error: queryError } = await supabase
          .from('products')
          .select('*')
          .eq('printful_id', printfulProduct.id)
          .single();

        if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw queryError;
        }

        if (existingProduct) {
          // Compare fields and create change records if needed
          const changes = [];
          
          // Only create change records if values are different
          if (existingProduct.name !== printfulProduct.name) {
            changes.push({
              product_id: existingProduct.id,
              change_type: 'update',
              change_severity: 'low',
              field_name: 'name',
              old_value: existingProduct.name,
              new_value: printfulProduct.name,
              status: 'pending_review'
            });
          }

          if (existingProduct.description !== printfulProduct.description) {
            changes.push({
              product_id: existingProduct.id,
              change_type: 'update',
              change_severity: 'low',
              field_name: 'description',
              old_value: existingProduct.description,
              new_value: printfulProduct.description,
              status: 'pending_review'
            });
          }

          // Check for price changes - only if the difference is more than 0.01
          if (Math.abs(existingProduct.atrocitee_base_price - basePrice) > 0.01) {
            changes.push({
              product_id: existingProduct.id,
              change_type: 'price',
              change_severity: 'critical',
              field_name: 'atrocitee_base_price',
              old_value: existingProduct.atrocitee_base_price?.toString(),
              new_value: basePrice.toString(),
              status: 'pending_review'
            });
          }

          // Insert changes if any
          if (changes.length > 0) {
            const { error: changesError } = await supabase
              .from('printful_product_changes')
              .insert(changes);

            if (changesError) throw changesError;
          }

          // Update the product
          const { error: updateError } = await supabase
            .from('products')
            .update({
              name: printfulProduct.name,
              description: printfulProduct.description,
              thumbnail_url: printfulProduct.thumbnail_url,
              atrocitee_base_price: basePrice,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProduct.id);

          if (updateError) throw updateError;

          // Update variants
          for (const variant of variants) {
            const { data: existingVariant } = await supabase
              .from('printful_variants')
              .select('*')
              .eq('printful_variant_id', variant.id)
              .single();

            if (!existingVariant) {
              // Insert new variant
              const { error: variantError } = await supabase
                .from('printful_variants')
                .insert({
                  product_id: existingProduct.id,
                  printful_variant_id: variant.id,
                  name: variant.name,
                  sku: variant.sku,
                  retail_price: parseFloat(variant.retail_price),
                  in_stock: variant.in_stock,
                  options: variant.options
                });

              if (variantError) throw variantError;
            } else {
              // Update existing variant
              const { error: variantError } = await supabase
                .from('printful_variants')
                .update({
                  name: variant.name,
                  sku: variant.sku,
                  retail_price: parseFloat(variant.retail_price),
                  in_stock: variant.in_stock,
                  options: variant.options,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingVariant.id);

              if (variantError) throw variantError;
            }
          }
        } else {
          // Insert new product
          const { data: newProduct, error: insertError } = await supabase
            .from('products')
            .insert({
              printful_id: printfulProduct.id,
              printful_external_id: printfulProduct.external_id,
              printful_synced: true,
              name: printfulProduct.name,
              description: printfulProduct.description,
              thumbnail_url: printfulProduct.thumbnail_url,
              atrocitee_active: true,
              atrocitee_featured: false,
              atrocitee_tags: [],
              atrocitee_metadata: {},
              atrocitee_base_price: basePrice,
              atrocitee_donation_amount: 5.00,  // Default donation amount
            })
            .select()
            .single();

          if (insertError) throw insertError;

          // Insert variants for new product
          for (const variant of variants) {
            const { error: variantError } = await supabase
              .from('printful_variants')
              .insert({
                product_id: newProduct.id,
                printful_variant_id: variant.id,
                name: variant.name,
                sku: variant.sku,
                retail_price: parseFloat(variant.retail_price),
                in_stock: variant.in_stock,
                options: variant.options
              });

            if (variantError) throw variantError;
          }
        }

        productsSynced++;
      } catch (error) {
        console.error(`Failed to process product ${printfulProduct.id}:`, error);
        productsFailed++;
        errors.push(`Product ${printfulProduct.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update sync history
    const { error: updateError } = await supabase
      .from('printful_sync_history')
      .update({
        status: productsFailed === 0 ? 'success' : 'partial',
        message: `Sync completed. ${productsSynced} products synced, ${productsFailed} failed.${errors.length > 0 ? '\nErrors: ' + errors.join('\n') : ''}`,
        products_synced: productsSynced,
        products_failed: productsFailed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', syncHistory.id);

    if (updateError) {
      console.error('Failed to update sync history:', updateError);
      throw new Error('Failed to complete sync process');
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Sync completed. ${productsSynced} products synced, ${productsFailed} failed.${errors.length > 0 ? '\nErrors: ' + errors.join('\n') : ''}`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error syncing products:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to sync products'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 