/**
 * Printful API Client
 * 
 * Handles communication with the Printful API with built-in retry logic,
 * error handling, and type safety.
 */

import * as Sentry from '@sentry/astro';
import env from '@config/env';

import type { 
  PrintfulResponse, 
  PrintfulProductList, 
  PrintfulCatalogProduct, 
  PrintfulCatalogVariant,
  PrintfulCategory,
  PrintfulProductData
} from '@local-types/printful/index';

// Configuration
const API_BASE_URL = 'https://api.printful.com';
const SANDBOX_API_BASE_URL = 'https://api.printful.com'; // Printful uses same URL with sandbox flag
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
export class PrintfulClient {
  private apiKey: string;
  private baseUrl: string;
  private headers: HeadersInit;
  private sandboxMode: boolean;

  constructor(apiKey = env.PRINTFUL_API_KEY, sandboxMode = env.PRINTFUL_SANDBOX_MODE) {
    this.sandboxMode = sandboxMode;
    
    // Add debug logging for environment variables
    // eslint-disable-next-line no-console
    console.log('[Printful] Environment check:', {
      apiKeyExists: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      nodeEnv: env.NODE_ENV,
      sandboxMode: this.sandboxMode
    });

    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.error('[Printful] ERROR: API key is missing or empty');
    }

    this.apiKey = apiKey;
    this.baseUrl = sandboxMode ? SANDBOX_API_BASE_URL : API_BASE_URL;
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-PF-API-Location': 'us-east',
      // Add sandbox header when in sandbox mode
      ...(this.sandboxMode && { 'X-PF-Sandbox': '1' }),
    };

    // eslint-disable-next-line no-console
    console.log(`[Printful] API client initialized in ${sandboxMode ? 'SANDBOX' : 'PRODUCTION'} mode`);
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
      // eslint-disable-next-line no-console
      console.error('[Printful] Authentication error:', error);
      throw error;
    }
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
      },
    };

    // eslint-disable-next-line no-console
    console.log(`[Printful] Making request to: ${endpoint}`);

    try {
      const response = await fetch(url, requestOptions);
      const responseText = await response.text();
      
      // Debug HTTP status and response
      // eslint-disable-next-line no-console
      console.log(`[Printful] Response status: ${response.status}`);
      // eslint-disable-next-line no-console
      console.log(`[Printful] Raw response: ${responseText}`);
      
      // Parse the response as JSON
      let data: PrintfulResponse<T>;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // eslint-disable-next-line no-console
        console.error('[Printful] Error parsing JSON response:', parseError);
        throw new PrintfulApiError(
          `Failed to parse Printful API response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`,
          500,
          'json_parse_error'
        );
      }

      // Check if the API returned an error
      if (!data || typeof data !== 'object') {
        throw new PrintfulApiError(
          'Invalid response format from Printful API',
          500,
          'invalid_response'
        );
      }

      if (data.error) {
        throw new PrintfulApiError(
          data.error.message || 'Unknown error from Printful API',
          data.error.code || 500,
          data.error.reason || 'api_error'
        );
      }

      if (!data.result) {
        throw new PrintfulApiError(
          'No result data in Printful API response',
          500,
          'missing_result'
        );
      }

      return data;
    } catch (error) {
      // If we have retries left and it's a network error or a 429/5xx status code
      if (retries > 0 && this.shouldRetry(error)) {
        const delayMs = RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF_FACTOR, MAX_RETRIES - retries);
        
        // eslint-disable-next-line no-console
        console.warn(`[Printful] Request failed, retrying in ${delayMs}ms...`, { endpoint, error });
        
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
          500,
          'unknown_error'
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
    const response = await this.request<PrintfulProductList[]>('/sync/products');
    return response.result;
  }

  /**
   * Get a specific sync product by ID
   */
  async getSyncProduct(id: number): Promise<PrintfulProductList> {
    const response = await this.request<PrintfulProductList>(`/sync/products/${id}`);
    return response.result;
  }

  /**
   * Get catalog products (available for creation)
   */
  async getCatalogProducts(): Promise<PrintfulCatalogProduct[]> {
    const response = await this.request<PrintfulCatalogProduct[]>('/catalog/products');
    return response.result;
  }

  /**
   * Get a specific catalog product
   */
  async getCatalogProduct(id: number): Promise<PrintfulCatalogProduct> {
    const response = await this.request<PrintfulCatalogProduct>(`/catalog/products/${id}`);
    return response.result;
  }

  /**
   * Get variants for a catalog product
   */
  async getCatalogVariants(productId: number): Promise<PrintfulCatalogVariant[]> {
    const response = await this.request<PrintfulCatalogVariant[]>(`/catalog/products/${productId}/variants`);
    return response.result;
  }

  /**
   * Create a new sync product
   */
  async createSyncProduct(productData: PrintfulProductData): Promise<PrintfulProductList> {
    const response = await this.request<PrintfulProductList>(
      '/store/products',
      {
        method: 'POST',
        body: JSON.stringify(productData)
      }
    );
    return response.result;
  }

  /**
   * Update an existing sync product
   */
  async updateSyncProduct(id: number, productData: PrintfulProductData): Promise<PrintfulProductList> {
    const response = await this.request<PrintfulProductList>(
      `/store/products/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(productData)
      }
    );
    return response.result;
  }

  /**
   * Delete a sync product
   */
  async deleteSyncProduct(id: number): Promise<void> {
    await this.request<void>(
      `/store/products/${id}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Get catalog categories
   */
  async getCatalogCategories(): Promise<PrintfulCategory[]> {
    const response = await this.request<PrintfulCategory[]>(
      '/store/categories'
    );
    return response.result;
  }

  /**
   * Get printfiles for a product (required for mockup generation)
   */
  async getPrintfiles(productId: number): Promise<any> {
    const response = await this.request<any>(`/mockup-generator/printfiles/${productId}`);
    return response.result;
  }

  /**
   * Create a mockup generation task
   */
  async createMockupTask(productId: number, variantIds: number[], files: Array<{
    placement: string;
    image_url: string;
    position?: {
      area_width: number;
      area_height: number;
      width: number;
      height: number;
      top: number;
      left: number;
    };
  }>) {
    const response = await this.request<any>(
      `/mockup-generator/create-task/${productId}`,
      {
        method: 'POST',
        body: JSON.stringify({
          variant_ids: variantIds,
          format: 'jpg',
          files
        })
      }
    );
    return response.result;
  }

  /**
   * Get mockup generation task result
   */
  async getMockupTask(taskKey: string): Promise<any> {
    const response = await this.request<any>(`/mockup-generator/task?task_key=${taskKey}`);
    return response.result;
  }

  /**
   * Submit an order to Printful
   */
  async submitOrder<T>(orderData: unknown): Promise<PrintfulResponse<T>> {
    return await this.request<T>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  /**
   * Get order status from Printful
   */
  async getOrder<T>(orderId: number): Promise<PrintfulResponse<T>> {
    return await this.request<T>(`/orders/${orderId}`);
  }
} 