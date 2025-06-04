import { createAdminSupabaseClient } from '@lib/supabase/admin-client';
import { PrintfulService } from './service';
import type { AstroCookies } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper function to generate URL-friendly slugs
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export class PrintfulProductSync {
  private static instance: PrintfulProductSync;
  private printfulService: PrintfulService;
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.printfulService = PrintfulService.getInstance();
    this.supabase = supabaseClient;
  }

  public static getInstance(supabaseClient: SupabaseClient): PrintfulProductSync {
    if (!PrintfulProductSync.instance) {
      PrintfulProductSync.instance = new PrintfulProductSync(supabaseClient);
    }
    return PrintfulProductSync.instance;
  }

  private async handleDatabaseError(error: any, operation: string): Promise<never> {
    console.error(`[Sync] Database error during ${operation}:`, error);
    
    // Log error to sync history
    try {
      await this.supabase
        .from('printful_sync_history')
        .insert({
          sync_type: 'error',
          status: 'failed',
          message: `Database error during ${operation}: ${error.message}`,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          products_synced: 0,
          products_failed: 1
        });
    } catch (logError) {
      console.error('[Sync] Failed to log error to sync history:', logError);
    }
    
    throw error;
  }

  public async getProductChanges(status?: 'pending_review' | 'approved' | 'rejected' | 'applied') {
    try {
      let query = this.supabase
        .from('printful_product_changes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      return this.handleDatabaseError(error, 'fetching product changes');
    }
  }

  public async reviewProductChange(
    changeId: string,
    status: 'approved' | 'rejected',
    userId: string
  ) {
    try {
      const { error } = await this.supabase
        .from('printful_product_changes')
        .update({
          status,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', changeId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      return this.handleDatabaseError(error, 'reviewing product change');
    }
  }

  public async syncProducts() {
    const startedAt = new Date().toISOString();
    let syncedCount = 0;
    let failedCount = 0;

    try {
      // Get all products from Printful
      const products = await this.printfulService.getProducts();
      console.log(`[Sync] Found ${products.length} products to sync`);
      
      // Process each product
      for (const product of products) {
        try {
          // Get product variants
          const variants = await this.printfulService.getProductVariants(product.id);
          console.log(`[Sync] Product ${product.id} (${product.name}) has ${variants.length} variants`);
          
          // Add debug logging for variant names
          console.log('[Sync] Variant names:', variants.map(v => ({
            id: v.id,
            name: v.name,
            options: v.options,
            files: v.files
          })));
          
          // Check if product exists in our database
          const { data: existingProduct, error: selectError } = await this.supabase
            .from('products')
            .select('id')
            .eq('printful_id', product.id)
            .maybeSingle();

          if (selectError) {
            throw selectError;
          }

          let productId: string;

          if (existingProduct) {
            console.log(`[Sync] Updating existing product ${product.id} (${product.name})`);
            // Update existing product
            const { error: updateError } = await this.supabase
              .from('products')
              .update({
                name: product.name,
                printful_synced: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingProduct.id);

            if (updateError) {
              throw updateError;
            }
            productId = existingProduct.id;
          } else {
            console.log(`[Sync] Creating new product ${product.id} (${product.name})`);
            // Calculate default base price from first variant if creating new product
            let defaultBasePrice = null;
            if (variants.length > 0) {
              defaultBasePrice = parseFloat(variants[0].retail_price);
              console.log(`[Sync] Setting default base price to ${defaultBasePrice} from first variant`);
            }

            // Create new product
            const { data: newProduct, error: insertError } = await this.supabase
              .from('products')
              .insert({
                printful_id: product.id,
                printful_external_id: product.external_id,
                printful_synced: true,
                name: product.name,
                description: product.description || null,
                slug: generateSlug(product.name),
                thumbnail_url: product.thumbnail_url,
                published_status: false,
                atrocitee_featured: false,
                atrocitee_metadata: {},
                atrocitee_base_price: defaultBasePrice,
                atrocitee_donation_amount: null,
                atrocitee_charity_id: null,
                atrocitee_category_id: null,
              })
              .select('id')
              .single();

            if (insertError) {
              throw insertError;
            }
            productId = newProduct.id;
          }

          // Process variants
          console.log(`[Sync] Processing ${variants.length} variants for product ${productId}`);
          for (const variant of variants) {
            try {
              // Check if variant exists
              const { data: existingVariant, error: variantSelectError } = await this.supabase
                .from('product_variants')
                .select('id')
                .eq('printful_id', variant.id)
                .maybeSingle();

              if (variantSelectError) {
                throw variantSelectError;
              }

              const variantData = {
                product_id: productId,
                printful_id: variant.id,
                printful_external_id: variant.external_id,
                printful_product_id: product.id,
                printful_synced: true,
                name: variant.name,
                sku: variant.sku,
                retail_price: parseFloat(variant.retail_price),
                currency: variant.currency || 'USD',
                options: variant.options,
                files: variant.files,
                in_stock: variant.in_stock,
                stock_level: variant.in_stock ? 1 : 0
              };

              if (existingVariant) {
                console.log(`[Sync] Updating variant ${variant.id} (${variant.name}) for product ${productId}`);
                // Update existing variant
                const { error: updateError } = await this.supabase
                  .from('product_variants')
                  .update(variantData)
                  .eq('id', existingVariant.id);

                if (updateError) {
                  throw updateError;
                }
              } else {
                console.log(`[Sync] Creating new variant ${variant.id} (${variant.name}) for product ${productId}`);
                // Create new variant
                const { error: insertError } = await this.supabase
                  .from('product_variants')
                  .insert(variantData);

                if (insertError) {
                  throw insertError;
                }
              }
            } catch (error) {
              console.error(`[Sync] Failed to sync variant ${variant.id} for product ${product.id}:`, error);
              failedCount++;
            }
          }

          syncedCount++;
        } catch (error) {
          console.error(`[Sync] Failed to sync product ${product.id}:`, error);
          failedCount++;
        }
      }

      // Log sync history
      const { error: historyError } = await this.supabase
        .from('printful_sync_history')
        .insert({
          sync_type: 'full',
          status: failedCount === 0 ? 'completed' : 'partial',
          message: failedCount === 0 
            ? 'Successfully synced all products from Printful'
            : `Synced ${syncedCount} products with ${failedCount} failures`,
          started_at: startedAt,
          completed_at: new Date().toISOString(),
          products_synced: syncedCount,
          products_failed: failedCount
        });

      if (historyError) {
        console.error('[Sync] Failed to log sync history:', historyError);
      }

      return {
        success: true,
        message: failedCount === 0 
          ? 'Product sync completed successfully'
          : `Synced ${syncedCount} products with ${failedCount} failures`,
        syncedCount,
        failedCount,
        startedAt,
        completedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('[Sync] Fatal error during sync:', error);
      
      // Log error to sync history
      try {
        await this.supabase
          .from('printful_sync_history')
          .insert({
            sync_type: 'full',
            status: 'failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            started_at: startedAt,
            completed_at: new Date().toISOString(),
            products_synced: syncedCount,
            products_failed: failedCount + 1
          });
      } catch (logError) {
        console.error('[Sync] Failed to log sync history:', logError);
      }

      throw error;
    }
  }

  /**
   * Syncs Printful categories to our database
   */
  public async syncCategories(): Promise<{ added: number; existing: number }> {
    try {
      let added = 0;
      let existing = 0;

      // Get categories from Printful
      const categories = await this.printfulService.getCatalogCategories();
      
      // Process each category
      for (const category of categories) {
        // Check if category exists
        const { data: existingCategory, error: selectError } = await this.supabase
          .from('product_categories')
          .select('id')
          .eq('printful_id', category.id)
          .maybeSingle();

        if (selectError) {
          throw selectError;
        }

        const categoryData = {
          printful_id: category.id,
          name: category.title,
          parent_id: category.parent_id,
          updated_at: new Date().toISOString()
        };

        if (existingCategory) {
          // Update existing category
          const { error: updateError } = await this.supabase
            .from('product_categories')
            .update(categoryData)
            .eq('id', existingCategory.id);

          if (updateError) {
            throw updateError;
          }
          existing++;
        } else {
          // Create new category
          const { error: insertError } = await this.supabase
            .from('product_categories')
            .insert(categoryData);

          if (insertError) {
            throw insertError;
          }
          added++;
        }
      }

      return { added, existing };
    } catch (error) {
      return this.handleDatabaseError(error, 'syncing categories');
    }
  }
} 