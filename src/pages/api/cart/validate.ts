/**
 * Secure Cart Validation API
 * 
 * This endpoint validates cart items against the database to prevent
 * client-side manipulation of prices, product data, or availability.
 */

import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { generateMockupFilename } from '@utils/helpers/mockups';
import { generateMockupUrls } from '@utils/helpers/product-helpers';
import { debug } from '@lib/utils/debug';

/**
 * Generate mockup image URL for cart item based on variant options
 */
function generateCartItemImageUrl(
  productSlug: string,
  options: Record<string, string>,
  fallbackUrl?: string
): string {
  const color = options.color || '';
  const size = options.size || 'one-size';
  
  if (!color) {
    return fallbackUrl || '';
  }
  
  try {
    // Generate filename for front view (most common for cart display)
    const filename = generateMockupFilename(productSlug, color, size, 'front');
    const { webpUrl } = generateMockupUrls(productSlug, filename);
    return webpUrl;
  } catch (error) {
    debug.criticalError('Error generating mockup URL', error, { productSlug, options });
    return fallbackUrl || '';
  }
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const requestBody = await request.json();
    debug.api('POST', '/api/cart/validate', null, 'Cart validation request');
    debug.log('Cart validation request received', { itemCount: requestBody?.items?.length });
    
    const { items } = requestBody;
    
    if (!items || !Array.isArray(items)) {
      debug.criticalError('Invalid cart items received', new Error('Invalid cart data'), { items });
      return new Response(
        JSON.stringify({ error: 'Invalid cart items' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    debug.log('Validating cart items', { itemCount: items.length });

    const supabase = createServerSupabaseClient({ cookies, request });
    const validatedItems = [];

    for (const item of items) {
      debug.log('Validating cart item', {
        variantId: item.variantId,
        quantity: item.quantity
      });
      
      // Skip invalid UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(item.variantId)) {
        debug.warn('Skipping invalid variant ID', { variantId: item.variantId, productSlug: item.productSlug });
        continue; // Skip this item instead of failing the entire request
      }
      
      // Validate each cart item against database
      const { data: variant, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          retail_price,
          in_stock,
          stock_level,
          printful_id,
          printful_external_id,
          options,
          products (
            id,
            name,
            slug,
            thumbnail_url,
            published_status
          )
        `)
        .eq('id', item.variantId)
        .single();

      if (error || !variant) {
        debug.criticalError('Variant lookup error', error, { variantId: item.variantId, productSlug: item.productSlug });
        return new Response(
          JSON.stringify({ 
            error: `Invalid variant: ${item.variantId}`,
            details: error?.message || 'Variant not found'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      debug.log('Found variant', {
        id: variant.id,
        productName: variant.products?.name,
        published: variant.products?.published_status,
        inStock: variant.in_stock
      });

      // Check if product is still published and in stock
      if (!variant.products.published_status || !variant.in_stock) {
        return new Response(
          JSON.stringify({ error: `Product unavailable: ${variant.products.name}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Convert Printful options array to object
      const optionsObj: Record<string, string> = {};
      if (variant.options && Array.isArray(variant.options)) {
        variant.options.forEach((opt: any) => {
          if (opt.id && opt.value) {
            optionsObj[opt.id] = opt.value;
          }
        });
      }

      // Generate mockup image URL for this specific variant
      const mockupImageUrl = generateCartItemImageUrl(
        variant.products.slug,
        optionsObj,
        variant.products.thumbnail_url
      );

      // Create validated cart item with server-side data
      const validatedItem = {
        id: variant.id,
        productId: variant.products.id,
        productSlug: variant.products.slug,
        name: variant.products.name,
        variantName: `${optionsObj.color || 'Default'} - ${optionsObj.size || 'One Size'}`,
        options: optionsObj,
        price: variant.retail_price, // Use DB price, not client price
        quantity: Math.min(item.quantity, 99), // Validate quantity
        imageUrl: mockupImageUrl,
        printful_id: variant.printful_id,
        printful_external_id: variant.printful_external_id,
        maxQuantity: variant.stock_level || 99,
        in_stock: variant.in_stock,
      };

      validatedItems.push(validatedItem);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        items: validatedItems,
        total: validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    debug.criticalError('Cart validation error', error, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};