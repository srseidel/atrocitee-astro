/**
 * Products List API
 * 
 * Returns a list of products with their variants for testing and general use
 */

import type { APIRoute } from 'astro';
import { createClient } from '@lib/supabase/client';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const supabase = createClient();
    
    // Fetch products with their variants
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*)
      `)
      .eq('status', 'active')
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (productsError) {
      console.error('Products query error:', productsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch products',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Transform the data for easier use
    const transformedProducts = products?.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      thumbnail_url: product.thumbnail_url,
      status: product.status,
      printful_id: product.printful_id,
      variants: product.variants.map((variant: any) => ({
        id: variant.id,
        name: variant.name,
        price: variant.price,
        options: variant.options,
        printful_id: variant.printful_id,
        printful_external_id: variant.printful_external_id,
        imageUrl: variant.image_url,
        in_stock: variant.in_stock,
        maxQuantity: variant.max_quantity || 10,
      })),
    })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        products: transformedProducts,
        count: transformedProducts.length,
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Products API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};