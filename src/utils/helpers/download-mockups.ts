import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

/**
 * Downloads a mockup image from Printful and saves it locally
 */
export async function downloadMockupImage(url: string, productSlug: string, variant: string, view: string): Promise<string> {
  try {
    // Create a hash of the URL to ensure unique filenames
    const hash = createHash('md5').update(url).digest('hex').slice(0, 12);
    
    // Create filename in format: product-slug-variant-view-hash.jpg
    const filename = `${productSlug}-${variant}-${view}-${hash}.jpg`;
    const filepath = path.join(process.cwd(), 'src', 'assets', 'mockups', filename);
    
    // Download the image
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save the image
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    
    // Return the filename for reference
    return filename;
  } catch (error) {
    console.error('Error downloading mockup:', error);
    throw error;
  }
}

/**
 * Downloads all mockups for a product variant
 */
export async function downloadVariantMockups(
  productSlug: string,
  variantName: string,
  files: Array<{ type: string; url: string; preview_url: string }>
): Promise<Array<{ type: string; filename: string }>> {
  const results = [];
  
  for (const file of files) {
    try {
      // Get the URL to download - prefer preview_url if available
      const downloadUrl = file.preview_url || file.url;
      if (!downloadUrl) {
        console.warn(`No URL available for file type ${file.type}`);
        continue;
      }

      // Map Printful file types to our view types
      let viewType = file.type;
      if (file.type === 'preview') {
        viewType = 'front'; // Default preview images to front view
      } else if (file.type.includes('front')) {
        viewType = 'front';
      } else if (file.type.includes('back')) {
        viewType = 'back';
      }
      
      // Clean up variant name for filename
      const cleanVariantName = variantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const filename = await downloadMockupImage(
        downloadUrl,
        productSlug,
        cleanVariantName,
        viewType
      );
      
      results.push({
        type: viewType,
        filename
      });
    } catch (error) {
      console.error(`Failed to download mockup for ${productSlug} ${variantName}:`, error);
    }
  }
  
  return results;
} 