import { PrintfulService } from '@lib/printful/service';

import type { PrintfulProduct, PrintfulVariant } from '../../../../types/printful/api';
import type { APIRoute } from 'astro';

// Ensure this endpoint is server-rendered
export const prerender = false;

interface ProductVariant {
  id: number;
  name: string;
  size: string;
  color: string;
  price: string;
  in_stock: boolean;
}

interface TransformedProduct {
  id: number;
  name: string;
  type: string;
  description: string;
  thumbnail_url: string;
  variants: ProductVariant[];
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Process products in batches
async function processBatch(
  products: PrintfulProduct[],
  startIndex: number,
  batchSize: number,
  printfulService: PrintfulService
): Promise<TransformedProduct[]> {
  const endIndex = Math.min(startIndex + batchSize, products.length);
  const batch = products.slice(startIndex, endIndex);
  
  const transformedBatch = await Promise.all(batch.map(async (product) => {
    const baseProduct: TransformedProduct = {
      id: product.id,
      name: product.name,
      type: 'T-shirt', // Default type since PrintfulProduct doesn't have type
      description: product.description || '',
      thumbnail_url: product.thumbnail_url,
      variants: []
    };

    try {
      console.log(`Fetching variants for product ${product.id} (${product.name})`);
      const variants = await printfulService.getProductVariants(product.id);
      
      if (variants && Array.isArray(variants)) {
        console.log(`Found ${variants.length} variants for product ${product.id}`);
        baseProduct.variants = variants.map(variant => {
          // Extract size and color from options
          const size = variant.options.find(opt => opt.id === 'size')?.value || '';
          const color = variant.options.find(opt => opt.id === 'color')?.value || '';
          
          return {
            id: variant.id,
            name: variant.name,
            size,
            color,
            price: variant.retail_price || '0.00',
            in_stock: variant.in_stock || false
          };
        });
      } else {
        console.log(`No variants found for product ${product.id}`);
      }
    } catch (error: unknown) {
      console.warn(`Could not fetch variants for product ${product.id}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId: product.id,
        productName: product.name
      });
    }

    return baseProduct;
  }));

  return transformedBatch;
}

export const GET: APIRoute = async () => {
  try {
    const printfulService = PrintfulService.getInstance();
    const products = await printfulService.getProducts();
    
    console.log(`Found ${products.length} catalog products`);
    
    const BATCH_SIZE = 5; // Process 5 products at a time
    const DELAY_MS = 2000; // 2 second delay between batches
    const transformedProducts: TransformedProduct[] = [];
    
    // Process products in batches
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(products.length / BATCH_SIZE)}`);
      const batch = await processBatch(products, i, BATCH_SIZE, printfulService);
      transformedProducts.push(...batch);
      
      // Add delay between batches if not the last batch
      if (i + BATCH_SIZE < products.length) {
        console.log(`Waiting ${DELAY_MS}ms before next batch...`);
        await delay(DELAY_MS);
      }
    }
    
    console.log(`Successfully transformed ${transformedProducts.length} products`);
    
    return new Response(JSON.stringify({
      products: transformedProducts,
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error loading catalog products:', error);
    return new Response(JSON.stringify({
      error: 'Failed to load catalog products',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 