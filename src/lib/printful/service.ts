/**
 * Printful Service
 * 
 * High-level service for interacting with Printful API.
 * Provides business logic and abstractions on top of the raw API client.
 */

import * as Sentry from '@sentry/astro';
import { debug } from '@lib/utils/debug';

import type { 
  PrintfulProduct,
  PrintfulVariant,
  PrintfulResponse,
  PrintfulCatalogProduct,
  PrintfulCatalogVariant,
  PrintfulProductList
} from '../../types/printful/api';

import { supabase } from '@lib/supabase/client';
import { env } from '@lib/config/env';
import { PrintfulClient } from '@lib/printful/api-client';
import type { Database } from '../../types/database/schema';

/**
 * Mock client for testing without an API key
 */
class MockPrintfulClient {
  async getSyncProducts(): Promise<PrintfulProductList[]> {
    // Return mock products in the format that the real API returns
    return [
      { 
        result: {
          sync_product: {
            id: 1, 
            external_id: 'mock-product-1',
            name: 'Mock T-shirt',
            variants_count: 2,
            synced: 2,
            thumbnail_url: 'https://example.com/thumbnail.jpg',
            is_ignored: false
          },
          sync_variants: []
        }
      }
    ];
  }
  
  async getCatalogProducts(): Promise<PrintfulCatalogProduct[]> {
    return [{ 
      id: 1, 
      title: 'Mock T-shirt', 
      type: 'T-shirt',
      type_name: 'T-Shirt',
      brand: 'Mock Brand',
      model: 'Mock Model',
      image: 'https://example.com/mock-tshirt.jpg',
      description: 'A mock t-shirt for testing',
      main_category_id: 1,
      variant_count: 1,
      currency: 'USD',
      files: [],
      options: [],
      dimensions: {
        front: { width: 100, height: 100 }
      }
    }];
  }
  
  /**
   * Mock method for getting catalog categories
   */
  async getCatalogCategories(): Promise<Array<{ id: number; title: string; parent_id: number | null }>> {
    return [
      { id: 1, title: 'T-shirts', parent_id: null },
      { id: 2, title: 'Hoodies', parent_id: null },
      { id: 3, title: 'Accessories', parent_id: null },
      { id: 11, title: 'Men\'s T-shirts', parent_id: 1 },
      { id: 12, title: 'Women\'s T-shirts', parent_id: 1 }
    ];
  }
  
  async getSyncProduct(id: number): Promise<PrintfulProductList> { 
    return {
      result: {
        sync_product: { 
          id: id, 
          external_id: `mock-product-${id}`,
          name: 'Mock Product',
          variants_count: 2,
          synced: 2,
          thumbnail_url: 'https://example.com/thumbnail.jpg',
          is_ignored: false
        }, 
        sync_variants: [
          { 
            id: 1,
            external_id: 'mock-variant-1',
            sync_product_id: id,
            name: 'Mock Product - S / Black',
            synced: true,
            variant_id: 101,
            main_category_id: 12,
            warehouse_product_variant_id: 1001,
            retail_price: '24.99',
            sku: 'MOCK-TS-S-BLK',
            currency: 'USD',
            in_stock: true,
            product: {
              variant_id: 101,
              product_id: id,
              image: 'https://example.com/mock-product.jpg',
              name: 'Black T-shirt S'
            },
            files: [],
            options: [{id: 'size', value: 'S'}, {id: 'color', value: 'Black'}],
            is_ignored: false
          }
        ] 
      }
    };
  }
  
  async getCatalogProduct(): Promise<PrintfulCatalogProduct> { 
    return {
      id: 1,
      title: 'Mock Product',
      type: 'T-shirt',
      type_name: 'T-Shirt',
      brand: 'Mock Brand',
      model: 'Mock Model',
      image: 'https://example.com/mock-image.jpg',
      description: 'A mock product for testing',
      main_category_id: 1,
      variant_count: 1,
      currency: 'USD',
      files: [],
      options: [],
      dimensions: {
        front: { width: 100, height: 100 }
      }
    }; 
  }
  
  async getCatalogVariants(): Promise<PrintfulCatalogVariant[]> { return []; }
  async createSyncProduct(): Promise<PrintfulProductList> { return { result: { sync_product: {} as PrintfulProduct, sync_variants: [] } }; }
  async updateSyncProduct(): Promise<PrintfulProductList> { return { result: { sync_product: {} as PrintfulProduct, sync_variants: [] } }; }
  async deleteSyncProduct(): Promise<void> { /* no return */ }
}

export class PrintfulService {
  private static instance: PrintfulService;
  private apiKey: string;
  private baseUrl: string;

  private constructor() {
    this.apiKey = env.printful.apiKey || '';
    this.baseUrl = 'https://api.printful.com';
    
    if (!this.apiKey) {
      throw new Error('Missing Printful API Key');
    }

    // eslint-disable-next-line no-console
    debug.log('Printful service initialized');
  }

  public static getInstance(): PrintfulService {
    if (!PrintfulService.instance) {
      PrintfulService.instance = new PrintfulService();
    }
    return PrintfulService.instance;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // eslint-disable-next-line no-console
    debug.log('Making Printful API request', {
      url,
      method: options.method || 'GET',
      hasAuthHeader: !!headers.Authorization,
      authHeaderLength: headers.Authorization.length
    });

    try {
      const response = await fetch(url, { ...options, headers });
      const responseText = await response.text();
      
      // eslint-disable-next-line no-console
      debug.log('Printful API response', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });

      if (!response.ok) {
        throw new Error(`Printful API error: ${response.statusText} - ${responseText}`);
      }

      return JSON.parse(responseText);
    } catch (error) {
      // eslint-disable-next-line no-console
      debug.criticalError('Printful API request failed', error, {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  // Get all products from Printful
  async getProducts(): Promise<PrintfulProduct[]> {
    const response = await this.fetch<{ result: PrintfulProduct[] }>('/sync/products');
    return response.result;
  }

  // Get a specific product by ID
  async getProduct(productId: number): Promise<PrintfulProduct> {
    const response = await this.fetch<{ result: PrintfulProduct }>(`/sync/products/${productId}`);
    return response.result;
  }

  // Get a specific variant by ID
  async getVariant(variantId: number): Promise<PrintfulVariant> {
    const response = await this.fetch<{ result: PrintfulVariant }>(`/sync/variants/${variantId}`);
    return response.result;
  }

  /**
   * Get the catalog ID for a product
   * This is important because the mockup generator API requires a catalog ID, not a sync product ID
   */
  async getCatalogIdForProduct(syncProductId: number): Promise<number> {
    try {
      // For now, we'll use a simpler approach - just return the product ID
      // The API will tell us if it's wrong, and we can enhance this method later
      // with proper lookups between sync products and catalog products
      
      // In the future, we could improve this by:
      // 1. Getting the sync product details
      // 2. Looking up the related catalog product by external_id or other attributes
      // 3. Returning the correct catalog ID
      
      debug.log('Using product ID as catalog ID for mockup generation', { syncProductId });
      
      // Try to use the catalog products endpoint to validate the ID
      try {
        const response = await this.fetch<any>(`/catalog/products/${syncProductId}`);
        if (response && response.result && response.result.id) {
          debug.log('Confirmed catalog ID for product', { catalogId: response.result.id, syncProductId });
          return response.result.id;
        }
      } catch (catalogError) {
        debug.warn('Could not validate catalog ID, using original ID', { syncProductId, error: catalogError });
      }
      
      return syncProductId;
    } catch (error) {
      debug.criticalError('Error getting catalog ID for product', error, { syncProductId });
      // Return the original ID as a fallback
      return syncProductId;
    }
  }
  
  /**
   * Get the parent product ID for a variant
   * This is needed because the mockup generator API requires the parent product ID
   */
  async getParentProductIdForVariant(variantId: number): Promise<number | null> {
    try {
      // Try to get the variant details
      const response = await this.fetch<any>(`/sync/variants/${variantId}`);
      
      if (response && response.result && response.result.sync_product_id) {
        return response.result.sync_product_id;
      }
      
      if (response && response.result && response.result.product && response.result.product.product_id) {
        return response.result.product.product_id;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting parent product ID for variant ${variantId}:`, error);
      return null;
    }
  }

  /**
   * Get available templates for a product
   * @param productId The Printful catalog product ID
   */
  async getProductTemplates(productId: number): Promise<{
    variant_mapping: Array<{
      variant_id: number;
      templates: Array<{
        placement: string;
        template_id: number;
      }>;
    }>;
    templates: Array<{
      template_id: number;
      placement?: string;
      image_url: string;
      background_color: string;
      printfile_id: number;
    }>;
  }> {
    try {
      const response = await this.fetch<any>(`/mockup-generator/templates/${productId}`);
      return response.result;
    } catch (error) {
      console.error('Error getting product templates:', error);
      return { variant_mapping: [], templates: [] };
    }
  }

  /**
   * Get the catalog product ID from a sync product ID
   * This is important because the mockup generator requires catalog IDs
   */
  async getCatalogProductId(syncProductId: number): Promise<number> {
    try {
      console.log(`Getting catalog product ID for sync product ${syncProductId}`);
      
      // Get the sync product details
      const response = await this.fetch<any>(`/sync/products/${syncProductId}`);
      
      if (!response.result?.sync_variants?.[0]?.product?.product_id) {
        throw new Error(`Could not find catalog product ID for sync product ${syncProductId}`);
      }
      
      // Extract the catalog product ID from the first variant
      const catalogProductId = response.result.sync_variants[0].product.product_id;
      console.log(`Found catalog product ID ${catalogProductId} from sync product ${syncProductId}`);
      
      return catalogProductId;
    } catch (error) {
      console.error('Error getting catalog product ID:', error);
      throw error;
    }
  }

  /**
   * Create a mockup generation task using Printful's Mockup Generator API
   * @see https://developers.printful.com/docs/#tag/Mockup-Generator-API/operation/createGeneratorTask
   * 
   * @param syncProductId The Printful sync product ID 
   * @param variantId The Printful variant ID to generate mockup for
   * @param options Options for the mockup generation
   * @returns Object with task_key and status
   */
  async createMockupGenerationTask(
    syncProductId: number,
    variantId: number,
    options: {
      position?: string;
      variantExternalId?: string;
      format?: 'jpg' | 'png';
      files?: Array<{
        placement: string;
        image_url: string;
        position?: {
          area_width: number;
          area_height: number;
          width: number;
          height: number;
          top: number;
          left: number;
          limit_to_print_area?: boolean;
        };
      }>;
    } = {}
  ): Promise<{ task_key: string; status: string }> {
    try {
      console.log(`Creating mockup task for catalog product ${syncProductId}, variant ${variantId}, view: ${options.position}`);
      
      // First check if we have the external ID in the options
      if (!options.variantExternalId) {
        throw new Error(`External ID is required for mockup generation but was not provided. Please ensure variantExternalId is set.`);
      }
      
      console.log(`Using external ID: ${options.variantExternalId}`);
      
      // Get the catalog product ID (required for mockup generation)
      const catalogProductId = await this.getCatalogProductId(syncProductId);
      
      // Get the available templates for this product
      const templatesResponse = await this.fetch<any>(`/mockup-generator/templates/${catalogProductId}`);
      
      if (!templatesResponse.result?.templates) {
        throw new Error(`No templates found for product ${catalogProductId}`);
      }
      
      // Log all available templates to help debug template issues
      console.log(`Available templates for product ${catalogProductId}:`, 
        templatesResponse.result.templates.map((t: any) => ({ 
          id: t.template_id, 
          placement: t.placement,
          printfile_id: t.printfile_id
        }))
      );
      
      // Log variant mappings
      if (templatesResponse.result.variant_mapping) {
        console.log(`Available variant mappings:`, 
          templatesResponse.result.variant_mapping.map((v: any) => ({
            variant_id: v.variant_id,
            templates: v.templates?.map((t: any) => ({ 
              template_id: t.template_id, 
              placement: t.placement 
            }))
          }))
        );
      }
      
      // Get sync variant details to find the catalog variant_id
      let syncVariantResponse;
      try {
        syncVariantResponse = await this.fetch<any>(`/sync/products/${syncProductId}`);
      } catch (error) {
        console.warn(`Could not get sync product details: ${error}`);
      }
      
      // Find the catalog variant ID from the sync product response
      let catalogVariantId: number | undefined;
      if (syncVariantResponse?.result?.sync_variants) {
        const matchingSyncVariant = syncVariantResponse.result.sync_variants.find(
          (v: any) => v.id === variantId || v.external_id === options.variantExternalId
        );
        
        if (matchingSyncVariant?.variant_id) {
          catalogVariantId = matchingSyncVariant.variant_id;
          console.log(`Found catalog variant ID ${catalogVariantId} from sync variant ${variantId}`);
        }
      }
      
      if (!catalogVariantId) {
        console.warn(`Could not find catalog variant ID for sync variant ${variantId}, will attempt to use default templates`);
      }
      
      // Find the variant mapping for our specific variant
      const variantMapping = templatesResponse.result.variant_mapping?.find(
        (mapping: any) => mapping.variant_id === catalogVariantId
      );
      
      // If no mapping found for this specific variant, use a generic approach
      if (!variantMapping) {
        console.log(`No specific mapping found for variant ${catalogVariantId}, will use generic templates`);
      }
      
      // Find a matching template for the requested position
      const desiredPosition = options.position || 'front';
      let templateId: number | null = null;
      let placement: string | null = null;
      
      // If we have a variant mapping, use it to find the correct template
      if (variantMapping && variantMapping.templates && variantMapping.templates.length > 0) {
        // Try to find a template for the requested position
        const template = variantMapping.templates.find(
          (t: any) => t.placement?.toLowerCase() === desiredPosition.toLowerCase() || 
                    t.placement?.toLowerCase().includes(desiredPosition.toLowerCase())
        );
        
        if (template) {
          templateId = template.template_id;
          placement = template.placement;
          console.log(`Using variant-specific template ${templateId} (${template.placement}) for position: ${desiredPosition}`);
        } else {
          // Use the first template for this variant
          templateId = variantMapping.templates[0].template_id;
          placement = variantMapping.templates[0].placement;
          console.log(`No template found for position '${desiredPosition}', using first variant-specific template: ${templateId}`);
        }
      } else {
        // If no variant mapping, look for templates with matching placement
        for (const template of templatesResponse.result.templates) {
          if (template.placement?.toLowerCase() === desiredPosition.toLowerCase() || 
              template.placement?.toLowerCase().includes(desiredPosition.toLowerCase())) {
            templateId = template.template_id;
            placement = template.placement;
            console.log(`Using generic template ${templateId} (${template.placement}) for position: ${desiredPosition}`);
            break;
          }
        }
        
        // If still no match, use the first available template
        if (!templateId && templatesResponse.result.templates.length > 0) {
          templateId = templatesResponse.result.templates[0].template_id;
          placement = templatesResponse.result.templates[0].placement || 'default';
          console.log(`No template found for position '${desiredPosition}', using first available template: ${templateId}`);
        }
      }
      
      if (!templateId && !options.files?.length) {
        throw new Error(`No template found for position '${desiredPosition}' and no files provided`);
      }
      
      // Prepare the request data
      const requestData: any = {
        format: options.format || 'jpg',
      };
      
      // Add variant_ids and external_ids
      if (catalogVariantId) {
        requestData.variant_ids = [catalogVariantId];
      }
      
      if (options.variantExternalId) {
        requestData.external_ids = [options.variantExternalId];
      }

      // Add files if provided (needed for custom artwork)
      if (options.files && options.files.length > 0) {
        requestData.files = options.files;
      }
      // If no files are provided, use template_id
      else if (templateId) {
        requestData.template_id = templateId;
      }
      // If neither files nor template_id, use a default placeholder file
      else {
        // Use a default placeholder image - this ensures we always have at least one of the required parameters
        requestData.files = [
          {
            placement: placement || 'front',
            image_url: 'https://files.cdn.printful.com/upload/generator/a7g2-mockup-generator-4d0f4.png'
          }
        ];
      }

      console.log(`Request data: ${JSON.stringify(requestData, null, 2)}`);

      // Make the API request to create a mockup task
      const response = await this.fetch<any>(`/mockup-generator/create-task/${catalogProductId}`, {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      console.log(`Mockup task created successfully: ${JSON.stringify(response.result)}`);
      return response.result;
    } catch (error) {
      console.error('Error creating mockup generation task:', error);
      throw error;
    }
  }
  
  /**
   * Get mockup generation task status and results
   * @see https://developers.printful.com/docs/#tag/Mockup-Generator-API/operation/getGeneratorTask
   */
  async getMockupGenerationTask(taskKey: string): Promise<any> {
    const response = await this.fetch<any>(`/mockup-generator/task?task_key=${taskKey}`);
    return response.result;
  }

  /**
   * Get product variant printfiles (required before generating mockups)
   * @see https://developers.printful.com/docs/#tag/Mockup-Generator-API/operation/getPrintfiles
   */
  async getProductPrintfiles(productId: number): Promise<any> {
    const response = await this.fetch<any>(`/mockup-generator/printfiles/${productId}`);
    return response.result;
  }

  /**
   * Get variants for a specific product
   */
  async getProductVariants(productId: number): Promise<PrintfulVariant[]> {
    try {
      // Use the sync product endpoint to get both product and variants
      const response = await this.fetch<PrintfulProductList>(`/sync/products/${productId}`);
      return response.result.sync_variants;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching product variants:', error);
      throw error;
    }
  }

  // Get catalog categories from Printful
  async getCatalogCategories(): Promise<Array<{ id: number; title: string; parent_id: number | null }>> {
    const response = await this.fetch<{ result: Array<{ id: number; title: string; parent_id: number | null }> }>('/store/categories');
    return response.result;
  }

  /**
   * Generate mockups for a product variant
   * @param productId The Printful product ID
   * @param variantIds Array of variant IDs to generate mockups for
   * @param imageUrl URL of the design image to use for the mockup
   * @param placement The placement of the design (e.g., 'front', 'back', etc.)
   * @returns Array of mockup URLs
   */
  async generateMockups(
    productId: number, 
    variantIds: number[], 
    imageUrl: string,
    placement: string = 'front'
  ): Promise<string[]> {
    try {
      // 1. Get printfiles to understand the required dimensions
      const printfilesResponse = await this.fetch<any>(`/mockup-generator/printfiles/${productId}`);
      const printfiles = printfilesResponse.result.printfiles;
      
      // Find the printfile for the requested placement
      const printfile = printfiles.find((pf: any) => pf.placement === placement) || printfiles[0];
      
      if (!printfile) {
        throw new Error(`No printfile found for product ${productId} with placement ${placement}`);
      }
      
      console.log(`Using printfile for ${placement}:`, {
        width: printfile.width,
        height: printfile.height
      });
      
      // 2. Create mockup generation task with new method
      const taskResponse = await this.createMockupGenerationTask(productId, variantIds[0], {
        format: 'jpg',
        files: [{
          placement: placement,
          image_url: imageUrl,
          position: {
            area_width: printfile.width,
            area_height: printfile.height,
            width: printfile.width,
            height: printfile.height,
            top: 0,
            left: 0,
            limit_to_print_area: true
          }
        }]
      });

      const taskKey = taskResponse.task_key;

      // 3. Poll for task completion
      let mockupUrls: string[] = [];
      let attempts = 0;
      const maxAttempts = 10;
      const delay = 2000; // 2 seconds between checks

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const taskResult = await this.getMockupGenerationTask(taskKey);
        
        if (taskResult.status === 'completed') {
          mockupUrls = taskResult.mockups.map((mockup: any) => mockup.mockup_url);
          break;
        } else if (taskResult.status === 'failed') {
          throw new Error(`Mockup generation failed: ${taskResult.error || 'Unknown error'}`);
        }
        
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Mockup generation timed out');
      }

      return mockupUrls;
    } catch (error) {
      console.error('Error generating mockups:', error);
      throw error;
    }
  }

  /**
   * Create multiple mockup generation tasks with rate limiting
   * Respects Printful's rate limit of 2 requests per 60 seconds
   * 
   * @param productId The Printful product ID
   * @param variantId The Printful variant ID
   * @param options Mockup generation options with multiple views
   * @param onProgress Optional callback for progress updates
   * @returns Array of created tasks with their views
   */
  async createBatchMockupTasks(
    productId: number,
    variantId: number,
    options: {
      views: string[];
      variantExternalId?: string;
      format?: 'jpg' | 'png';
    },
    onProgress?: (progress: { completed: number; total: number; currentView: string; }) => void
  ): Promise<Array<{ view: string; task_key: string; status: string }>> {
    const { views, variantExternalId, format = 'jpg' } = options;
    const results: Array<{ view: string; task_key: string; status: string }> = [];
    const total = views.length;
    
    // Respect Printful's rate limit of 2 requests per 60 seconds
    const RATE_LIMIT = 2; // requests
    const RESET_PERIOD = 60000; // 60 seconds in ms
    // Add 10% buffer to be safe with rate limits
    const REQUEST_SPACING = Math.ceil((RESET_PERIOD / RATE_LIMIT) * 1.1);
    
    // Process views in batches
    for (let i = 0; i < views.length; i++) {
      const view = views[i];
      
      try {
        // Call progress callback
        if (onProgress) {
          onProgress({
            completed: i,
            total,
            currentView: view
          });
        }
        
        // Create the mockup task
        const task = await this.createMockupGenerationTask(
          productId,
          variantId,
          {
            position: view,
            variantExternalId,
            format
          }
        );
        
        // Store the result
        results.push({
          view,
          task_key: task.task_key,
          status: task.status
        });
        
        // If not the last item, wait before making the next request
        // This ensures we respect Printful's rate limit
        if (i < views.length - 1) {
          console.log(`Waiting ${REQUEST_SPACING}ms before next request to respect rate limits...`);
          await new Promise(resolve => setTimeout(resolve, REQUEST_SPACING));
        }
      } catch (error) {
        // If we hit a rate limit error, extract retry-after time if available or wait the full reset period
        if (error instanceof Error && error.message.includes('Too Many Requests')) {
          // Try to parse the retry-after value from the error message
          let retryAfterSeconds = 60; // Default to 60 seconds
          try {
            const match = error.message.match(/try again after (\d+) seconds/i);
            if (match && match[1]) {
              retryAfterSeconds = parseInt(match[1], 10);
              console.log(`Rate limit hit, server requested retry after ${retryAfterSeconds} seconds`);
            } else {
              console.log('Rate limit hit, using default wait period...');
            }
          } catch (parseError) {
            console.log('Failed to parse retry-after value, using default wait period');
          }
          
          // Wait for the specified time plus a small buffer
          const waitTime = (retryAfterSeconds * 1000) + 1000; // Add 1 second buffer
          console.log(`Waiting ${waitTime/1000} seconds before retrying...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Retry this view (decrement i to try again)
          i--;
          continue;
        }
        
        // For other errors, log and continue with next view
        console.error(`Error creating mockup for view ${view}:`, error);
        
        // Still push a result with error status
        results.push({
          view,
          task_key: '',
          status: 'error'
        });
      }
    }
    
    // Call progress callback with completion
    if (onProgress) {
      onProgress({
        completed: total,
        total,
        currentView: 'complete'
      });
    }
    
    return results;
  }
} 