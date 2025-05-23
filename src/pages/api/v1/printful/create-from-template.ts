import type { APIContext } from 'astro';
import { isAdmin } from '@lib/auth/middleware';
import { PrintfulService } from '@lib/printful/service';
import { createServerSupabaseClient } from '@lib/supabase/client';
import * as Sentry from '@sentry/astro';
import slugify from 'slugify';
import type { PrintfulProduct, PrintfulVariant } from 'printful';

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
        headers: { 'Content-Type': 'application/json' }
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
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize the Printful service
    const printfulService = PrintfulService.getInstance();

    // Get the Printful products and find the one we want
    const products = await printfulService.getProducts();
    const product = products.find((p: PrintfulProduct) => p.id === Number(catalogId));
    if (!product) {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Product not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get variants for this product
    const variants = await printfulService.getProductVariants(Number(catalogId));

    // Use product name or override
    const name = productName || product.name;

    // Insert the product into our database
    const supabase = createServerSupabaseClient({ cookies });
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        slug: slugify(name, { lower: true, strict: true }),
        description: '', // PrintfulProduct does not have description
        price: variants.length > 0 ? parseFloat(variants[0].retail_price) : 0,
        inventory_count: variants.length,
        image_urls: [product.thumbnail_url],
        active: true,
        version: 1,
        printful_product_id: product.id,
        printful_sync_product_id: product.id
      })
      .select('id')
      .single();
    if (productError) {
      console.error('Error creating product in database:', productError);
      throw productError;
    }

    // Create variant records for the first few variants
    const variantPromises = variants.slice(0, 3).map(async (variant: PrintfulVariant) => {
      // Extract options from the variant
      const options: Record<string, string> = {};
      if (variant.options) {
        variant.options.forEach((option: { id: string; value: string }) => {
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
          printful_variant_id: variant.id,
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
        printful_product_id: product.id,
        name,
        variants: variants.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating product from template:', error);
    Sentry.captureException(error, { tags: { endpoint: 'create-from-template' } });
    return new Response(JSON.stringify({
      error: 'Creation Failed',
      message: error instanceof Error ? error.message : 'Unknown error during product creation'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 