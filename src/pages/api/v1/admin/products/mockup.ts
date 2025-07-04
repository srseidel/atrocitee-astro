// @ts-nocheck - Disable TypeScript checking for this file

import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@lib/supabase/client';
import type { MockupSettings, MockupResponse } from '@/types/common/mockup-settings';
import { generateMockupFilename } from '@/lib/mockups/utils';
import { onRequest } from '../middleware';

// Import types for PrintfulService
import type { PrintfulService as PrintfulServiceType } from '@/lib/printful/service';

// Define queue task type
interface QueueTask {
  variantId: string;
  productId: string;
  files: Array<{
    placement: string;
    artwork_url: string;
  }>;
  mockup_positions: string[];
}

// These will be dynamically imported when needed
let printfulServiceModule: any;
let mockupQueueModule: any;
let fsModule: any;
let pathModule: any;

// Function to get PrintfulService
async function getPrintfulService(): Promise<PrintfulServiceType> {
  if (!printfulServiceModule) {
    printfulServiceModule = await import('@/lib/printful/service');
  }
  return new printfulServiceModule.PrintfulService();
}

// Function to initialize queue
async function initMockupQueue(): Promise<void> {
  if (!mockupQueueModule) {
    mockupQueueModule = await import('@/lib/printful/mockup-queue');
  }
  return mockupQueueModule.initQueue();
}

// Function to add task to queue
async function addMockupTask(task: QueueTask): Promise<void> {
  if (!mockupQueueModule) {
    mockupQueueModule = await import('@/lib/printful/mockup-queue');
  }
  return mockupQueueModule.addTask(task);
}

// Helper function to get fs module
async function getFs() {
  if (!fsModule) {
    fsModule = await import('node:fs');
  }
  return fsModule;
}

// Helper function to get path module
async function getPath() {
  if (!pathModule) {
    pathModule = await import('node:path');
  }
  return pathModule;
}

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
  
  console.log('🔍 DEBUG: extractColorFromVariant called with:', {
    variantId: variant.id,
    variantName: variant.name,
    variantSku: variant.sku,
    variantOptions: variant.options,
    optionsType: typeof variant.options,
    optionsIsArray: Array.isArray(variant.options)
  });
  
  // First try to get color from options
  if (variant.options && Array.isArray(variant.options)) {
    console.log('🔍 DEBUG: Checking variant options for color:', variant.options);
    for (const option of variant.options) {
      console.log('🔍 DEBUG: Checking option:', option);
      if (option.id === 'color') {
        color = option.value;
        console.log('🔍 DEBUG: Found color in options:', color);
        break;
      }
    }
  } else {
    console.log('🔍 DEBUG: No valid options array found, variant.options is:', variant.options);
  }
  
  // Try to extract color from SKU if available
  if (!color && variant.sku) {
    console.log('🔍 DEBUG: No color in options, trying SKU:', variant.sku);
    const skuParts = variant.sku.split('_');
    if (skuParts.length > 1) {
      // Check if the last part contains color information
      const lastPart = skuParts[skuParts.length - 1].toLowerCase();
      
      // Check for common colors in the SKU
      for (const commonColor of COMMON_COLORS) {
        if (lastPart.includes(commonColor.toLowerCase().replace(' ', '-'))) {
          color = lastPart;
          console.log('🔍 DEBUG: Found color in SKU:', color);
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
    console.log('🔍 DEBUG: No color in options or SKU, trying variant name:', variant.name);
    const variantNameLower = variant.name.toLowerCase();
    
    // Look for "/ color" pattern often used in variant names (e.g., "Product / Navy")
    const slashPattern = variantNameLower.split('/');
    if (slashPattern.length > 1) {
      const potentialColor = slashPattern[slashPattern.length - 1].trim();
      console.log('🔍 DEBUG: Found slash pattern, potential color:', potentialColor);
      
      // Check if this looks like a size rather than a color
      const isSizePattern = /\d+\s*(oz|ml|l|xl|xs|sm|md|lg|inch|in|cm|mm|")/i.test(potentialColor);
      if (isSizePattern) {
        console.log('🔍 DEBUG: Potential color looks like a size, skipping:', potentialColor);
        // If the part after slash is a size, try to extract color from the product name (before slash)
        const productNamePart = slashPattern[0].trim();
        console.log('🔍 DEBUG: Trying to extract color from product name part:', productNamePart);
        
        // Look for colors in the product name
        for (const commonColor of COMMON_COLORS) {
          const normalizedColor = commonColor.toLowerCase().replace(' ', '-');
          if (productNamePart.includes(normalizedColor)) {
            color = commonColor;
            console.log('🔍 DEBUG: Found color in product name part:', color);
            break;
          }
        }
        
        // Special check for "white" in product names like "White Mug"
        if (!color && productNamePart.includes('white')) {
          color = 'white';
          console.log('🔍 DEBUG: Found "white" in product name part:', color);
        }
      } else {
        // Check if this part contains a known color
        for (const commonColor of COMMON_COLORS) {
          if (potentialColor.includes(commonColor.toLowerCase().replace(' ', '-'))) {
            color = potentialColor;
            console.log('🔍 DEBUG: Found known color in slash pattern:', color);
            break;
          }
        }
        
        // If we didn't find a known color but there's text after the slash, use it only if it doesn't look like a size
        if (!color && potentialColor.length > 0 && !isSizePattern) {
          color = potentialColor;
          console.log('🔍 DEBUG: Using potential color from slash pattern:', color);
        }
      }
    }
    
    // If we still don't have a color, check for common colors anywhere in the name
    if (!color) {
      for (const commonColor of COMMON_COLORS) {
        const normalizedColor = commonColor.toLowerCase().replace(' ', '-');
        const normalizedName = variantNameLower.replace(' ', '-');
        
        if (normalizedName.includes(normalizedColor)) {
          color = commonColor;
          console.log('🔍 DEBUG: Found common color in variant name:', color);
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
      
      if (color) {
        console.log('🔍 DEBUG: Found multi-word color in variant name:', color);
      }
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
  
  console.log('🔍 DEBUG: Final extracted color:', color);
  
  return color;
}

// Function to get mockups from the local directory
async function getLocalMockups(productType: string, color: string = ''): Promise<Array<{filename: string, url: string, view: string}>> {
  // Dynamically import required modules
  const fs = await getFs();
  const path = await getPath();
  
  // Only check the mockups-new directory for unassigned mockups
  const mockupsDir = path.resolve(process.cwd(), 'src/assets/mockups-new');
  
  console.log('Looking for mockups in directory:', mockupsDir);
  
  try {
    // Check if directory exists
    if (!fs.existsSync(mockupsDir)) {
      console.error('Mockups directory does not exist:', mockupsDir);
      return [];
    }
    
    // Read all files in the mockups directory
    const files = fs.readdirSync(mockupsDir);
    console.log(`Found ${files.length} files in mockups directory`);
    
    // Extract product keywords for more flexible matching
    const productKeywords = productType.toLowerCase().split('-').filter(Boolean);
    
    console.log('Looking for mockups with product keywords:', productKeywords);
    
    // If no product type is specified, return all mockups
    if (productKeywords.length === 0 || productType === '') {
      console.log('No product type specified, returning all mockups');
      return files
        .filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
        .map(file => {
          // Determine view based on filename
          let view = determineViewFromFilename(file);
          
          return {
            filename: file,
            url: `/api/v1/admin/products/mockup?filename=${encodeURIComponent(file)}`,
            view
          };
        });
    }
    
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
    
    // If no matches found with specific keywords, return all mockups
    if (filteredFiles.length === 0) {
      console.log('No matches found with specific keywords, returning all mockups');
      return files
        .filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
        .map(file => {
          // Determine view based on filename
          let view = determineViewFromFilename(file);
          
          return {
            filename: file,
            url: `/api/v1/admin/products/mockup?filename=${encodeURIComponent(file)}`,
            view
          };
        });
    }
    
    // Map files to mockup objects
    return filteredFiles.map(file => {
      // Determine view based on filename
      let view = determineViewFromFilename(file);
      
      return {
        filename: file,
        url: `/api/v1/admin/products/mockup?filename=${encodeURIComponent(file)}`,
        view
      };
    });
  } catch (error) {
    console.error('Error processing mockup files:', error);
    return [];
  }
}

// Helper function to determine view from filename
function determineViewFromFilename(filename: string): string {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('--back') || lowerFilename.includes('-back')) {
    return 'back';
  } else if (lowerFilename.includes('--left-front') || lowerFilename.includes('-left-front') ||
             lowerFilename.includes('--left_front') || lowerFilename.includes('-left_front')) {
    return 'left-front'; // Use hyphen format consistently
  } else if (lowerFilename.includes('--left') || lowerFilename.includes('-left')) {
    return 'left';
  } else if (lowerFilename.includes('--right-front') || lowerFilename.includes('-right-front') ||
             lowerFilename.includes('--right_front') || lowerFilename.includes('-right_front')) {
    return 'right-front'; // Use hyphen format consistently
  } else if (lowerFilename.includes('--right') || lowerFilename.includes('-right')) {
    return 'right';
  } else if (lowerFilename.includes('--flat') || lowerFilename.includes('-flat')) {
    return 'flat';
  } else if (lowerFilename.includes('--lifestyle') || lowerFilename.includes('-lifestyle')) {
    return 'lifestyle';
  }
  
  // Default to front view
  return 'front';
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
  return new Promise(async (resolve, reject) => {
    // Get path module
    const path = await getPath();
    
    // Import child_process
    const { spawn } = await import('node:child_process');
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'optimize-images.js');
    
    console.log('Running optimization script with files:', files);
    
    // Run the script with Node.js, passing the files as arguments
    // The script expects relative paths from src/assets/mockups
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
        console.log('Image optimization completed successfully');
        resolve();
      } else {
        console.error(`Image optimization script failed with code ${code}`);
        console.error('Stderr:', stderr);
        console.error('Stdout:', stdout);
        // We're resolving instead of rejecting to allow the process to continue
        // even if optimization fails
        resolve();
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
      
      console.log(`Fetching info for variant ${variantId}`);
      
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
        console.error('Error fetching variant:', variantError);
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: 'Variant not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      console.log('Raw variant data:', variant);
      
      // Cast variant to the correct type
      const typedVariant = variant as unknown as ProductVariant;
      
      // Extract mockup settings
      const mockupSettings = (typedVariant.mockup_settings || {}) as any;
      console.log('Mockup settings:', mockupSettings);
      
      // Handle both old and new mockup settings formats
      let mockupsArray: MockupResponse[] = [];
      
      // New format with views array
      if (mockupSettings.views && Array.isArray(mockupSettings.views)) {
        console.log('Using new views array format');
        mockupsArray = mockupSettings.views.map((view: any) => {
          return {
            view: view.view,
            filename: view.filename,
            url: view.url || `/api/v1/admin/products/mockup?filename=${encodeURIComponent(view.filename)}`,
            color: view.color || 'unknown',
            size: view.size || '',
            updated_at: view.updated_at || new Date().toISOString()
          };
        });
      } 
      // Legacy format with mockups object
      else if (mockupSettings.mockups) {
        console.log('Using legacy mockups object format');
        mockupsArray = Object.entries(mockupSettings.mockups).map(([view, details]: [string, any]) => {
          return {
            view,
            filename: details.filename,
            url: `/api/v1/admin/products/mockup?filename=${encodeURIComponent(details.filename)}`,
            color: details.color || 'unknown',
            size: details.size || '',
            updated_at: details.updated_at || new Date().toISOString()
          };
        });
      }
      
      console.log('Processed mockups array:', mockupsArray);
      
      // Get size from variant options if available
      let size = '';
      
      console.log('🔍 DEBUG: Extracting size from variant:', {
        variantId: typedVariant.id,
        variantName: typedVariant.name,
        variantOptions: typedVariant.options,
        optionsType: typeof typedVariant.options,
        optionsIsArray: Array.isArray(typedVariant.options)
      });
      
      if (typedVariant.options && Array.isArray(typedVariant.options)) {
        console.log('🔍 DEBUG: Checking variant options for size:', typedVariant.options);
        for (const option of typedVariant.options) {
          console.log('🔍 DEBUG: Checking option for size:', option);
          if (option.id === 'size') {
            size = option.value;
            console.log('🔍 DEBUG: Found size in options:', size);
            break;
          }
        }
      } else {
        console.log('🔍 DEBUG: No valid options array found for size extraction, variant.options is:', typedVariant.options);
      }
      
      console.log('🔍 DEBUG: Final extracted size:', size);
      
      // Extract color from variant
      const color = extractColorFromVariant(typedVariant);
      
      return new Response(JSON.stringify({
        variant: {
          id: typedVariant.id,
          name: typedVariant.name,
          color,
          size,
          mockup_settings: mockupSettings
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
      
      // Get fs and path modules
      const fs = await getFs();
      const path = await getPath();
      
      // Prevent directory traversal attacks
      const sanitizedFilename = path.basename(filename);
      
      // For unassigned mockups, look in the mockups-new directory
      const mockupPath = path.resolve(process.cwd(), 'src/assets/mockups-new', sanitizedFilename);
      
      console.log('Looking for mockup image at:', mockupPath);
      
      // Check if file exists
      if (!fs.existsSync(mockupPath)) {
        console.error('Mockup image not found:', sanitizedFilename);
        return new Response('Image not found', { status: 404 });
      }
      
      // Read file
      const fileContent = fs.readFileSync(mockupPath);
      
      // Determine content type
      let contentType = 'image/png';
      if (sanitizedFilename.endsWith('.jpg') || sanitizedFilename.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (sanitizedFilename.endsWith('.webp')) {
        contentType = 'image/webp';
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
      
      // First try with the full product name
      let mockups = await getLocalMockups(productParam);
      console.log(`Found ${mockups.length} mockups for product: ${productParam}`);
      
      // If no results, try with just the product type (first part of the slug)
      if (mockups.length === 0 && productParam.includes('-')) {
        const productParts = productParam.split('-');
        const productType = productParts[0]; // Try with just the first part
        console.log('No mockups found with full product name. Trying with product type:', productType);
        mockups = await getLocalMockups(productType);
        console.log(`Found ${mockups.length} mockups for product type: ${productType}`);
      }
      
      // If still no results, return all mockups
      if (mockups.length === 0) {
        console.log('No specific mockups found. Returning all mockups.');
        mockups = await getLocalMockups('');
        console.log(`Found ${mockups.length} mockups in total`);
      }
      
      // Ensure mockups is always an array
      if (!Array.isArray(mockups)) {
        console.error('Expected mockups to be an array but got:', typeof mockups);
        mockups = [];
      }
      
      // Log the mockups for debugging
      console.log('Returning mockups:', mockups.map(m => m.filename));
      
      return new Response(JSON.stringify({
        success: true,
        mockups: mockups, // Explicitly name the property to ensure it's included
        productType: productParam,
        count: mockups.length
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

      console.log('Current mockup settings before update:', variant.mockup_settings);

      // Initialize or get existing mockup settings
      let mockupSettings = variant.mockup_settings || {};
      if (!mockupSettings.views) {
        mockupSettings.views = [];
      }

      // Normalize view name to use hyphens consistently
      const normalizedView = view.replace('_', '-');

      // Check if view already exists
      const existingViewIndex = mockupSettings.views.findIndex((v: any) => 
        v.view === normalizedView || v.view === view
      );
      
      // Create view data with the original mockup filename
      const viewData = {
        view: normalizedView, // Use normalized view name
        filename: mockupFile,
        url: `/api/v1/admin/products/mockup?filename=${encodeURIComponent(mockupFile)}`,
        webpUrl: `/api/v1/admin/products/mockup?filename=${encodeURIComponent(mockupFile.replace('.png', '.webp'))}`
      };

      console.log('View data to be added/updated:', viewData);

      if (existingViewIndex >= 0) {
        // Update existing view
        console.log(`Updating existing view at index ${existingViewIndex}`);
        mockupSettings.views[existingViewIndex] = viewData;
      } else {
        // Add new view
        console.log('Adding new view');
        mockupSettings.views.push(viewData);
      }

      console.log('Updated mockup settings before saving:', mockupSettings);

      // Update the variant with new mockup settings
      const { data: updateData, error: updateError } = await supabase
        .from('product_variants')
        .update({
          mockup_settings: mockupSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId)
        .select('mockup_settings');

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

      console.log('Variant updated successfully. New mockup settings:', updateData?.[0]?.mockup_settings);

      return new Response(JSON.stringify({
        success: true,
        message: 'Mockup assigned successfully',
        mockupSettings: updateData?.[0]?.mockup_settings
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Handle remove mockup endpoint
    else if (action === 'remove') {
      const { variantId, view, mockupFilename, filename, removeAll } = body;

      // Handle both new and old parameter names
      const fileToRemove = mockupFilename || filename;
      
      console.log('Remove mockup request:', { variantId, view, fileToRemove, removeAll });

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
      console.log('Current mockup settings before removal:', mockupSettings);
      
      if (removeAll) {
        console.log('Removing all mockups');
        // Reset mockup settings completely when removing all
        mockupSettings = { views: [] };
      } else if (fileToRemove) {
        console.log(`Removing specific mockup: ${fileToRemove} with view: ${view || 'any'}`);
        // Initialize views array if it doesn't exist
        if (!mockupSettings.views) {
          mockupSettings.views = [];
        }
        
        // Remove specific mockup
        const beforeCount = mockupSettings.views.length;
        
        if (view) {
          // If view is specified, only remove mockups with that view
          mockupSettings.views = mockupSettings.views.filter((v: any) => {
            const filenameMatch = v.filename === fileToRemove || 
                                 (v.filename && v.filename.includes(fileToRemove));
            return !(v.view === view && filenameMatch);
          });
        } else {
          // If view is not specified, remove any mockup with matching filename
          mockupSettings.views = mockupSettings.views.filter((v: any) => {
            return !(v.filename === fileToRemove || 
                    (v.filename && v.filename.includes(fileToRemove)));
          });
        }
        
        const afterCount = mockupSettings.views.length;
        console.log(`Removed ${beforeCount - afterCount} mockup(s)`);
      }

      console.log('Updated mockup settings after removal:', mockupSettings);

      // Update the variant with new mockup settings
      const { data: updateData, error: updateError } = await supabase
        .from('product_variants')
        .update({
          mockup_settings: mockupSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId)
        .select('mockup_settings');

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

      console.log('Variant updated successfully after removal');

      return new Response(JSON.stringify({
        success: true,
        message: removeAll ? 'All mockups removed successfully' : 'Mockup removed successfully',
        mockupSettings: updateData?.[0]?.mockup_settings
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Handle process mockups endpoint
    else if (action === 'process') {
      const { mockupFiles: providedMockupFiles, productSlug, variantId } = body;

      console.log('Processing mockups request:', { providedMockupFiles, productSlug, variantId });

      if (!productSlug || !variantId) {
        return new Response(JSON.stringify({
          error: 'Bad Request',
          message: 'Missing required fields: productSlug and variantId are required'
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
      
      // If mockupFiles not provided, try to get them from the variant's mockup_settings
      let mockupFiles = providedMockupFiles;
      
      if (!Array.isArray(mockupFiles) || mockupFiles.length === 0) {
        console.log('No mockup files provided, trying to get them from variant mockup_settings');
        
        if (variant.mockup_settings?.views && Array.isArray(variant.mockup_settings.views)) {
          mockupFiles = variant.mockup_settings.views.map((view: any) => view.filename);
          console.log('Found mockup files in variant mockup_settings:', mockupFiles);
        }
      }
      
      // Final check for mockup files
      if (!Array.isArray(mockupFiles) || mockupFiles.length === 0) {
        return new Response(JSON.stringify({
          error: 'Bad Request',
          message: 'No mockup files found to process. Please assign mockups first.'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      // Extract color and size from variant
      const color = extractColorFromVariant(variant);
      let size = '';
      
      console.log('🔍 DEBUG: Extracting size from variant (process endpoint):', {
        variantId: variant.id,
        variantName: variant.name,
        variantOptions: variant.options,
        optionsType: typeof variant.options,
        optionsIsArray: Array.isArray(variant.options)
      });
      
      if (variant.options && Array.isArray(variant.options)) {
        console.log('🔍 DEBUG: Checking variant options for size (process):', variant.options);
        for (const option of variant.options) {
          console.log('🔍 DEBUG: Checking option for size (process):', option);
          if (option.id === 'size') {
            size = option.value;
            console.log('🔍 DEBUG: Found size in options (process):', size);
            break;
          }
        }
      } else {
        console.log('🔍 DEBUG: No valid options array found for size extraction (process), variant.options is:', variant.options);
      }
      
      console.log('🔍 DEBUG: Final extracted size (process):', size);
      console.log('🔍 DEBUG: Final extracted color (process):', color);

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

      // Get fs and path modules before using them
      const fs = await getFs();
      const path = await getPath();

      // Process mockup files
      const processedFiles = await Promise.all(mockupFiles.map(async (file: string) => {
        try {
          // Setup source and target directories
          const sourceDir = path.join(process.cwd(), 'src', 'assets', 'mockups-new');
          
          // Target directories for both the public folder and src/assets/mockups
          const publicTargetDir = path.join(process.cwd(), 'public', 'images', 'mockups', productSlug);
          const srcTargetDir = path.join(process.cwd(), 'src', 'assets', 'mockups', productSlug);
          
          // Ensure target directories exist
          await fs.promises.mkdir(publicTargetDir, { recursive: true });
          await fs.promises.mkdir(srcTargetDir, { recursive: true });
          
          // Get the base filename without any path
          const baseFilename = path.basename(file);
          
          // Get source file path
          const sourceFile = path.join(sourceDir, baseFilename);
          
          // Check if source file exists
          if (!fs.existsSync(sourceFile)) {
            console.error(`Source file not found: ${sourceFile}`);
            return null;
          }
          
          // Find the assigned view for this file from the mockup settings
          let assignedView = null;
          if (variant.mockup_settings?.views && Array.isArray(variant.mockup_settings.views)) {
            const assignedMockup = variant.mockup_settings.views.find((v: any) => v.filename === baseFilename);
            if (assignedMockup) {
              assignedView = assignedMockup.view;
              console.log(`Found assigned view for ${baseFilename}: ${assignedView}`);
            }
          }
          
          // Use assigned view if found, otherwise determine from filename
          const view = assignedView || determineViewFromFilename(baseFilename);
          console.log(`Using view for ${baseFilename}: ${view} (assigned: ${!!assignedView})`);
          
          // Generate standardized filename
          const newFilename = generateMockupFilename(
            productSlug,
            color || 'unknown',
            size || '',
            view
          );

          // Get target file paths
          const srcTargetFile = path.join(srcTargetDir, newFilename);
          
          // Copy file to src/assets/mockups first (for the optimization script to find)
          try {
            console.log(`Copying file from ${sourceFile} to ${srcTargetFile}`);
            await fs.promises.copyFile(sourceFile, srcTargetFile);
            console.log(`Successfully copied file to ${srcTargetFile}`);
            
            // Verify the file was copied
            if (fs.existsSync(srcTargetFile)) {
              console.log(`Verified file exists at ${srcTargetFile}`);
              
              // Remove the source file after successful copy
              let fileRemoved = false;
              try {
                await fs.promises.unlink(sourceFile);
                console.log(`Removed original file from ${sourceFile}`);
                fileRemoved = true;
              } catch (unlinkError) {
                console.error(`Warning: Could not remove original file ${sourceFile}:`, unlinkError);
                // Continue even if removal fails
              }
            } else {
              console.error(`File not found at ${srcTargetFile} after copy operation`);
            }
          } catch (copyError) {
            console.error(`Error copying file to ${srcTargetFile}:`, copyError);
            throw copyError;
          }

          // Add to mockup settings
          let mockupSettings = variant.mockup_settings || {};
          if (!mockupSettings.views) {
            mockupSettings.views = [];
          }

          const viewData = {
            view,
            filename: newFilename.replace('.png', ''),
            // Use the correct public URL path format with the product slug subdirectory
            url: `/images/mockups/${productSlug}/${newFilename}`,
            webpUrl: `/images/mockups/${productSlug}/${newFilename.replace('.png', '.webp')}`
          };

          // Check if view already exists
          const existingViewIndex = mockupSettings.views.findIndex((v: any) => v.view === view);
          if (existingViewIndex >= 0) {
            mockupSettings.views[existingViewIndex] = viewData;
          } else {
            mockupSettings.views.push(viewData);
          }

          // Update variant with new mockup settings
          const { error: updateError } = await supabase
            .from('product_variants')
            .update({
              mockup_settings: mockupSettings,
              updated_at: new Date().toISOString()
            })
            .eq('id', variantId);

          if (updateError) {
            throw new Error(`Failed to update variant mockup settings: ${updateError.message}`);
          }

          // Check if the source file still exists (if not, it was successfully removed)
          const fileRemoved = !fs.existsSync(sourceFile);

          return {
            oldFile: file,
            newFile: newFilename,
            view,
            removed: fileRemoved
          };
        } catch (error) {
          console.error('Error processing mockup file:', error);
          throw error;
        }
      }));

      // Filter out null values from processedFiles
      const validProcessedFiles = processedFiles.filter(file => file !== null) as Array<{
        oldFile: string;
        newFile: string;
        view: string;
        removed: boolean;
      }>;

      // Track removals for reporting
      const removedFiles = validProcessedFiles.filter(f => f.removed).length;
      const totalFiles = validProcessedFiles.length;

      // After all files are moved, run the optimization script
      // The script will handle copying from src/assets/mockups to public/images/mockups
      if (validProcessedFiles.length > 0) {
        try {
          // Just pass the relative paths (filenames) to the optimization script
          // since it's hardcoded to look in src/assets/mockups
          const relativeFilePaths = validProcessedFiles.map(f => 
            path.join(productSlug, f.newFile)
          );
          
          console.log('Running optimization with relative paths:', relativeFilePaths);
          console.log('Full source paths:', validProcessedFiles.map(f => path.join(process.cwd(), 'src', 'assets', 'mockups', productSlug, f.newFile)));
          console.log('Full target paths:', validProcessedFiles.map(f => path.join(process.cwd(), 'public', 'images', 'mockups', productSlug, f.newFile)));
          
          // Run the optimization script with the relative paths
          await runOptimizeImagesScript(relativeFilePaths);
          console.log('Optimization script completed');
        } catch (error) {
          console.error('Error during image optimization:', error);
          // Continue with the response even if optimization fails
        }
      }

      console.log('Files processed:', validProcessedFiles);

      return new Response(JSON.stringify({
        success: true,
        message: `Successfully processed ${validProcessedFiles.length} mockup files. ${removedFiles} files removed from mockups-new.`,
        processedFiles: validProcessedFiles,
        details: {
          totalFiles: mockupFiles.length,
          processedCount: validProcessedFiles.length,
          removedCount: removedFiles,
          views: validProcessedFiles.map(f => f.view)
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
