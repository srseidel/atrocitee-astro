/**
 * Printful Product Synchronization Service
 * 
 * Handles importing and synchronizing products from Printful to our database.
 */

import { createServerSupabaseClient } from '../supabase';
import PrintfulService from './service';
import * as Sentry from '@sentry/astro';
import type { 
  PrintfulProduct, 
  PrintfulProductList, 
  PrintfulVariant,
  PrintfulCatalogProduct,
  PrintfulCatalogVariant
} from '../../types/printful';
import slugify from 'slugify';

/**
 * Class for managing product synchronization with Printful
 */
export default class PrintfulProductSync {
  private printfulService: PrintfulService;
  private supabase: any; // Using any type here since the Supabase client type is complex

  constructor(cookies: any) {
    this.printfulService = PrintfulService.getInstance();
    console.log('[PrintfulProductSync] Initializing with cookies:', cookies ? 'Present' : 'Missing');
    this.supabase = createServerSupabaseClient({ cookies });
    console.log('[PrintfulProductSync] Supabase client created:', this.supabase ? 'Success' : 'Failed');
    
    // Check if important methods exist
    const hasAuth = this.supabase && this.supabase.auth && typeof this.supabase.auth.getSession === 'function';
    const hasFrom = this.supabase && typeof this.supabase.from === 'function';
    console.log('[PrintfulProductSync] Supabase client validity check:', { 
      hasAuth, 
      hasFrom, 
      isValidClient: hasAuth && hasFrom 
    });
  }

  /**
   * Start a sync process and record it in the database
   */
  private async startSyncProcess(type: 'manual' | 'scheduled' | 'webhook'): Promise<string> {
    const { data, error } = await this.supabase
      .from('printful_sync_history')
      .insert({
        sync_type: type,
        status: 'success', // Initial status, will be updated if failures occur
        started_at: new Date().toISOString(),
        products_synced: 0,
        products_failed: 0
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating sync history record:', error);
      Sentry.captureException(error, {
        tags: { operation: 'startSyncProcess' }
      });
      throw error;
    }

    return data.id;
  }

  /**
   * Update the sync process record with results
   */
  private async completeSyncProcess(
    syncId: string, 
    success: number, 
    failed: number, 
    status: 'success' | 'partial' | 'failed',
    message?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('printful_sync_history')
      .update({
        status,
        message,
        products_synced: success,
        products_failed: failed,
        completed_at: new Date().toISOString()
      })
      .eq('id', syncId);

    if (error) {
      console.error('Error updating sync history record:', error);
      Sentry.captureException(error, {
        tags: { operation: 'completeSyncProcess' }
      });
    }
  }

  /**
   * Log a product change in the database
   */
  private async logProductChange(
    productId: string,
    printfulProductId: number,
    changeType: 'price' | 'inventory' | 'metadata' | 'image' | 'variant' | 'other',
    changeSeverity: 'critical' | 'standard' | 'minor',
    fieldName: string,
    oldValue: string | null,
    newValue: string | null,
    syncHistoryId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('printful_product_changes')
      .insert({
        product_id: productId,
        printful_product_id: printfulProductId,
        change_type: changeType,
        change_severity: changeSeverity,
        field_name: fieldName,
        old_value: oldValue,
        new_value: newValue,
        sync_history_id: syncHistoryId,
        status: 'pending_review'
      });

    if (error) {
      console.error('Error logging product change:', error);
      Sentry.captureException(error, {
        tags: { operation: 'logProductChange' }
      });
    }
  }

  /**
   * Check if a product exists in our database
   */
  private async productExists(printfulProductId: number): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('id')
      .eq('printful_product_id', printfulProductId)
      .maybeSingle();

    if (error) {
      console.error('Error checking if product exists:', error);
      Sentry.captureException(error, {
        tags: { operation: 'productExists' }
      });
      return null;
    }

    return data?.id || null;
  }

  /**
   * Transform a Printful product to our database format
   */
  private transformPrintfulProduct(
    printfulProduct: PrintfulProduct, 
    variants: PrintfulVariant[]
  ): any {
    // Get the price from the first variant
    const basePrice = variants.length > 0 ? parseFloat(variants[0].retail_price) : 0;
    
    // Create a slug from the product name
    const slug = slugify(printfulProduct.name, { lower: true, strict: true });
    
    return {
      name: printfulProduct.name,
      slug,
      description: '', // Printful sync products don't have descriptions
      price: basePrice,
      inventory_count: variants.length, // Use variant count as inventory for now
      image_urls: printfulProduct.thumbnail_url ? [printfulProduct.thumbnail_url] : [],
      active: true,
      version: 1,
      printful_product_id: printfulProduct.id,
      printful_sync_product_id: printfulProduct.id
    };
  }

  /**
   * Transform a Printful variant to our database format
   */
  private transformPrintfulVariant(
    variant: PrintfulVariant, 
    productId: string
  ): any {
    // Extract options from the variant
    const options: Record<string, string> = {};
    
    variant.options.forEach(option => {
      options[option.id] = option.value.toString();
    });

    return {
      product_id: productId,
      name: variant.name,
      sku: variant.sku,
      price: parseFloat(variant.retail_price),
      options,
      printful_variant_id: variant.variant_id,
      printful_sync_variant_id: variant.id,
      inventory_count: 1, // Printful doesn't provide inventory counts directly
      active: true
    };
  }

  /**
   * Import a new product from Printful
   */
  private async importProduct(
    printfulProduct: PrintfulProduct, 
    variants: PrintfulVariant[],
    syncHistoryId: string
  ): Promise<string | null> {
    try {
      // Transform the product data
      const productData = this.transformPrintfulProduct(printfulProduct, variants);
      
      // Insert the product into our database
      const { data: product, error: productError } = await this.supabase
        .from('products')
        .insert(productData)
        .select('id')
        .single();

      if (productError) {
        console.error('Error importing product:', productError);
        Sentry.captureException(productError, {
          tags: { operation: 'importProduct' },
          extra: { productData }
        });
        return null;
      }

      // Now import all the variants
      for (const variant of variants) {
        const variantData = this.transformPrintfulVariant(variant, product.id);
        
        const { error: variantError } = await this.supabase
          .from('product_variants')
          .insert(variantData);

        if (variantError) {
          console.error('Error importing variant:', variantError);
          Sentry.captureException(variantError, {
            tags: { operation: 'importProduct' },
            extra: { variantData }
          });
        }
      }

      // Log the creation as a change
      await this.logProductChange(
        product.id,
        printfulProduct.id,
        'metadata',
        'standard',
        'product_created',
        null,
        'New product imported from Printful',
        syncHistoryId
      );

      return product.id;
    } catch (error) {
      console.error('Error in importProduct:', error);
      Sentry.captureException(error, {
        tags: { operation: 'importProduct' }
      });
      return null;
    }
  }

  /**
   * Update an existing product with Printful data
   */
  private async updateProduct(
    productId: string,
    printfulProduct: PrintfulProduct, 
    variants: PrintfulVariant[],
    syncHistoryId: string
  ): Promise<boolean> {
    try {
      // Get the current product data
      const { data: currentProduct, error: fetchError } = await this.supabase
        .from('products')
        .select('*, product_categories(*), product_tags(*)')
        .eq('id', productId)
        .single();

      if (fetchError) {
        console.error('Error fetching current product:', fetchError);
        Sentry.captureException(fetchError, {
          tags: { operation: 'updateProduct' }
        });
        return false;
      }

      // Transform the new product data
      const newProductData = this.transformPrintfulProduct(printfulProduct, variants);
      
      // Preserve existing metadata fields that shouldn't be overwritten
      newProductData.description = currentProduct.description || newProductData.description;
      
      // Don't override slug for existing products to preserve SEO
      newProductData.slug = currentProduct.slug || newProductData.slug;
      
      // Check for significant changes
      const changes: Array<{ field: string, old: any, new: any, type: 'price' | 'inventory' | 'metadata' | 'image', severity: 'critical' | 'standard' | 'minor' }> = [];
      
      // Check name change
      if (currentProduct.name !== newProductData.name) {
        changes.push({
          field: 'name',
          old: currentProduct.name,
          new: newProductData.name,
          type: 'metadata',
          severity: 'standard'
        });
      }
      
      // Check price change
      if (currentProduct.price !== newProductData.price) {
        changes.push({
          field: 'price',
          old: currentProduct.price.toString(),
          new: newProductData.price.toString(),
          type: 'price',
          severity: 'critical'
        });
      }
      
      // Check image changes
      if (JSON.stringify(currentProduct.image_urls) !== JSON.stringify(newProductData.image_urls)) {
        changes.push({
          field: 'image_urls',
          old: JSON.stringify(currentProduct.image_urls),
          new: JSON.stringify(newProductData.image_urls),
          type: 'image',
          severity: 'standard'
        });
      }

      // Update the product if changes exist
      if (changes.length > 0) {
        const { error: updateError } = await this.supabase
          .from('products')
          .update(newProductData)
          .eq('id', productId);

        if (updateError) {
          console.error('Error updating product:', updateError);
          Sentry.captureException(updateError, {
            tags: { operation: 'updateProduct' }
          });
          return false;
        }

        // Log all the changes
        for (const change of changes) {
          await this.logProductChange(
            productId,
            printfulProduct.id,
            change.type,
            change.severity,
            change.field,
            change.old,
            change.new,
            syncHistoryId
          );
        }
      }

      // Now update the variants
      // First get all current variants
      const { data: currentVariants, error: variantFetchError } = await this.supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId);

      if (variantFetchError) {
        console.error('Error fetching current variants:', variantFetchError);
        Sentry.captureException(variantFetchError, {
          tags: { operation: 'updateProduct' }
        });
      } else {
        // Create a map of current variants by Printful ID
        const currentVariantMap = new Map();
        currentVariants.forEach((variant: any) => {
          currentVariantMap.set(variant.printful_sync_variant_id, variant);
        });

        // Process each incoming variant
        for (const variant of variants) {
          const variantData = this.transformPrintfulVariant(variant, productId);
          
          // Check if this variant already exists
          if (currentVariantMap.has(variant.id)) {
            // Update the existing variant
            const currentVariant = currentVariantMap.get(variant.id);
            
            // Check for price changes
            if (currentVariant.price !== variantData.price) {
              await this.logProductChange(
                productId,
                printfulProduct.id,
                'price',
                'critical',
                `variant_price_${variant.id}`,
                currentVariant.price.toString(),
                variantData.price.toString(),
                syncHistoryId
              );
            }
            
            const { error: updateVariantError } = await this.supabase
              .from('product_variants')
              .update(variantData)
              .eq('id', currentVariant.id);

            if (updateVariantError) {
              console.error('Error updating variant:', updateVariantError);
              Sentry.captureException(updateVariantError, {
                tags: { operation: 'updateProduct' }
              });
            }
            
            // Remove this variant from the map to track which ones no longer exist
            currentVariantMap.delete(variant.id);
          } else {
            // Insert a new variant
            const { error: insertVariantError } = await this.supabase
              .from('product_variants')
              .insert(variantData);

            if (insertVariantError) {
              console.error('Error inserting new variant:', insertVariantError);
              Sentry.captureException(insertVariantError, {
                tags: { operation: 'updateProduct' }
              });
            }
            
            // Log the new variant
            await this.logProductChange(
              productId,
              printfulProduct.id,
              'variant',
              'standard',
              `variant_added_${variant.id}`,
              null,
              `New variant added: ${variant.name}`,
              syncHistoryId
            );
          }
        }
        
        // Any variants left in the map no longer exist in Printful
        for (const [variantId, variant] of currentVariantMap.entries()) {
          // Deactivate rather than delete
          const { error: deactivateError } = await this.supabase
            .from('product_variants')
            .update({ active: false })
            .eq('id', variant.id);

          if (deactivateError) {
            console.error('Error deactivating variant:', deactivateError);
            Sentry.captureException(deactivateError, {
              tags: { operation: 'updateProduct' }
            });
          }
          
          // Log the removed variant
          await this.logProductChange(
            productId,
            printfulProduct.id,
            'variant',
            'critical',
            `variant_removed_${variantId}`,
            `Variant removed: ${variant.name}`,
            null,
            syncHistoryId
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error in updateProduct:', error);
      Sentry.captureException(error, {
        tags: { operation: 'updateProduct' }
      });
      return false;
    }
  }

  /**
   * Synchronize all products from Printful to our database
   */
  async syncAllProducts(type: 'manual' | 'scheduled' | 'webhook' = 'manual'): Promise<{ 
    success: number; 
    failed: number; 
    syncId: string 
  }> {
    // Start the sync process
    const syncId = await this.startSyncProcess(type);
    
    let successCount = 0;
    let failureCount = 0;
    
    try {
      // Get all products from Printful
      const printfulProducts = await this.printfulService.getAllProducts();
      
      for (const productList of printfulProducts) {
        const { sync_product, sync_variants } = productList;
        
        // Check if the product already exists in our database
        const existingProductId = await this.productExists(sync_product.id);
        
        if (existingProductId) {
          // Update the existing product
          const success = await this.updateProduct(
            existingProductId, 
            sync_product, 
            sync_variants,
            syncId
          );
          
          if (success) {
            successCount++;
          } else {
            failureCount++;
          }
        } else {
          // Import as a new product
          const newProductId = await this.importProduct(
            sync_product, 
            sync_variants,
            syncId
          );
          
          if (newProductId) {
            successCount++;
          } else {
            failureCount++;
          }
        }
      }
      
      // Determine overall status
      let status: 'success' | 'partial' | 'failed' = 'success';
      if (failureCount > 0 && successCount === 0) {
        status = 'failed';
      } else if (failureCount > 0) {
        status = 'partial';
      }
      
      // Complete the sync process
      await this.completeSyncProcess(
        syncId,
        successCount,
        failureCount,
        status,
        `Sync completed with ${successCount} successful products and ${failureCount} failures.`
      );
      
      return { success: successCount, failed: failureCount, syncId };
    } catch (error) {
      console.error('Error in syncAllProducts:', error);
      Sentry.captureException(error, {
        tags: { operation: 'syncAllProducts' }
      });
      
      // Complete the sync process with failure
      await this.completeSyncProcess(
        syncId,
        successCount,
        failureCount,
        'failed',
        `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      return { success: successCount, failed: failureCount, syncId };
    }
  }

  /**
   * Get all product change records
   */
  async getProductChanges(status?: 'pending_review' | 'approved' | 'rejected' | 'applied') {
    try {
      let query = this.supabase
        .from('printful_product_changes')
        .select(`
          *,
          product:products(id, name, slug, image_urls)
        `)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching product changes:', error);
        Sentry.captureException(error, {
          tags: { operation: 'getProductChanges' }
        });
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Error in getProductChanges:', error);
      Sentry.captureException(error, {
        tags: { operation: 'getProductChanges' }
      });
      return [];
    }
  }

  /**
   * Get sync history records
   */
  async getSyncHistory(limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('printful_sync_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching sync history:', error);
        Sentry.captureException(error, {
          tags: { operation: 'getSyncHistory' }
        });
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Error in getSyncHistory:', error);
      Sentry.captureException(error, {
        tags: { operation: 'getSyncHistory' }
      });
      return [];
    }
  }

  /**
   * Sync Printful catalog categories to our database
   * This populates the printful_category_mapping table with categories from Printful
   */
  async syncCategories(): Promise<{ added: number; existing: number; error: string | null }> {
    try {
      console.log('[ProductSync] Starting Printful category synchronization');
      
      // Get all categories from Printful
      console.log('[ProductSync] Requesting categories from Printful API');
      const categories = await this.printfulService.getCatalogCategories();
      
      // Enhanced logging for debugging
      console.log(`[ProductSync] Categories result type:`, typeof categories);
      console.log(`[ProductSync] Is array:`, Array.isArray(categories));
      console.log(`[ProductSync] Retrieved categories from Printful:`, categories);
      
      // Ensure we have an array of categories
      if (!categories || !Array.isArray(categories)) {
        console.error('[ProductSync] Invalid categories data, expected array but got:', typeof categories);
        throw new Error('Invalid categories data from Printful API');
      }
      
      if (categories.length === 0) {
        console.log('[ProductSync] No categories returned from Printful API');
        return { added: 0, existing: 0, error: 'No categories returned from Printful API' };
      }
      
      // Log Supabase authentication details
      console.log('[ProductSync] Checking Supabase client:', this.supabase ? 'Initialized' : 'Missing');
      
      // Verify Supabase connection
      console.log('[ProductSync] Verifying Supabase connection');
      try {
        // First, try a simpler query to check if the database is accessible at all
        console.log('[ProductSync] Testing basic database connectivity');
        const { data: testAuth, error: authError } = await this.supabase.auth.getSession();
        
        console.log('[ProductSync] Auth session result:', testAuth ? 'Session exists' : 'No session');
        console.log('[ProductSync] Auth user:', testAuth?.session?.user?.email || 'No user');
        console.log('[ProductSync] Auth role:', testAuth?.session?.user?.role || 'No role');
        
        if (authError) {
          console.error('[ProductSync] Authentication check failed:', authError);
          throw new Error(`Authentication error: ${authError.message || 'Unknown auth error'}`);
        }
        
        console.log('[ProductSync] Auth check passed, testing table access');
        
        // Test if we can access any table first
        console.log('[ProductSync] Testing access to public schema');
        const { error: schemaError } = await this.supabase.rpc('check_table_exists', { table_name_param: 'printful_category_mapping' });
        
        if (schemaError) {
          console.error('[ProductSync] Schema access test failed:', schemaError);
          throw new Error(`Schema access error: ${schemaError.message || 'Unable to access schema functions'}`);
        }
        
        // Try to query the table to see if it exists and we have permissions
        console.log('[ProductSync] Attempting to query printful_category_mapping table');
        const { data: testCount, error: connectionError, count } = await this.supabase
          .from('printful_category_mapping')
          .select('id', { count: 'exact', head: true });
        
        console.log('[ProductSync] Table query result:', { data: testCount ? 'Has data' : 'No data', count, error: connectionError ? 'Has error' : 'No error' });
        
        if (connectionError) {
          console.error('[ProductSync] Supabase connection test failed:', connectionError);
          console.error('[ProductSync] Error code:', connectionError.code);
          console.error('[ProductSync] Error hint:', connectionError.hint);
          console.error('[ProductSync] Error details:', connectionError.details);
          
          // Handle empty error message specially
          if (!connectionError.message) {
            throw new Error(`Database connection error: This is likely a permissions issue. Make sure the authenticated role has access to the printful_category_mapping table.`);
          }
          
          throw new Error(`Database connection error: ${connectionError.message}`);
        }
        
        console.log('[ProductSync] Supabase connection verified');
      } catch (connErr) {
        console.error('[ProductSync] Error testing database connection:', connErr);
        
        // If there's a more specific error message, use it
        const errorMessage = connErr instanceof Error 
          ? connErr.message 
          : 'Failed to connect to the database';
        
        throw new Error(errorMessage);
      }
      
      let added = 0;
      let existing = 0;
      
      // Process each category
      console.log('[ProductSync] Processing categories...');
      for (const category of categories) {
        console.log(`[ProductSync] Processing category ${category.id}: ${category.title}`);
        
        // Check if the category already exists in our database
        console.log(`[ProductSync] Checking if category ${category.id} exists`);
        const { data: existingCategory, error: selectError } = await this.supabase
          .from('printful_category_mapping')
          .select('id')
          .eq('printful_category_id', category.id)
          .maybeSingle();
        
        if (selectError) {
          console.error(`[ProductSync] Error checking if category ${category.id} exists:`, selectError);
          console.error('[ProductSync] Error code:', selectError.code);
          console.error('[ProductSync] Error hint:', selectError.hint);
          console.error('[ProductSync] Error details:', selectError.details);
          throw new Error(`Database query error: ${selectError.message}`);
        }
        
        if (existingCategory) {
          console.log(`[ProductSync] Category ${category.id} exists, updating name`);
          // Update the existing category name in case it has changed
          const { error } = await this.supabase
            .from('printful_category_mapping')
            .update({
              printful_category_name: category.title,
              updated_at: new Date().toISOString()
            })
            .eq('printful_category_id', category.id);
          
          if (error) {
            console.error(`[ProductSync] Error updating category ${category.id}:`, error);
            console.error('[ProductSync] Error code:', error.code);
            console.error('[ProductSync] Error hint:', error.hint);
            console.error('[ProductSync] Error details:', error.details);
            Sentry.captureException(error, {
              tags: { operation: 'syncCategories' },
              extra: { category }
            });
            throw new Error(`Failed to update category ${category.id}: ${error.message}`);
          } else {
            console.log(`[ProductSync] Successfully updated category ${category.id}`);
            existing++;
          }
        } else {
          console.log(`[ProductSync] Category ${category.id} doesn't exist, inserting new record`);
          // Insert the new category
          const { error } = await this.supabase
            .from('printful_category_mapping')
            .insert({
              printful_category_id: category.id,
              printful_category_name: category.title,
              is_active: true
            });
          
          if (error) {
            console.error(`[ProductSync] Error inserting category ${category.id}:`, error);
            console.error('[ProductSync] Error code:', error.code);
            console.error('[ProductSync] Error hint:', error.hint);
            console.error('[ProductSync] Error details:', error.details);
            Sentry.captureException(error, {
              tags: { operation: 'syncCategories' },
              extra: { category }
            });
            throw new Error(`Failed to insert category ${category.id}: ${error.message}`);
          } else {
            console.log(`[ProductSync] Successfully inserted category ${category.id}`);
            added++;
          }
        }
      }
      
      console.log(`[ProductSync] Category sync complete: Added ${added}, Updated ${existing}`);
      return { added, existing, error: null };
    } catch (error) {
      console.error('[ProductSync] Error syncing Printful categories:', error);
      Sentry.captureException(error, {
        tags: { operation: 'syncCategories' }
      });
      
      return { 
        added: 0, 
        existing: 0, 
        error: error instanceof Error ? error.message : 'Unknown error syncing categories' 
      };
    }
  }

  /**
   * Get the category mapping between Printful and Atrocitee
   */
  async getCategoryMapping() {
    const { data, error } = await this.supabase
      .from('printful_category_mapping')
      .select('*')
      .order('printful_category_name');
      
    if (error) {
      console.error('Error getting category mapping:', error);
      Sentry.captureException(error, {
        tags: { operation: 'getCategoryMapping' }
      });
      return [];
    }
    
    return data || [];
  }

  /**
   * Update a category mapping to link a Printful category to an Atrocitee category
   */
  async updateCategoryMapping(printfulCategoryId: number, atrociteeCategoryId: string | null, isActive = true) {
    const { error } = await this.supabase
      .from('printful_category_mapping')
      .update({
        atrocitee_category_id: atrociteeCategoryId,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('printful_category_id', printfulCategoryId);
      
    if (error) {
      console.error('Error updating category mapping:', error);
      Sentry.captureException(error, {
        tags: { operation: 'updateCategoryMapping' },
        extra: { printfulCategoryId, atrociteeCategoryId }
      });
      throw error;
    }
    
    return true;
  }

  /**
   * Review a product change
   */
  async reviewProductChange(
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
        console.error('Error reviewing product change:', error);
        Sentry.captureException(error, {
          tags: { operation: 'reviewProductChange' }
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in reviewProductChange:', error);
      Sentry.captureException(error, {
        tags: { operation: 'reviewProductChange' }
      });
      return false;
    }
  }
} 