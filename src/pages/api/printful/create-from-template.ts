import type { APIContext } from 'astro';
import { isAdmin } from '../../../utils/auth';
import PrintfulService from '../../../lib/printful/service';
import { createServerSupabaseClient } from '../../../lib/supabase';
import * as Sentry from '@sentry/astro';
import slugify from 'slugify';

// Do not pre-render this endpoint at build time
export const prerender = false;

export async function POST({ request, cookies }: APIContext) {
  try {
    // Check if user is admin
    const isAdminUser = await isAdmin({ cookies });
    
    if (!isAdminUser) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Admin access required'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Parse request body
    const body = await request.json();
    const { catalogId, productName } = body;
    
    if (!catalogId) {
      return new Response(JSON.stringify({
        error: 'Missing Parameter',
        message: 'Catalog product ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Initialize the Printful service
    const printfulService = PrintfulService.getInstance();
    
    // Get the catalog product details
    // Get the catalog products first, then find the one we want
    const catalogProducts = await printfulService.getCatalogProducts();
    const catalogProduct = catalogProducts.find(product => product.id === Number(catalogId));
    
    if (!catalogProduct) {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Catalog product not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Get variants for this catalog product
    const variants = await printfulService.getProductVariants(Number(catalogId));
    
    // Create a new sync product with the catalog product as template
    const name = productName || catalogProduct.title;
    const syncProductData = {
      sync_product: {
        name,
        thumbnail: catalogProduct.image,
        external_id: `product-${Date.now()}`
      },
      sync_variants: variants.slice(0, 3).map(variant => ({
        variant_id: variant.id,
        retail_price: variant.price,
        external_id: `variant-${variant.id}-${Date.now()}`
      }))
    };
    
    // Create the product in Printful
    const newProduct = await printfulService.createProduct(syncProductData);
    
    // Also create the product in our database
    const supabase = createServerSupabaseClient({ cookies });
    
    // Create the product record
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        slug: slugify(name, { lower: true, strict: true }),
        description: catalogProduct.description || '',
        price: variants.length > 0 ? parseFloat(variants[0].price) : 0,
        inventory_count: variants.length,
        image_urls: [catalogProduct.image],
        active: true,
        version: 1,
        printful_product_id: newProduct.sync_product.id,
        printful_sync_product_id: newProduct.sync_product.id
      })
      .select('id')
      .single();
      
    if (productError) {
      console.error('Error creating product in database:', productError);
      throw productError;
    }
    
    // Create variant records for the first few variants
    const variantPromises = newProduct.sync_variants.map(async (variant: any) => {
      // Extract options from the variant
      const options: Record<string, string> = {};
      
      if (variant.options) {
        variant.options.forEach((option: any) => {
          options[option.id] = option.value?.toString() || '';
        });
      }
      
      return supabase
        .from('product_variants')
        .insert({
          product_id: productData.id,
          name: variant.name || `Variant ${variant.id}`,
          sku: variant.sku || `SKU-${variant.id}`,
          price: parseFloat(variant.retail_price),
          options,
          printful_variant_id: variant.variant_id,
          printful_sync_variant_id: variant.id,
          inventory_count: 1,
          active: true
        });
    });
    
    await Promise.all(variantPromises);
    
    // Return response with the new product details
    return new Response(JSON.stringify({
      message: `Product "${name}" created successfully from template`,
      data: {
        product_id: productData.id,
        printful_product_id: newProduct.sync_product.id,
        name,
        variants: newProduct.sync_variants.length
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating product from template:', error);
    
    // Log to Sentry
    Sentry.captureException(error, {
      tags: { endpoint: 'create-from-template' }
    });
    
    // Return error response
    return new Response(JSON.stringify({
      error: 'Creation Failed',
      message: error instanceof Error ? error.message : 'Unknown error during product creation'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 