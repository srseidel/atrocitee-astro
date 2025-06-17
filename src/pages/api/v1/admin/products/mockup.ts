import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'child_process';
import { copyFile, existsSync, mkdirSync } from 'fs';
import { createServerSupabaseClient } from '@lib/supabase/client';
import { PrintfulService } from '@lib/printful/service';
import { initQueue, addTask } from '@lib/printful/mockup-queue';
import type { MockupSettings, MockupResponse } from '@local-types/common/mockup-settings';
import { onRequest } from '../middleware';

// Disable prerendering to ensure we have access to request headers
export const prerender = false;

// Common colors to detect in variant names
const COMMON_COLORS = [
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'orange',
  'pink', 'brown', 'gray', 'grey', 'navy', 'teal', 'maroon', 'olive',
  'silver', 'gold', 'beige', 'tan', 'khaki', 'charcoal', 'heather',
  'royal-blue', 'royal blue'
];

// Define types for variant response
interface Product {
  id: string;
  name: string;
}

interface MockupFile {
  oldFile: string;
  newFile: string;
  view: string;
}

function isProduct(value: any): value is Product {
  return value && typeof value === 'object' && 'name' in value;
}

function isProductArray(value: any): value is Product[] {
  return Array.isArray(value) && value.length > 0 && isProduct(value[0]);
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  mockup_settings: any;
  options: any[];
  products: Product | Product[];
}

type ProgressUpdate = {
  variantId: string;
  completed: number;
  total: number;
  currentView: string;
  status: 'processing' | 'rate-limited' | 'completed' | 'error';
  message?: string;
};

// A simple in-memory store for progress data
const progressStore: Record<string, ProgressUpdate> = {};

export function storeProgress(progressData: ProgressUpdate): void {
  progressStore[progressData.variantId] = progressData;
}

/**
 * Extract color from variant name or options
 */
function extractColorFromVariant(variant: ProductVariant): string {
  let color = '';
  
  // First try to get color from options
  if (variant.options && Array.isArray(variant.options)) {
    for (const option of variant.options) {
      if (option.id === 'color') {
        color = option.value;
        break;
      }
    }
  }
  
  // Try to extract color from SKU if available
  if (!color && variant.sku) {
    const skuParts = variant.sku.split('_');
    if (skuParts.length > 1) {
      // Check if the last part contains color information
      const lastPart = skuParts[skuParts.length - 1].toLowerCase();
      
      // Check for common colors in the SKU
      for (const commonColor of COMMON_COLORS) {
        if (lastPart.includes(commonColor.toLowerCase().replace(' ', '-'))) {
          color = lastPart;
          break;
        }
      }
      
      // If we found a color in the SKU, clean it up
      if (color) {
        // Remove any non-color parts (usually product codes)
        const colorParts = color.split('-');
        if (colorParts.length > 1) {
          // Check if the first part is a product code (usually contains numbers)
          if (/[0-9]/.test(colorParts[0])) {
            color = colorParts.slice(1).join('-');
          }
        }
      }
    }
  }
  
  // If color is not found in options or SKU, try to extract it from the variant name
  if (!color && variant.name) {
    const variantNameLower = variant.name.toLowerCase();
    
    // Look for "/ color" pattern often used in variant names (e.g., "Product / Navy")
    const slashPattern = variantNameLower.split('/');
    if (slashPattern.length > 1) {
      const potentialColor = slashPattern[slashPattern.length - 1].trim();
      // Check if this part contains a known color
      for (const commonColor of COMMON_COLORS) {
        if (potentialColor.includes(commonColor.toLowerCase().replace(' ', '-'))) {
          color = potentialColor;
          break;
        }
      }
      
      // If we didn't find a known color but there's text after the slash, use it
      if (!color && potentialColor.length > 0) {
        color = potentialColor;
      }
    }
    
    // If we still don't have a color, check for common colors anywhere in the name
    if (!color) {
      for (const commonColor of COMMON_COLORS) {
        const normalizedColor = commonColor.toLowerCase().replace(' ', '-');
        const normalizedName = variantNameLower.replace(' ', '-');
        
        if (normalizedName.includes(normalizedColor)) {
          color = commonColor;
          break;
        }
      }
    }
    
    // Special case for multi-word colors
    if (!color) {
      if (variantNameLower.includes('royal blue') || variantNameLower.includes('royal-blue')) color = 'royal blue';
      else if (variantNameLower.includes('light blue')) color = 'light blue';
      else if (variantNameLower.includes('dark blue')) color = 'dark blue';
      else if (variantNameLower.includes('light gray') || variantNameLower.includes('light grey')) color = 'light gray';
      else if (variantNameLower.includes('dark gray') || variantNameLower.includes('dark grey')) color = 'dark gray';
    }
  }
  
  // Capitalize the first letter of the color
  if (color) {
    color = color.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    // Also handle hyphenated colors
    color = color.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('-');
  }
  
  return color;
}

// Function to get mockups from the local directory
function getLocalMockups(productType: string, color: string = ''): Array<{filename: string, url: string, view: string}> {
  const mockupsDir = path.resolve(process.cwd(), 'src/assets/mockups-new');
  
  try {
    // Read all files in the mockups directory
    const files = fs.readdirSync(mockupsDir);
    
    // Extract product keywords for more flexible matching
    const productKeywords = productType.toLowerCase().split('-').filter(Boolean);
    
    console.log('Looking for mockups with product keywords:', productKeywords);
    
    // Filter files based on product type and color
    const filteredFiles = files.filter(file => {
      // Skip non-image files
      if (!file.endsWith('.png') && !file.endsWith('.jpg') && !file.endsWith('.jpeg')) {
        return false;
      }
      
      const filename = file.toLowerCase();
      
      // For product matching, check if any of the keywords are in the filename
      if (productKeywords.length > 0) {
        // Check if at least one keyword matches
        const matchesProduct = productKeywords.some(keyword => 
          filename.includes(keyword)
        );
        
        if (!matchesProduct) {
          return false;
        }
      }
      
      // If color is specified, check if the filename contains the color
      if (color && !filename.includes(color.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    console.log(`Found ${filteredFiles.length} matching mockup files`);
    
    // Map files to mockup objects
    return filteredFiles.map(file => {
      // Determine view based on filename
      let view = 'front';
      const filename = file.toLowerCase();
      
      if (filename.includes('back')) {
        view = 'back';
      } else if (filename.includes('left-front')) {
        view = 'left_front';
      } else if (filename.includes('left')) {
        view = 'left';
      } else if (filename.includes('right-front')) {
        view = 'right_front';
      } else if (filename.includes('right')) {
        view = 'right';
      } else if (filename.includes('flat')) {
        view = 'flat';
      } else if (filename.includes('lifestyle')) {
        view = 'lifestyle';
      }
      
      return {
        filename: file,
        url: `/api/v1/admin/products/mockup?filename=${encodeURIComponent(file)}`,
        view
      };
    });
  } catch (error) {
    console.error('Error reading mockups directory:', error);
    return [];
  }
}

// Helper function to promisify copyFile
function copyFileAsync(src: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    copyFile(src, dest, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Helper function to run the image optimization script
function runOptimizeImagesScript(files: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'optimize-images.js');
    
    // Run the script with Node.js, passing the files as arguments
    const child = spawn('node', [scriptPath, ...files]);
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data;
      console.log(`Optimize script output: ${data}`);
    });
    
    child.stderr.on('data', (data) => {
      stderr += data;
      console.error(`Optimize script error: ${data}`);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Image optimization script failed with code ${code}: ${stderr}`));
      }
    });
  });
}

// Shared auth verification function
async function verifyAdminAuth(supabase: any) {
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { 
      authorized: false, 
      error: {
        status: 401,
        message: 'Authentication required'
      }
    };
  }
  
  // Check if user is admin
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) {
    return { 
      authorized: false, 
      error: {
        status: 403,
        message: 'Admin privileges required'
      }
    };
  }
  
  return { authorized: true };
}

// ====================================
// ENDPOINT HANDLERS
// ====================================

// GET handler for mockup images
export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    // Initialize Supabase client with cookies for auth
    const supabase = createServerSupabaseClient({ cookies, request });
    
    const { authorized, error } = await verifyAdminAuth(supabase);
    if (!authorized) {
      return new Response(JSON.stringify({
        error: error?.message || 'Unauthorized'
      }), {
        status: error?.status || 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get path parts to determine which endpoint was requested
    const pathParts = url.pathname.split('/');
    const lastPathPart = pathParts[pathParts.length - 1];
    const action = url.searchParams.get('action') || '';

    // Handle variant info endpoint
    if ((action === 'info' || !action) && url.searchParams.has('variantId')) {
      const variantId = url.searchParams.get('variantId');
      
      // Get the variant with its mockup settings
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select(`
          id, 
          name, 
          sku,
          mockup_settings, 
          options,
          products (
            id,
            name
          )
        `)
        .eq('id', variantId)
        .single();
      
      if (variantError) {
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: 'Variant not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Cast variant to the correct type
      const typedVariant = variant as unknown as ProductVariant;
      
      // Extract mockup settings
      const mockupSettings = (typedVariant.mockup_settings || {}) as MockupSettings;
      const mockups = mockupSettings.mockups || {};
      
      // Convert mockups object to array format for client consumption
      const mockupsArray: MockupResponse[] = Object.entries(mockups).map(([view, details]) => {
        return {
          view,
          filename: details.filename,
          url: `/api/v1/admin/products/mockup?filename=${encodeURIComponent(details.filename)}`,
          color: details.color || 'unknown',
          size: details.size || '',
          updated_at: details.updated_at || new Date().toISOString()
        };
      });
      
      // Get size from variant options if available
      let size = '';
      
      if (typedVariant.options && Array.isArray(typedVariant.options)) {
        for (const option of typedVariant.options) {
          if (option.id === 'size') {
            size = option.value;
            break;
          }
        }
      }
      
      // Extract color from variant
      const color = extractColorFromVariant(typedVariant);
      
      return new Response(JSON.stringify({
        variant: {
          id: typedVariant.id,
          name: typedVariant.name,
          color,
          size
        },
        mockups: mockupsArray
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle mockup-tasks endpoint
    else if (action === 'tasks' && url.searchParams.has('variantId')) {
      const variantId = url.searchParams.get('variantId');

      // Fetch mockup tasks for the variant
      const { data: tasks, error } = await supabase
        .from('printful_mockup_tasks')
        .select('*')
        .eq('product_variant_id', variantId);

      if (error) {
        return new Response(JSON.stringify({
          error: 'Database Error',
          message: error.message
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        tasks: tasks || []
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle mockup-progress endpoint
    else if (action === 'progress' && url.searchParams.has('variantId')) {
      const variantId = url.searchParams.get('variantId');

      // Setup SSE response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start: async (controller) => {
          try {
            // Initial response
            const initialData = {
              status: 'initializing',
              message: 'Starting mockup generation',
              completed: 0,
              total: 0,
              currentView: null
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));

            // Function to get current task status
            const getTaskStatus = async () => {
              const { data: tasks, error } = await supabase
                .from('printful_mockup_tasks')
                .select('*')
                .eq('product_variant_id', variantId)
                .order('created_at', { ascending: true });

              if (error) {
                throw new Error(`Failed to fetch task status: ${error.message}`);
              }

              return tasks || [];
            };

            // Get initial task count
            const initialTasks = await getTaskStatus();
            const totalTasks = initialTasks.length;

            if (totalTasks === 0) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                status: 'error',
                message: 'No mockup tasks found for this variant',
                completed: 0,
                total: 0
              })}\n\n`));
              controller.close();
              return;
            }

            // Send initial task count
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: 'processing',
              message: 'Processing mockup tasks',
              completed: initialTasks.filter(t => t.status === 'completed').length,
              total: totalTasks,
              currentView: initialTasks.find(t => t.status === 'processing')?.view_type
            })}\n\n`));

            // Poll for updates
            const interval = setInterval(async () => {
              try {
                const tasks = await getTaskStatus();
                const completed = tasks.filter(t => t.status === 'completed').length;
                const failed = tasks.filter(t => t.status === 'error').length;
                const processing = tasks.find(t => t.status === 'processing');
                const rateLimited = tasks.some(t => t.status === 'rate_limited');
                
                // Determine current status
                let status = 'processing';
                let message = '';
                
                if (rateLimited) {
                  status = 'rate-limited';
                  message = 'Rate limited by Printful API. Waiting before continuing...';
                } else if (completed + failed === totalTasks) {
                  status = 'completed';
                  message = `All tasks completed. ${completed} successful, ${failed} failed.`;
                  clearInterval(interval);
                } else if (processing) {
                  message = `Processing ${processing.view_type} view...`;
                }
                
                // Send update
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  status,
                  message,
                  completed: completed,
                  total: totalTasks,
                  currentView: processing?.view_type || null,
                  failed
                })}\n\n`));
                
                // If completed, close the stream
                if (status === 'completed') {
                  setTimeout(() => {
                    controller.close();
                  }, 1000);
                }
              } catch (error) {
                console.error('Error polling for task status:', error);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  status: 'error',
                  message: error instanceof Error ? error.message : 'Unknown error polling for status',
                  error: true
                })}\n\n`));
                clearInterval(interval);
                controller.close();
              }
            }, 2000); // Poll every 2 seconds
            
            // Clean up when client disconnects
            request.signal.addEventListener('abort', () => {
              clearInterval(interval);
              controller.close();
            });
          } catch (error) {
            console.error('Error in SSE stream:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: 'error',
              message: error instanceof Error ? error.message : 'Unknown error in SSE stream',
              error: true
            })}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Handle mockup-image endpoint
    else if (url.searchParams.has('filename')) {
      // Get filename from query parameter
      const filename = url.searchParams.get('filename');
      
      if (!filename) {
        return new Response('Filename is required', { status: 400 });
      }
      
      // Prevent directory traversal attacks
      const sanitizedFilename = path.basename(filename);
      const mockupPath = path.resolve(process.cwd(), 'src/assets/mockups-new', sanitizedFilename);
      
      // Check if file exists
      if (!fs.existsSync(mockupPath)) {
        return new Response('Image not found', { status: 404 });
      }
      
      // Read file
      const fileContent = fs.readFileSync(mockupPath);
      
      // Determine content type
      let contentType = 'image/png';
      if (sanitizedFilename.endsWith('.jpg') || sanitizedFilename.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      }
      
      // Return image
      return new Response(fileContent, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
        }
      });
    }

    // Handle available mockups endpoint
    else if ((action === 'available' || !action) && url.searchParams.has('product')) {
      const productParam = url.searchParams.get('product') || '';
      console.log('Received request for product:', productParam);
      
      // Extract product type from slug (e.g., "unisex-classic-tee" from "unisex-classic-tee-white")
      let productType = productParam;
      
      // If no mockups are found with the specific product type,
      // try with just the product type
      let mockups = getLocalMockups(productType);
      
      // If still no results, try with just the first part of the product type
      if (mockups.length === 0 && productType.includes('-')) {
        const firstKeyword = productType.split('-')[0];
        console.log('No mockups found with full product type. Trying with first keyword:', firstKeyword);
        mockups = getLocalMockups(firstKeyword);
      }
      
      // Return all mockups if we still can't find any matching ones
      if (mockups.length === 0) {
        console.log('No specific mockups found. Returning all mockups.');
        mockups = getLocalMockups('');
      }
      
      return new Response(JSON.stringify({
        success: true,
        mockups,
        productType,
        query: {
          original: productParam,
          parsed: { productType }
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Default response if no specific endpoint matched
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: 'The requested endpoint was not found'
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in mockup GET endpoint:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// POST handler for various mockup operations
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Initialize Supabase client with cookies for auth
    const supabase = createServerSupabaseClient({ cookies, request });
    
    const { authorized, error } = await verifyAdminAuth(supabase);
    if (!authorized) {
      return new Response(JSON.stringify({
        error: error?.message || 'Unauthorized'
      }), {
        status: error?.status || 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get request URL and path parts to determine the operation
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || '';

    // Parse request body once
    const body = await request.json();

    // Handle assign mockup endpoint
    if (action === 'assign') {
      const { mockupFile, variantId, productSlug, view, color, size } = body;

      console.log('Assigning mockup:', { mockupFile, variantId, productSlug, view, color, size });

      // Get current mockup settings
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('mockup_settings')
        .eq('id', variantId)
        .single();

      if (variantError) {
        console.error('Error fetching variant:', variantError);
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: 'Variant not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      // Initialize or get existing mockup settings
      let mockupSettings = variant.mockup_settings || {};
      if (!mockupSettings.mockups) {
        mockupSettings.mockups = {};
      }

      // Update the mockup settings with the new file
      mockupSettings.mockups[view] = {
        filename: mockupFile,
        updated_at: new Date().toISOString()
      };

      // Update the variant with new mockup settings
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({
          mockup_settings: mockupSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId);

      if (updateError) {
        console.error('Error updating variant:', updateError);
        return new Response(JSON.stringify({
          error: 'Update Error',
          message: 'Failed to update variant mockup settings'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Mockup assigned successfully'
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Handle remove mockup endpoint
    else if (action === 'remove') {
      const { variantId, view, mockupFilename, removeAll } = body;

      // Get current mockup settings
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('mockup_settings')
        .eq('id', variantId)
        .single();

      if (variantError) {
        console.error('Error fetching variant:', variantError);
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: 'Variant not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      let mockupSettings = variant.mockup_settings || {};
      if (!mockupSettings.mockups) {
        mockupSettings.mockups = {};
      }

      if (removeAll) {
        // Remove all mockups
        mockupSettings.mockups = {};
      } else if (view && mockupFilename) {
        // Remove specific mockup
        if (mockupSettings.mockups[view]?.filename === mockupFilename) {
          delete mockupSettings.mockups[view];
        }
      }

      // Update the variant with new mockup settings
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({
          mockup_settings: mockupSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId);

      if (updateError) {
        console.error('Error updating variant:', updateError);
        return new Response(JSON.stringify({
          error: 'Update Error',
          message: 'Failed to update variant mockup settings'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: removeAll ? 'All mockups removed successfully' : 'Mockup removed successfully'
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Handle process mockups endpoint
    else if (action === 'process') {
      const { mockupFiles, productSlug, variantId } = body;

      console.log('Processing mockups:', { mockupFiles, productSlug, variantId });

      if (!Array.isArray(mockupFiles) || !productSlug || !variantId) {
        return new Response(JSON.stringify({
          error: 'Bad Request',
          message: 'Missing required fields: mockupFiles array, productSlug, and variantId are required'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      // Get variant details for color and size
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select(`
          id,
          name,
          sku,
          mockup_settings,
          options,
          products (
            id,
            name
          )
        `)
        .eq('id', variantId)
        .single();

      if (variantError || !variant) {
        console.error('Error fetching variant:', variantError);
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: 'Failed to get variant details'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      // Extract color and size from variant
      const color = extractColorFromVariant(variant);
      let size = '';
      if (variant.options && Array.isArray(variant.options)) {
        for (const option of variant.options) {
          if (option.id === 'size') {
            size = option.value;
            break;
          }
        }
      }

      // Get product name from variant
      let productName = '';
      if (variant.products) {
        if (isProductArray(variant.products)) {
          productName = variant.products[0].name;
        } else if (isProduct(variant.products)) {
          productName = variant.products.name;
        }
      }
      productName = productName || 'Atrocitee';

      // Process mockup files
      const processedFiles = await Promise.all(mockupFiles.map(async (file: string) => {
        try {
          // Setup source and target directories
          const sourceDir = path.join(process.cwd(), 'src', 'assets', 'mockups-new');
          const targetDir = path.join(process.cwd(), 'src', 'assets', 'mockups');
          
          // Ensure target directory exists
          await fs.promises.mkdir(targetDir, { recursive: true });
          
          // Get source file path
          const sourceFile = path.join(sourceDir, path.basename(file));
          
          // Check if source file exists
          try {
            await fs.promises.access(sourceFile, fs.constants.F_OK);
          } catch {
            console.error('Source file not found:', sourceFile);
            throw new Error(`Source file not found: ${file}`);
          }
          
          // Generate new filename based on product details
          const fileExt = path.extname(file);
          const viewMatch = file.match(/(front-2|back-2|front-and-back|left-front|right-front|front|back|flat|lifestyle)/i);
          const view = viewMatch ? viewMatch[0].toLowerCase() : 'front';
          const hash = file.match(/[a-f0-9]{12,}/i)?.[0] || '';
          
          // Clean up product name and create new filename
          const productName = productSlug.replace(/[^a-z0-9-]/g, '-');
          const newFilename = `${productName}-${color.toLowerCase()}-${size.toLowerCase()}-${view}${hash ? '-' + hash : ''}${fileExt}`;
          const targetFile = path.join(targetDir, newFilename);
          
          console.log('Processing file:', {
            sourceFile,
            targetFile,
            view,
            hash
          });

          // Move file to target directory
          await fs.promises.rename(sourceFile, targetFile);
          
          return {
            oldFile: file,
            newFile: newFilename,
            view
          };
        } catch (error) {
          console.error('Error processing file:', error);
          throw error;
        }
      }));

      // After all files are moved, optimize them
      if (processedFiles.length > 0) {
        await runOptimizeImagesScript(processedFiles.map(f => f.newFile));
      }

      console.log('Files processed:', processedFiles);

      return new Response(JSON.stringify({
        success: true,
        message: `Successfully processed ${processedFiles.length} mockup files`,
        processedFiles,
        details: {
          totalFiles: mockupFiles.length,
          processedCount: processedFiles.length,
          views: processedFiles.map(f => f.view)
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Handle default case for mockup generation or other operations
    else {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'The requested endpoint was not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error in mockup POST endpoint:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// Export the middleware to ensure authentication for all routes
export { onRequest };
