#!/usr/bin/env node

import 'dotenv/config';
import fetch from 'node-fetch';

// Check that the API key is available
const API_KEY = process.env.PRINTFUL_API_KEY;
if (!API_KEY) {
  console.error('Error: PRINTFUL_API_KEY environment variable is not set');
  process.exit(1);
}

// Get the product ID from command line
const productId = process.argv[2];
if (!productId) {
  console.error('Usage: node check-printful-mockups.js <product_id>');
  console.error('Please provide a Printful sync product ID');
  process.exit(1);
}

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

async function analyzeMockups() {
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
    
    console.log(`\n============ Product Details ============`);
    console.log(`Product ID: ${sync_product.id}`);
    console.log(`Name: ${sync_product.name}`);
    console.log(`External ID: ${sync_product.external_id}`);
    console.log(`Variants Count: ${sync_product.variants_count}`);
    
    // Analyze each variant
    console.log(`\n============ Variant Analysis ============`);
    console.log(`Found ${sync_variants.length} variants`);
    
    const allFiles = [];
    const fileTypeStats = {};
    
    sync_variants.forEach((variant, index) => {
      console.log(`\n------ Variant ${index + 1}: ${variant.name} ------`);
      console.log(`Variant ID: ${variant.id}`);
      console.log(`SKU: ${variant.sku}`);
      
      // Extract color and size from options
      const color = variant.options.find(opt => opt.id === 'color')?.value || 'Unknown';
      const size = variant.options.find(opt => opt.id === 'size')?.value || 'Unknown';
      console.log(`Color: ${color}, Size: ${size}`);
      
      // Analyze files
      if (variant.files && variant.files.length > 0) {
        console.log(`\nFiles for this variant (${variant.files.length}):`);
        
        variant.files.forEach(file => {
          console.log(`  - Type: ${file.type}`);
          console.log(`    Preview URL: ${file.preview_url}`);
          console.log(`    URL: ${file.url}`);
          
          // Add to stats
          fileTypeStats[file.type] = (fileTypeStats[file.type] || 0) + 1;
          
          // Add to all files collection
          allFiles.push({
            variant: variant.name,
            color,
            size,
            fileType: file.type,
            previewUrl: file.preview_url,
            url: file.url
          });
        });
      } else {
        console.log('No files found for this variant!');
      }
    });
    
    // Summary statistics
    console.log(`\n============ File Type Summary ============`);
    console.log('Number of unique file types found:', Object.keys(fileTypeStats).length);
    
    for (const [fileType, count] of Object.entries(fileTypeStats)) {
      console.log(`${fileType}: ${count} files`);
    }
    
    // Output a sample command to download a mockup
    if (allFiles.length > 0) {
      const sampleFile = allFiles[0];
      console.log(`\n============ Sample Download Command ============`);
      console.log(`curl -o "sample-mockup-${sampleFile.color}-${sampleFile.size}.jpg" "${sampleFile.previewUrl}"`);
    }
    
  } catch (error) {
    console.error('Error analyzing mockups:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeMockups(); 