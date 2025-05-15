/**
 * Printful API Client
 * 
 * Handles communication with the Printful API with built-in retry logic,
 * error handling, and type safety.
 */

import ENV from '../../config/env';
import * as Sentry from '@sentry/astro';
import type { PrintfulResponse, PrintfulProductList, PrintfulCatalogProduct, PrintfulCatalogVariant } from '../../types/printful';

// Configuration
const API_BASE_URL = 'https://api.printful.com';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Start with 1 second delay
const RETRY_BACKOFF_FACTOR = 2; // Exponential backoff

/**
 * Error class for Printful API errors
 */
export class PrintfulApiError extends Error {
  public code: number;
  public reason?: string;

  constructor(message: string, code: number, reason?: string) {
    super(message);
    this.name = 'PrintfulApiError';
    this.code = code;
    this.reason = reason;

    // Capture in Sentry
    Sentry.captureException(this, {
      tags: {
        api: 'printful',
        code: code.toString()
      },
      extra: {
        reason
      }
    });
  }
}

/**
 * Main Printful API client
 */
export default class PrintfulClient {
  private apiKey: string;
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(apiKey = ENV.PRINTFUL_API_KEY, baseUrl = API_BASE_URL) {
    // Add debug logging for environment variables
    console.log('[Printful] Environment check:', {
      apiKeyExists: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      nodeEnv: ENV.NODE_ENV
    });

    if (!apiKey) {
      console.error('[Printful] ERROR: API key is missing or empty');
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-PF-API-Location': 'us-east',
    };
  }

  /**
   * Make an API request to Printful with retry logic
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    retries = MAX_RETRIES
  ): Promise<PrintfulResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    // Validate API key before making request
    if (!this.apiKey) {
      const error = new PrintfulApiError(
        'Printful API key is missing. Make sure PRINTFUL_API_KEY is set in your environment variables.',
        401,
        'missing_api_key'
      );
      console.error('[Printful] Authentication error:', error);
      throw error;
    }
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
      },
    };

    console.log(`[Printful] Making request to: ${endpoint} with API key: ${this.apiKey ? this.apiKey.substring(0, 4) + '...' : 'missing'}`);

    try {
      console.log(`[Printful] Sending request to: ${url}`);
      const response = await fetch(url, requestOptions);
      
      // Debug HTTP status
      console.log(`[Printful] Response status: ${response.status}`);
      
      // Log full response for debugging if there's an issue
      const responseText = await response.text();
      console.log(`[Printful] Raw response: ${responseText}`);
      
      // Parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText) as PrintfulResponse<T>;
      } catch (parseError) {
        console.error(`[Printful] Error parsing JSON response: ${parseError}`);
        console.error(`[Printful] Response text: ${responseText}`);
        throw new PrintfulApiError(
          `Failed to parse Printful API response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`,
          500,
          'json_parse_error'
        );
      }

      // Check if the API returned an error
      if (data.error) {
        throw new PrintfulApiError(
          data.error.message,
          data.error.code,
          data.error.reason
        );
      }

      return data;
    } catch (error) {
      // If we have retries left and it's a network error or a 429/5xx status code
      if (retries > 0 && this.shouldRetry(error)) {
        const delayMs = RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF_FACTOR, MAX_RETRIES - retries);
        
        console.warn(`Printful API request failed, retrying in ${delayMs}ms...`, { endpoint, error });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Retry the request with one less retry attempt
        return this.request<T>(endpoint, options, retries - 1);
      }

      // No more retries or not a retryable error, rethrow
      if (error instanceof PrintfulApiError) {
        throw error;
      } else if (error instanceof Error) {
        throw new PrintfulApiError(
          `Printful API request failed: ${error.message}`,
          500,
          'network_error'
        );
      } else {
        throw new PrintfulApiError(
          'Unknown error occurred during Printful API request',
          500
        );
      }
    }
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: unknown): boolean {
    // Retry on network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    // Retry on rate limiting (429) and server errors (5xx)
    if (error instanceof PrintfulApiError) {
      const code = error.code;
      return code === 429 || (code >= 500 && code < 600);
    }

    return false;
  }

  /**
   * Get a list of sync products
   */
  async getSyncProducts(): Promise<PrintfulProductList[]> {
    const response = await this.request<PrintfulProductList[]>('/store/products');
    return response.result;
  }

  /**
   * Get a specific sync product by ID
   */
  async getSyncProduct(id: number): Promise<PrintfulProductList> {
    const response = await this.request<PrintfulProductList>(`/store/products/${id}`);
    return response.result;
  }

  /**
   * Get catalog products (available for creation)
   */
  async getCatalogProducts(): Promise<PrintfulCatalogProduct[]> {
    const response = await this.request<PrintfulCatalogProduct[]>('/products');
    return response.result;
  }

  /**
   * Get a specific catalog product
   */
  async getCatalogProduct(id: number): Promise<PrintfulCatalogProduct> {
    const response = await this.request<PrintfulCatalogProduct>(`/products/${id}`);
    return response.result;
  }

  /**
   * Get variants for a catalog product
   */
  async getCatalogVariants(productId: number): Promise<PrintfulCatalogVariant[]> {
    const response = await this.request<PrintfulCatalogVariant[]>(`/products/${productId}/variants`);
    return response.result;
  }

  /**
   * Create a new sync product
   */
  async createSyncProduct(productData: any): Promise<PrintfulProductList> {
    const response = await this.request<PrintfulProductList>('/store/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    return response.result;
  }

  /**
   * Update a sync product
   */
  async updateSyncProduct(id: number, productData: any): Promise<PrintfulProductList> {
    const response = await this.request<PrintfulProductList>(`/store/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    return response.result;
  }

  /**
   * Delete a sync product
   */
  async deleteSyncProduct(id: number): Promise<void> {
    await this.request<void>(`/store/products/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all catalog categories
   * Returns a list of categories from Printful catalog
   */
  async getCatalogCategories(): Promise<any[]> {
    try {
      console.log('[Printful] Getting catalog categories');
      const response = await this.request<any>('/categories');
      
      // Validate the response structure
      if (!response || !response.result) {
        console.error('[Printful] Invalid response structure:', response);
        return [];
      }
      
      // Handle nested categories array
      if (response.result.categories && Array.isArray(response.result.categories)) {
        console.log(`[Printful] Successfully retrieved ${response.result.categories.length} categories`);
        return response.result.categories;
      }
      
      // If no nested structure but result is an array
      if (Array.isArray(response.result)) {
        console.log(`[Printful] Successfully retrieved ${response.result.length} categories`);
        return response.result;
      }
      
      console.error('[Printful] Unexpected categories structure:', response.result);
      return [];
    } catch (error) {
      console.error('[Printful] Error fetching categories:', error);
      // Return empty array on error
      return [];
    }
  }
} 