/**
 * Printful API Test Endpoint
 * This endpoint tests the connection to Printful and returns basic information.
 */

import type { APIRoute } from 'astro';
import PrintfulService from '../../../lib/printful/service';
import PrintfulClient from '../../../lib/printful/api-client';
import { isAdmin } from '../../../utils/auth';
import ENV from '../../../config/env';

// Ensure this API endpoint is server-rendered to access auth cookies
export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Only allow admin users to access this endpoint
    const adminResult = await isAdmin({ cookies });
    if (!adminResult) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Check if Printful API key is set
    const apiKey = ENV.PRINTFUL_API_KEY;
    console.log('Printful API Key status:', { exists: !!apiKey, length: apiKey?.length || 0 });

    if (!apiKey) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Printful API key is not configured. Please add PRINTFUL_API_KEY to your environment variables.',
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Get the search params
    const url = new URL(request.url);
    const useMock = url.searchParams.get('mock') === 'true';

    let storeProducts, catalogProducts;

    if (useMock) {
      // Use mock data for testing without API key
      console.log('Using mock Printful data');
      storeProducts = [
        {
          id: 123456,
          external_id: "mock-product-1",
          name: "Mock T-shirt Product",
          variants: 2,
          synced: 2,
          thumbnail_url: "https://example.com/thumbnail.jpg",
          is_ignored: false
        }
      ];
      catalogProducts = [{ id: 1, title: 'Mock T-shirt', type: 'T-shirt', image: 'https://example.com/image.jpg' }];
    } else {
      // Get the Printful service and fetch data
      const printfulService = PrintfulService.getInstance();
      const productsResponse = await printfulService.getAllProducts();
      
      // Extract store products from the response
      // The API returns the products directly in the result array
      storeProducts = productsResponse;
      
      catalogProducts = await printfulService.getTshirtProducts();
    }
    
    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Printful API connection successful',
        data: {
          storeProductCount: storeProducts.length,
          availableTshirtCount: catalogProducts.length,
          // Include sample data (first 3 items) for verification
          sampleStoreProducts: storeProducts.slice(0, 3),
          sampleCatalogProducts: catalogProducts.slice(0, 3).map(p => ({
            id: p.id,
            title: p.title,
            type: p.type,
            image: p.image
          }))
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error testing Printful API:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 