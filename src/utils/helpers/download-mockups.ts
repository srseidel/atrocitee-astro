import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { optimizeImage } from './optimize-images';

const streamPipeline = promisify(pipeline);

interface MockupFile {
  type: string;
  url: string;
  preview_url: string;
  generated?: boolean;
  mockup_task_id?: string;
}

interface DownloadedFile {
  type: string;
  viewType: string;
  originalUrl: string;
  localPath: string;
  optimizedPath: string;
}

/**
 * Map Printful file types to our view types
 */
function mapFileTypeToViewType(fileType: string): string {
  // First check for directly generated mockup types
  // These are the types we specified when generating mockups
  switch (fileType) {
    case 'front':
      return 'front';
    case 'back':
      return 'back';
    case 'left_front':
    case 'left':
      return 'left';
    case 'right_front':
    case 'right':
      return 'right';
    case 'flat':
      return 'flat';
    case 'lifestyle':
      return 'lifestyle';
  }
  
  // Fall back to the original mapping for Printful sync API files
  switch (fileType) {
    case 'front':
    case 'front_dtf': 
    case 'front_outside':
    case 'preview':
      return 'front';
    case 'back':
    case 'back_dtf':
    case 'back_outside':
      return 'back';
    case 'side':
      return 'side';
    case 'lifestyle1':
    case 'lifestyle2':
      return 'lifestyle';
    default:
      // If we don't have a specific mapping, use the original type
      // This ensures we don't lose any files
      return fileType;
  }
}

/**
 * Download mockup images for a specific variant
 */
export async function downloadVariantMockups(
  productSlug: string,
  variantName: string,
  files: MockupFile[]
): Promise<DownloadedFile[]> {
  console.log(`Downloading mockups for ${productSlug} - ${variantName}`);
  
  // Create variant-friendly name (remove spaces, special chars)
  const variantSlug = variantName.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Create the directory structure
  const baseDir = path.join(process.cwd(), 'public', 'images', 'products', productSlug);
  fs.mkdirSync(baseDir, { recursive: true });
  
  const mockupFiles: DownloadedFile[] = [];
  
  // Process each file
  for (const file of files) {
    try {
      // Skip non-mockup files
      if (!file.url) {
        console.log(`Skipping file with no URL: ${file.type}`);
        continue;
      }
      
      // Map file type to view type
      const viewType = mapFileTypeToViewType(file.type);
      
      // Create filename based on view type and variant
      const fileName = `${productSlug}-${variantSlug}-${viewType}.jpg`;
      const filePath = path.join(baseDir, fileName);
      
      console.log(`Downloading ${file.type} (${viewType}) from ${file.url}`);
      
      // Download the file
      const response = await fetch(file.url);
      
      if (!response.ok) {
        console.error(`Failed to download mockup: ${response.status} ${response.statusText}`);
        continue;
      }
      
      if (!response.body) {
        console.error('No response body');
        continue;
      }
      
      // Save the file
      await streamPipeline(response.body, fs.createWriteStream(filePath));
      console.log(`Downloaded to ${filePath}`);
      
      // Optimize the image
      const optimizedPath = await optimizeImage(filePath, {
        quality: 80,
        width: 1200
      });
      
      mockupFiles.push({
        type: file.type,
        viewType,
        originalUrl: file.url,
        localPath: filePath,
        optimizedPath
      });
    } catch (error) {
      console.error(`Error downloading mockup for ${file.type}:`, error);
    }
  }
  
  return mockupFiles;
} 