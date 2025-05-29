/**
 * Printful Service
 * 
 * High-level service for interacting with Printful API.
 * Provides business logic and abstractions on top of the raw API client.
 */

import * as Sentry from '@sentry/astro';

import type { 
  PrintfulProduct,
  PrintfulVariant,
  PrintfulResponse,
  PrintfulCatalogProduct,
  PrintfulCatalogVariant,
  PrintfulProductList
} from '../../types/printful/api';

import pkg from '@supabase/supabase-js';

import ENV from '@config/env';

import PrintfulClient from '@lib/printful/api-client';

const { createClient } = pkg;
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
  private supabase: ReturnType<typeof createClient<Database>>;

  private constructor() {
    this.apiKey = ENV.PRINTFUL_API_KEY || '';
    this.baseUrl = 'https://api.printful.com';
    
    const supabaseUrl = ENV.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = ENV.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase URL or Anon Key');
    }
    
    if (!this.apiKey) {
      throw new Error('Missing Printful API Key');
    }

    // eslint-disable-next-line no-console
    console.log("Printful service initialized");
    
    this.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
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
    console.log('[DEBUG] Making Printful API request:', {
      url,
      method: options.method || 'GET',
      hasAuthHeader: !!headers.Authorization,
      authHeaderLength: headers.Authorization.length
    });

    try {
      const response = await fetch(url, { ...options, headers });
      const responseText = await response.text();
      
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Printful API response:', {
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
      console.log('[DEBUG] Printful API request failed:', {
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
   * Get variants for a specific product
   */
  async getProductVariants(productId: number): Promise<PrintfulVariant[]> {
    try {
      // Use the sync product endpoint to get both product and variants
      const response = await this.fetch<PrintfulProductList>(`/store/products/${productId}`);
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
} 