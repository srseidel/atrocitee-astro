import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fsPromises } from 'fs';

// Define constants
const MOCKUPS_NEW_DIR = 'src/assets/mockups-new';
const MOCKUPS_DIR = 'src/assets/mockups';

/**
 * Find potential mockups that might match a product based on name
 * @param productName The product name to match against
 * @returns Array of filenames that might match this product
 */
export async function findPotentialMockups(productName: string): Promise<string[]> {
  try {
    // Get all files in mockups-new directory
    const files = await fsPromises.readdir(MOCKUPS_NEW_DIR);
    
    // Create search terms from the product name
    const searchTerms = productName.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    
    // Filter files that might match this product
    return files.filter(file => {
      const filename = file.toLowerCase();
      // Check if the filename contains all search terms
      return searchTerms.every(term => filename.includes(term));
    });
  } catch (error) {
    console.error('Error finding potential mockups:', error);
    return [];
  }
}

/**
 * Parse a Printful filename to extract product, color, variant info
 * @param filename The filename to parse
 * @returns Object with parsed information
 */
export function parsePrintfulFilename(filename: string): {
  productType: string;
  color: string;
  view: string;
  hash?: string;
} {
  // Example filenames:
  // unisex-classic-tee-white-front-684ca4d685cae.png
  // under-armour-dad-hat-black-front-684cafd737818.png
  
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  
  // Extract hash if present (last segment after last dash)
  let hash: string | undefined;
  const hashMatch = nameWithoutExt.match(/-([0-9a-f]+)$/);
  let nameWithoutHash = nameWithoutExt;
  
  if (hashMatch) {
    hash = hashMatch[1];
    nameWithoutHash = nameWithoutExt.replace(/-([0-9a-f]+)$/, '');
  }
  
  // Split remaining name by dashes
  const parts = nameWithoutHash.split('-');
  
  // The view is typically the last part
  const view = parts.pop() || 'front';
  
  // The color is typically the second-to-last part
  const color = parts.pop() || 'unknown';
  
  // Everything else is considered the product type
  const productType = parts.join('-');
  
  return {
    productType,
    color,
    view,
    hash
  };
}

/**
 * Generate our standardized filename from product and variant data
 * @param productSlug The product slug
 * @param color The color
 * @param size The size (if applicable)
 * @param view The view type
 * @returns Standardized filename
 */
export function generateMockupFilename(
  productSlug: string,
  color: string,
  size: string,
  view: string
): string {
  // Clean up inputs
  const cleanSlug = productSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const cleanColor = color.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const cleanSize = size ? size.toLowerCase().replace(/[^a-z0-9-]/g, '-') : '';
  const cleanView = view.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
  // Generate filename with format: product-color-size-view.png
  const filename = [
    cleanSlug,
    cleanColor,
    cleanSize,
    cleanView
  ].filter(Boolean).join('-') + '.png';
  
  return filename;
}

/**
 * Ensure directory exists
 * @param dirPath Directory path to ensure exists
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fsPromises.access(dirPath);
  } catch {
    await fsPromises.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Assign a mockup from mockups-new to a specific variant
 * @param mockupFile Source filename in mockups-new
 * @param variantId Variant ID
 * @param productSlug Product slug
 * @param view View type
 * @param color Color
 * @param size Size
 * @returns New filename
 */
export async function assignMockupToVariant(
  mockupFile: string,
  variantId: string,
  productSlug: string,
  view: string,
  color: string,
  size: string
): Promise<string> {
  // Generate new filename
  const newFilename = generateMockupFilename(productSlug, color, size, view);
  
  // Create product directory if needed
  const productDir = path.join(MOCKUPS_DIR, productSlug);
  await ensureDirectoryExists(productDir);
  
  // Source and destination paths
  const sourcePath = path.join(MOCKUPS_NEW_DIR, mockupFile);
  const destPath = path.join(productDir, newFilename);
  
  try {
    // Copy the file (don't move to keep original)
    await fsPromises.copyFile(sourcePath, destPath);
    console.log(`Assigned mockup: ${mockupFile} → ${newFilename}`);
    return newFilename;
  } catch (error) {
    console.error(`Error assigning mockup ${mockupFile}:`, error);
    throw new Error(`Failed to assign mockup: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get all mockups for a product slug
 * @param productSlug The product slug
 * @returns Array of mockup filenames
 */
export async function getProductMockups(productSlug: string): Promise<string[]> {
  const productDir = path.join(MOCKUPS_DIR, productSlug);
  
  try {
    return await fsPromises.readdir(productDir);
  } catch (error) {
    // If directory doesn't exist, return empty array
    return [];
  }
}

/**
 * Extract variant info from a mockup filename
 * @param filename The mockup filename
 * @returns Object with color, size, view
 */
export function extractVariantInfoFromMockup(filename: string): {
  color: string;
  size: string;
  view: string;
} {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  
  // Split by dashes
  const parts = nameWithoutExt.split('-');
  
  // For a filename like: product-slug-color-size-view.png
  // We need at least 4 parts: product, color, size, view
  if (parts.length < 4) {
    return {
      color: 'unknown',
      size: 'unknown',
      view: 'front'
    };
  }
  
  // View is always the last part
  const view = parts.pop() || 'front';
  
  // Size is the second-to-last part
  const size = parts.pop() || '';
  
  // Color is the third-to-last part
  const color = parts.pop() || 'unknown';
  
  return { color, size, view };
}

/**
 * Remove a mockup from a variant
 * @param productSlug The product slug
 * @param mockupFilename The mockup filename to remove
 * @returns True if successful
 */
export async function removeMockupFromVariant(
  productSlug: string,
  mockupFilename: string
): Promise<boolean> {
  try {
    const mockupPath = path.join(MOCKUPS_DIR, productSlug, mockupFilename);
    await fsPromises.unlink(mockupPath);
    return true;
  } catch (error) {
    console.error('Error removing mockup:', error);
    return false;
  }
}

/**
 * Get all unassigned mockups from mockups-new
 * @returns Array of filenames
 */
export async function getUnassignedMockups(): Promise<string[]> {
  try {
    return await fsPromises.readdir(MOCKUPS_NEW_DIR);
  } catch (error) {
    console.error('Error getting unassigned mockups:', error);
    return [];
  }
} 