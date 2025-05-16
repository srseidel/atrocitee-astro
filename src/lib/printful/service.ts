/**
 * Printful Service
 * 
 * High-level service for interacting with Printful API.
 * Provides business logic and abstractions on top of the raw API client.
 */

import PrintfulClient from './api-client';
import * as Sentry from '@sentry/astro';
import type { PrintfulProductList, PrintfulCatalogProduct } from '../../types/printful';
import ENV from '../../config/env';

// Singleton instance
let printfulServiceInstance: PrintfulService | null = null;

/**
 * Mock client for testing without an API key
 */
class MockPrintfulClient {
  async getSyncProducts(): Promise<any[]> {
    // Return mock products in the format that the real API returns
    return [
      { 
        id: 1, 
        external_id: 'mock-product-1',
        name: 'Mock T-shirt',
        variants: 2,
        synced: 2,
        thumbnail_url: 'https://example.com/thumbnail.jpg',
        is_ignored: false
      }
    ];
  }
  
  async getCatalogProducts(): Promise<any[]> {
    return [{ 
      id: 1, 
      title: 'Mock T-shirt', 
      type: 'T-shirt', 
      image: 'https://example.com/mock-tshirt.jpg' 
    }];
  }
  
  /**
   * Mock method for getting catalog categories
   */
  async getCatalogCategories(): Promise<any[]> {
    return [
      { id: 1, title: 'T-shirts', parent_id: null },
      { id: 2, title: 'Hoodies', parent_id: null },
      { id: 3, title: 'Accessories', parent_id: null },
      { id: 11, title: 'Men\'s T-shirts', parent_id: 1 },
      { id: 12, title: 'Women\'s T-shirts', parent_id: 1 }
    ];
  }
  
  async getSyncProduct(id: number): Promise<any> { 
    return {
      sync_product: { 
        id: id, 
        external_id: `mock-product-${id}`,
        name: 'Mock Product',
        variants: 2,
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
  
  async getCatalogVariants(): Promise<any[]> { return []; }
  async createSyncProduct(): Promise<any> { return {}; }
  async updateSyncProduct(): Promise<any> { return {}; }
  async deleteSyncProduct(): Promise<void> { /* no return */ }
}

export default class PrintfulService {
  private client: PrintfulClient | MockPrintfulClient;
  private useMock: boolean;

  constructor(apiClient?: PrintfulClient, useMock = false) {
    // Check if API key exists to determine if we should use mock
    const hasApiKey = !!ENV.PRINTFUL_API_KEY;
    this.useMock = !hasApiKey || useMock;
    
    if (this.useMock) {
      console.log('[PrintfulService] Using mock client - No API key available');
      this.client = new MockPrintfulClient();
    } else {
      console.log('[PrintfulService] Using real Printful API client');
      // Allow dependency injection for testing or use real client
      this.client = apiClient || new PrintfulClient();
    }
  }

  /**
   * Get singleton instance of the service
   */
  static getInstance(useMock = false): PrintfulService {
    if (!printfulServiceInstance) {
      printfulServiceInstance = new PrintfulService(undefined, useMock);
    }
    return printfulServiceInstance;
  }

  /**
   * Get all products from the Printful store
   */
  async getAllProducts() {
    try {
      console.log('[PrintfulService] Attempting to get all products from Printful');
      const result = await this.client.getSyncProducts();
      
      // Handle empty results safely
      if (!result || !Array.isArray(result)) {
        console.warn('[PrintfulService] Printful API returned non-array result:', result);
        return [];
      }
      
      console.log(`[PrintfulService] Successfully received ${result.length} products from Printful`);
      
      // Transform direct product format to expected structure if needed
      const transformedProducts = result.map(product => {
        // Check if the product is already in the expected format (has sync_product property)
        if (product && product.sync_product) {
          return product;
        }
        
        // If it's a direct product object (like in API response), transform it
        if (product && product.id) {
          console.log(`[PrintfulService] Transforming product to expected format: ${product.id}`);
          return {
            sync_product: product,
            sync_variants: [] // We'll fetch variants separately if needed
          };
        }
        
        // Invalid product
        console.warn('[PrintfulService] Found invalid product in Printful response:', product);
        return null;
      }).filter(Boolean); // Remove any null items
      
      if (transformedProducts.length < result.length) {
        console.warn(`[PrintfulService] Filtered out ${result.length - transformedProducts.length} invalid products`);
      }
      
      return transformedProducts;
    } catch (error) {
      console.error('[PrintfulService] Failed to get products from Printful:', error);
      console.error(error instanceof Error ? error.stack : 'No stack trace available');
      Sentry.captureException(error, {
        tags: { service: 'printful', operation: 'getAllProducts' }
      });
      // Return empty array instead of throwing to allow the sync process to complete
      return [];
    }
  }

  /**
   * Get a specific product by ID
   */
  async getProduct(id: number) {
    try {
      return await this.client.getSyncProduct(id);
    } catch (error) {
      console.error(`Failed to get product ${id} from Printful:`, error);
      Sentry.captureException(error, {
        tags: { service: 'printful', operation: 'getProduct' },
        extra: { productId: id }
      });
      throw error;
    }
  }

  /**
   * Get all available catalog products from Printful
   * These are products that can be added to your store
   */
  async getCatalogProducts() {
    try {
      return await this.client.getCatalogProducts();
    } catch (error) {
      console.error('Failed to get catalog products from Printful:', error);
      Sentry.captureException(error, {
        tags: { service: 'printful', operation: 'getCatalogProducts' }
      });
      throw error;
    }
  }

  /**
   * Get all catalog categories from Printful
   * These are the categories of products available in Printful
   */
  async getCatalogCategories() {
    try {
      console.log('[PrintfulService] Getting catalog categories');
      console.log('[PrintfulService] Using mock client:', this.useMock);
      console.log('[PrintfulService] API key available:', !!ENV.PRINTFUL_API_KEY);
      
      // If using mock client, return mock categories
      if (this.useMock) {
        console.log('[PrintfulService] Returning mock categories data');
        const mockCategories = [
          { id: 1, title: 'T-shirts', parent_id: null },
          { id: 2, title: 'Hoodies', parent_id: null },
          { id: 3, title: 'Accessories', parent_id: null },
          { id: 11, title: 'Men\'s T-shirts', parent_id: 1 },
          { id: 12, title: 'Women\'s T-shirts', parent_id: 1 }
        ];
        console.log('[PrintfulService] Mock categories:', mockCategories);
        return mockCategories;
      }
      
      console.log('[PrintfulService] Calling real Printful API for categories');
      const response = await this.client.getCatalogCategories();
      
      // Make sure we get an array back
      if (!response || !Array.isArray(response)) {
        console.error('[PrintfulService] API did not return an array of categories:', response);
        // Return empty array to prevent "not iterable" errors
        return [];
      }
      
      console.log('[PrintfulService] Received categories from API:', response.length);
      
      // Log first few categories for debugging
      if (response.length > 0) {
        console.log('[PrintfulService] Sample categories:', response.slice(0, 3));
      }
      
      return response;
    } catch (error) {
      console.error('[PrintfulService] Failed to get catalog categories from Printful:', error);
      console.error('[PrintfulService] Error details:', error instanceof Error ? error.message : String(error));
      Sentry.captureException(error, {
        tags: { service: 'printful', operation: 'getCatalogCategories' }
      });
      
      // Return empty array instead of throwing to prevent "not iterable" errors
      console.log('[PrintfulService] Returning empty array due to error');
      return [];
    }
  }

  /**
   * Get all available variants for a catalog product
   */
  async getProductVariants(productId: number) {
    try {
      return await this.client.getCatalogVariants(productId);
    } catch (error) {
      console.error(`Failed to get variants for product ${productId}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'printful', operation: 'getProductVariants' },
        extra: { productId }
      });
      throw error;
    }
  }

  /**
   * Create a new product in the Printful store
   */
  async createProduct(productData: any) {
    try {
      return await this.client.createSyncProduct(productData);
    } catch (error) {
      console.error('Failed to create product in Printful:', error);
      Sentry.captureException(error, {
        tags: { service: 'printful', operation: 'createProduct' },
        extra: { productData }
      });
      throw error;
    }
  }

  /**
   * Update an existing product in the Printful store
   */
  async updateProduct(id: number, productData: any) {
    try {
      return await this.client.updateSyncProduct(id, productData);
    } catch (error) {
      console.error(`Failed to update product ${id} in Printful:`, error);
      Sentry.captureException(error, {
        tags: { service: 'printful', operation: 'updateProduct' },
        extra: { productId: id, productData }
      });
      throw error;
    }
  }

  /**
   * Delete a product from the Printful store
   */
  async deleteProduct(id: number) {
    try {
      await this.client.deleteSyncProduct(id);
      return true;
    } catch (error) {
      console.error(`Failed to delete product ${id} from Printful:`, error);
      Sentry.captureException(error, {
        tags: { service: 'printful', operation: 'deleteProduct' },
        extra: { productId: id }
      });
      throw error;
    }
  }

  /**
   * Retrieve only T-shirt products from the catalog
   * Filters catalog products to include only t-shirts
   */
  async getTshirtProducts() {
    try {
      const allProducts = await this.client.getCatalogProducts();
      // Filter for t-shirts based on type or category
      return allProducts.filter(product => 
        product.type?.toLowerCase().includes('t-shirt') || 
        product.type?.toLowerCase().includes('tee')
      );
    } catch (error) {
      console.error('Failed to get T-shirt products from Printful:', error);
      Sentry.captureException(error, {
        tags: { service: 'printful', operation: 'getTshirtProducts' }
      });
      throw error;
    }
  }

  /**
   * Synchronize a catalog product to the store
   * This adds a product from the Printful catalog to your store
   */
  async syncCatalogProduct(catalogId: number, productData: any) {
    try {
      // Get the catalog product details first
      const catalogProduct = await this.client.getCatalogProduct(catalogId) as PrintfulCatalogProduct;
      
      // Create a new sync product with the catalog product details
      const syncProductData = {
        sync_product: {
          name: productData.name || catalogProduct.title,
          thumbnail: catalogProduct.image,
          external_id: productData.external_id || `catalog-${catalogId}`
        },
        sync_variants: productData.variants || []
      };
      
      return await this.client.createSyncProduct(syncProductData);
    } catch (error) {
      console.error(`Failed to sync catalog product ${catalogId}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'printful', operation: 'syncCatalogProduct' },
        extra: { catalogId, productData }
      });
      throw error;
    }
  }
} 