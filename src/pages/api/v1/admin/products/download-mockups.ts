import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { downloadVariantMockups } from '@utils/helpers/download-mockups';

// Ensure this endpoint is server-rendered
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Initialize Supabase client
    const supabase = createServerSupabaseClient({ cookies, request });
    
    // Check if user is authenticated and is admin using RPC function
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
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

    // Get product ID from request
    const { productId } = await request.json();
    if (!productId) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'Product ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Get product and its variants
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        slug,
        product_variants (
          id,
          name,
          files
        )
      `)
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Product not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Download mockups for each variant
    const results = [];
    for (const variant of product.product_variants) {
      const files = variant.files as Array<{ type: string; url: string; preview_url: string }>;
      const mockupFiles = await downloadVariantMockups(
        product.slug,
        variant.name,
        files
      );
      results.push({
        variantId: variant.id,
        files: mockupFiles
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Mockups downloaded successfully',
      results
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error downloading mockups:', error);
    return new Response(JSON.stringify({
      error: 'Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 