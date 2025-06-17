#!/usr/bin/env node

import 'dotenv/config';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the download function directly since ESM import paths are strict
const downloadMockupsFunctions = await import('../src/utils/helpers/download-mockups.ts')
  .catch(() => {
    // If TS file doesn't load directly, try JS version
    return import('../src/utils/helpers/download-mockups.js')
      .catch(() => {
        console.error('Error loading download-mockups module. Creating a simplified version for testing.');

        // Define simple versions of the necessary functions
        const downloadMockupImage = async (url, productSlug, variant, view) => {
          try {
            const filename = `${productSlug}-${variant}-${view}-test.jpg`;
            const filepath = path.join(process.cwd(), 'src', 'assets', 'mockups', filename);
            
            console.log(`Downloading image: ${url}`);
            console.log(`Saving to: ${filepath}`);
            
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
            
            console.log(`Successfully downloaded: ${filename}`);
            
            return filename;
          } catch (error) {
            console.error('Error downloading mockup:', error);
            throw error;
          }
        };

        const downloadVariantMockups = async (productSlug, variantName, files) => {
          const results = [];
          
          console.log(`Processing mockups for ${productSlug}, variant: ${variantName}`);
          console.log(`Found ${files.length} files to process`);
          
          for (const file of files) {
            try {
              // Get the URL to download - prefer preview_url if available
              const downloadUrl = file.preview_url || file.url;
              if (!downloadUrl) {
                console.warn(`No URL available for file type ${file.type}`);
                continue;
              }

              // Determine view type based on file type
              let viewType = 'front';
              if (file.type.includes('back')) viewType = 'back';
              if (file.type.includes('left')) viewType = 'left';
              if (file.type.includes('right')) viewType = 'right';
              
              console.log(`File type "${file.type}" mapped to view type "${viewType}"`);
              
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
          
          console.log(`Successfully downloaded ${results.length} mockups for ${productSlug} ${variantName}`);
          return results;
        };

        return { downloadVariantMockups };
      });
  });

// Use the imported or fallback function
const { downloadVariantMockups } = downloadMockupsFunctions;

// Check that the API key is available
const API_KEY = process.env.PRINTFUL_API_KEY;
if (!API_KEY) {
  console.error('Error: PRINTFUL_API_KEY environment variable is not set');
  process.exit(1);
}

// Get the product ID from command line
const productId = process.argv[2];
if (!productId) {
  console.error('Usage: node test-download-mockup.js <product_id>');
  console.error('Please provide a Printful sync product ID');
  process.exit(1);
}

// We'll download mockups for just one variant for testing
const variantIndex = parseInt(process.argv[3] || '0', 10);

async function fetchPrintfulProductDetails(productId) {
  const url = `https://api.printful.com/sync/products/${productId}`;
  
  console.log(`Fetching product details from Printful API: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data from Printful:', error);
    throw error;
  }
}

async function testDownload() {
  try {
    // Fetch the product details from Printful
    const productData = await fetchPrintfulProductDetails(productId);
    
    // Confirm we got data
    if (!productData || !productData.result) {
      console.error('Error: Invalid response from Printful API');
      console.log('Raw response:', JSON.stringify(productData, null, 2));
      process.exit(1);
    }
    
    // Extract product and variant data
    const { sync_product, sync_variants } = productData.result;
    
    if (!sync_variants || sync_variants.length === 0) {
      console.error('No variants found for this product');
      process.exit(1);
    }
    
    if (variantIndex >= sync_variants.length) {
      console.error(`Invalid variant index ${variantIndex}. Product has ${sync_variants.length} variants.`);
      process.exit(1);
    }
    
    // Get the variant to test
    const variant = sync_variants[variantIndex];
    
    console.log(`\n============ Testing Mockup Download ============`);
    console.log(`Product: ${sync_product.name} (ID: ${sync_product.id})`);
    console.log(`Variant: ${variant.name} (ID: ${variant.id})`);
    
    // Extract color and size from the variant name if not in options
    let color = variant.options?.find(opt => opt.id === 'color')?.value;
    let size = variant.options?.find(opt => opt.id === 'size')?.value;
    
    // If we couldn't find color/size in options, try extracting from name
    if (!color || !size) {
      const nameParts = variant.name.split('/');
      if (nameParts.length >= 3) {
        color = color || nameParts[1].trim();
        size = size || nameParts[2].trim();
      }
    }
    
    console.log(`Color: ${color || 'Unknown'}, Size: ${size || 'Unknown'}`);
    
    // Get the files
    if (!variant.files || variant.files.length === 0) {
      console.error('No files found for this variant');
      process.exit(1);
    }
    
    console.log(`Found ${variant.files.length} files for this variant`);
    
    // Generate slug for testing (normally you'd use your database slug)
    const slug = sync_product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Download the mockups
    console.log(`\n============ Starting Download ============`);
    const results = await downloadVariantMockups(
      slug,
      variant.name,
      variant.files
    );
    
    console.log(`\n============ Download Results ============`);
    console.log(`Downloaded ${results.length} mockup files:`);
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. Type: ${result.type}, Filename: ${result.filename}`);
    });
    
    console.log(`\nTo view these images, check the src/assets/mockups directory`);
    console.log(`To optimize them for the website, run: npm run optimize-images`);
    
  } catch (error) {
    console.error('Error testing mockup download:', error);
    process.exit(1);
  }
}

// Run the test
testDownload(); 