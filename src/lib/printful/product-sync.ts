/**
 * Printful Product Synchronization Service
 * 
 * Handles importing and synchronizing products from Printful to our database.
 */

import { createServerSupabaseClient } from '../supabase';
import { PrintfulService } from './service';
import * as Sentry from '@sentry/astro';
import type { 
  PrintfulProduct, 
  PrintfulProductList, 
  PrintfulVariant,
  PrintfulCatalogProduct,
  PrintfulCatalogVariant
} from '../../types/printful';
import slugify from 'slugify';
import { SupabaseClient } from '@supabase/supabase-js';

interface SyncResult {
  startedAt: string;
  completedAt: string;
  syncedCount: number;
  failedCount: number;
}

/**
 * Class for managing product synchronization with Printful
 */
export default class PrintfulProductSync {
  private printfulService: PrintfulService;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient, printfulService: PrintfulService) {
    this.printfulService = printfulService;
    this.supabase = supabase;
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
      .eq('printful_id', printfulProductId)
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

  private async getCatalogVariantId(variantId: number): Promise<number | null> {
    try {
      const variant = await this.printfulService.getVariant(variantId);
      return variant.variant_id;
    } catch (error) {
      console.error('Error fetching variant:', error);
      Sentry.captureException(error, {
        tags: { operation: 'getCatalogVariantId' }
      });
      return null;
    }
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
      thumbnail_url: printfulProduct.thumbnail_url || null,
      printful_id: printfulProduct.id,
      printful_external_id: printfulProduct.external_id,
      printful_synced: true,
      is_ignored: printfulProduct.is_ignored,
      atrocitee_active: true,
      atrocitee_featured: false,
      atrocitee_tags: [],
      atrocitee_metadata: {},
      atrocitee_base_price: basePrice,
      atrocitee_donation_amount: 0
    };
  }

  /**
   * Transform a Printful variant to our database format
   */
  private async transformPrintfulVariant(
    variant: PrintfulVariant, 
    productId: string
  ): Promise<any> {
    // Get catalog variant ID
    const catalogVariantId = await this.getCatalogVariantId(variant.id);

    // Extract options from the variant
    const options: Record<string, string> = {};
    
    if (variant.options && Array.isArray(variant.options)) {
      variant.options.forEach(option => {
        options[option.id] = option.value.toString();
      });
    }

    return {
      product_id: productId,
      name: variant.name,
      sku: variant.sku,
      retail_price: parseFloat(variant.retail_price),
      options: options,
      files: variant.files || [],
      printful_id: variant.id,
      printful_external_id: variant.external_id,
      printful_product_id: variant.sync_product_id,
      printful_synced: variant.synced || false,
      printful_catalog_variant_id: catalogVariantId,
      in_stock: true,
      currency: variant.currency || 'USD'
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
        const variantData = await this.transformPrintfulVariant(variant, product.id);
        
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
      // Get existing product data
      const { data: existingProduct, error: fetchError } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (fetchError) {
        console.error('Error fetching existing product:', fetchError);
        return false;
      }

      // Transform the new product data
      const newProductData = this.transformPrintfulProduct(printfulProduct, variants);

      // Compare and log changes
      const changes = this.detectChanges(existingProduct, newProductData);
      for (const change of changes) {
        await this.logProductChange(
          productId,
          printfulProduct.id,
          change.type,
          change.severity,
          change.field,
          change.oldValue,
          change.newValue,
          syncHistoryId
        );
      }

      // Update the product
      const { error: updateError } = await this.supabase
        .from('products')
        .update(newProductData)
        .eq('id', productId);

      if (updateError) {
        console.error('Error updating product:', updateError);
        return false;
      }

      // Update variants
      await this.syncVariants(productId, variants);

      return true;
    } catch (error) {
      console.error('Error in updateProduct:', error);
      Sentry.captureException(error, {
        tags: { operation: 'updateProduct' }
      });
      return false;
    }
  }

  private detectChanges(oldData: any, newData: any): Array<{
    type: 'price' | 'inventory' | 'metadata' | 'image' | 'variant' | 'other';
    severity: 'critical' | 'standard' | 'minor';
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }> {
    const changes: Array<{
      type: 'price' | 'inventory' | 'metadata' | 'image' | 'variant' | 'other';
      severity: 'critical' | 'standard' | 'minor';
      field: string;
      oldValue: string | null;
      newValue: string | null;
    }> = [];

    // Check critical fields
    if (oldData.name !== newData.name) {
      changes.push({
        type: 'metadata',
        severity: 'critical',
        field: 'name',
        oldValue: oldData.name,
        newValue: newData.name
      });
    }

    if (oldData.thumbnail_url !== newData.thumbnail_url) {
      changes.push({
        type: 'image',
        severity: 'critical',
        field: 'thumbnail_url',
        oldValue: oldData.thumbnail_url,
        newValue: newData.thumbnail_url
      });
    }

    // Check standard fields
    if (oldData.printful_external_id !== newData.printful_external_id) {
      changes.push({
        type: 'metadata',
        severity: 'standard',
        field: 'printful_external_id',
        oldValue: oldData.printful_external_id,
        newValue: newData.printful_external_id
      });
    }

    // Check minor fields
    if (oldData.is_ignored !== newData.is_ignored) {
      changes.push({
        type: 'metadata',
        severity: 'minor',
        field: 'is_ignored',
        oldValue: oldData.is_ignored?.toString() || null,
        newValue: newData.is_ignored?.toString() || null
      });
    }

    return changes;
  }

  /**
   * Synchronize all products from Printful to our database
   */
  async syncAllProducts(): Promise<SyncResult> {
    const startedAt = new Date().toISOString();
    let syncedCount = 0;
    let failedCount = 0;

    try {
      // Start sync process
      const syncId = await this.startSyncProcess('manual');

      // Get all products from Printful
      const products = await this.printfulService.getProducts();

      // Process each product
      for (const product of products) {
        try {
          const variants = await this.printfulService.getProductVariants(product.id);
          await this.syncProduct({ sync_product: product, sync_variants: variants });
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync product ${product.id}:`, error);
          failedCount++;
        }
      }

      // Complete sync process
      await this.completeSyncProcess(
        syncId,
        syncedCount,
        failedCount,
        failedCount === 0 ? 'success' : 'partial'
      );

      return {
        startedAt,
        completedAt: new Date().toISOString(),
        syncedCount,
        failedCount
      };
    } catch (error) {
      console.error('Error in syncAllProducts:', error);
      Sentry.captureException(error, {
        tags: { operation: 'syncAllProducts' }
      });
      throw error;
    }
  }

  private async syncProduct(printfulProduct: { sync_product: PrintfulProduct; sync_variants: PrintfulVariant[] }) {
    const { sync_product, sync_variants } = printfulProduct;

    // Check if product exists
    const existingProductId = await this.productExists(sync_product.id);

    if (existingProductId) {
      // Update existing product
      await this.updateProduct(
        existingProductId,
        sync_product,
        sync_variants,
        'manual'
      );
    } else {
      // Import new product
      await this.importProduct(
        sync_product,
        sync_variants,
        'manual'
      );
    }
  }

  private async syncVariants(productId: string, variants: any[]) {
    // Delete existing variants
    await this.supabase
      .from('product_variants')
      .delete()
      .eq('product_id', productId);

    // Create new variants
    for (const variant of variants) {
      const variantData = await this.transformPrintfulVariant(variant, productId);
      await this.supabase
        .from('product_variants')
        .insert(variantData);
    }
  }

  /**
   * Get all product change records
   */
  async getProductChanges(status?: 'pending_review' | 'approved' | 'rejected' | 'applied') {
    let query = this.supabase
      .from('printful_product_changes')
      .select(`
        *,
        products (
          id,
          name,
          printful_id
        )
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
      throw error;
    }

    return data;
  }

  /**
   * Get sync history records
   */
  async getSyncHistory(limit = 10) {
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
      throw error;
    }

    return data;
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
      throw error;
    }
  }
} 