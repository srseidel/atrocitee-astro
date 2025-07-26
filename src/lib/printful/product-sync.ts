import { createAdminSupabaseClient } from '@lib/supabase/admin-client';
import { PrintfulService } from './service';
import { debug } from '@lib/utils/debug';
import type { AstroCookies } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper function to generate URL-friendly slugs
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Enhances variant options by extracting color and size from Printful's direct properties
 * and variant name when they're not provided in the options array
 */
function enhanceVariantOptions(variant: any): any[] {
  const options = Array.isArray(variant.options) ? [...variant.options] : [];
  
  // Check if color and size options already exist
  const hasColor = options.some(opt => opt.id === 'color');
  const hasSize = options.some(opt => opt.id === 'size');
  
  // First priority: Use Printful's direct size and color properties
  if (!hasSize && variant.size) {
    options.push({ id: 'size', value: variant.size });
  }
  
  if (!hasColor && variant.color) {
    options.push({ id: 'color', value: variant.color });
  }
  
  // If we still don't have color/size, fall back to extracting from variant name
  if (!hasColor || !hasSize) {
    const stillNeedsColor = !options.some(opt => opt.id === 'color');
    const stillNeedsSize = !options.some(opt => opt.id === 'size');
    
    if (variant.name && (stillNeedsColor || stillNeedsSize)) {
      const parts = variant.name.split('/').map((p: string) => p.trim());
      
      if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1];
        const secondLastPart = parts.length >= 3 ? parts[parts.length - 2] : null;
        
        // Check if last part looks like a size
        const isSizePattern = /^(xs|s|m|l|xl|2xl|3xl|4xl|5xl|\d+\s*(oz|ml|l|inch|in|cm|mm|"))$/i.test(lastPart);
        
        if (isSizePattern && stillNeedsSize) {
          // Last part is size
          options.push({ id: 'size', value: lastPart });
          
          // Second last part might be color
          if (secondLastPart && stillNeedsColor) {
            // Check if it's NOT a size pattern
            const isNotSize = !/^(xs|s|m|l|xl|2xl|3xl|4xl|5xl|\d+\s*(oz|ml|l|inch|in|cm|mm|"))$/i.test(secondLastPart);
            if (isNotSize) {
              options.push({ id: 'color', value: secondLastPart });
            }
          }
        } else if (stillNeedsColor) {
          // Last part might be color (if it's not a size)
          options.push({ id: 'color', value: lastPart });
        }
      }
    }
  }
  
  return options;
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
    debug.criticalError('Database error during sync operation', error, { operation });
    
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
      debug.criticalError('Failed to log error to sync history', logError);
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
      debug.log('Found products to sync', { productCount: products.length });
      
      // Process each product
      for (const product of products) {
        try {
          // Get product variants
          const variants = await this.printfulService.getProductVariants(product.id);
          debug.log('Processing product with variants', { productId: product.id, productName: product.name, variantCount: variants.length });
          
          // Add debug logging for variant names
          debug.log('Variant details', { variants: variants.map(v => ({
            id: v.id,
            name: v.name,
            options: v.options,
            files: v.files
          })) });
          
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
            debug.log('Updating existing product', { productId: product.id, productName: product.name });
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
            debug.log('Creating new product', { productId: product.id, productName: product.name });
            // Calculate default base price from first variant if creating new product
            let defaultBasePrice = null;
            if (variants.length > 0) {
              defaultBasePrice = parseFloat(variants[0].retail_price);
              debug.log('Setting default base price from first variant', { defaultBasePrice, productId: product.id });
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
          debug.log('Processing product variants', { variantCount: variants.length, productId });
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

              // Upsert product variant
              const variantData: any = {
                product_id: productId,
                printful_id: variant.id,
                printful_external_id: variant.external_id,
                printful_product_id: variant.product?.product_id,
                printful_synced: variant.synced,
                name: variant.name,
                sku: variant.sku,
                retail_price: variant.retail_price,
                currency: variant.currency,
                options: enhanceVariantOptions(variant),
                files: variant.files || [],
                in_stock: !variant.is_ignored,
                // New fields from Printful API
                size: variant.size || null,
                color: variant.color || null,
                availability_status: variant.availability_status || 'active',
                is_available: variant.availability_status === 'active',
                last_synced_at: new Date().toISOString(),
              };

              // Add ID only if updating existing variant
              if (existingVariant) {
                variantData.id = existingVariant.id;
              }

              const { error: variantError } = await this.supabase
                .from('product_variants')
                .upsert(variantData);

              if (variantError) {
                throw variantError;
              }
            } catch (error) {
              debug.criticalError('Failed to sync variant', error, { variantId: variant.id, productId: product.id });
              failedCount++;
            }
          }

          syncedCount++;
        } catch (error) {
          debug.criticalError('Failed to sync product', error, { productId: product.id });
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
        debug.criticalError('Failed to log sync history', historyError);
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
      debug.criticalError('Fatal error during product sync', error);
      
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
        debug.criticalError('Failed to log sync history after fatal error', logError);
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