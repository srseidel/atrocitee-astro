#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get files to optimize from command line arguments
const filesToOptimize = process.argv.slice(2);

// Create destination directory if it doesn't exist
const sourceDir = path.join(__dirname, '../src/assets/mockups');
const destDir = path.join(__dirname, '../public/images/mockups');

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
  console.log(`Created directory: ${destDir}`);
}

// Get image files to process
const imageFiles = filesToOptimize.length > 0 
  ? filesToOptimize 
  : readdirSync(sourceDir).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

console.log(`Found ${imageFiles.length} images to optimize`);

// Optimization settings
const jpegOptions = { 
  quality: 80, 
  mozjpeg: true 
};

const pngOptions = { 
  quality: 80, 
  compressionLevel: 8,
  palette: false // Don't use palette reduction for product images to maintain quality
};

const webpOptions = { 
  quality: 80,
  lossless: false,
  nearLossless: false
};

// Process each image
let successCount = 0;
let errorCount = 0;

// Process images one at a time to avoid overwhelming the system
async function processImages() {
  for (const file of imageFiles) {
    const sourcePath = path.join(sourceDir, file);
    const fileExt = path.extname(file).toLowerCase();
    const fileName = path.basename(file, fileExt);
    
    try {
      console.log(`Optimizing: ${file}`);
      
      // Initialize Sharp with the source image
      const image = sharp(sourcePath);
      
      // Get image metadata
      const metadata = await image.metadata();
      console.log(`Image dimensions: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);
      
      // Preserve the original file extension for the output file
      const outputPath = path.join(destDir, `${fileName}${fileExt}`);
      
      // Apply optimization based on file type
      if (fileExt === '.jpg' || fileExt === '.jpeg') {
        await image
          .jpeg(jpegOptions)
          .toFile(outputPath);
        console.log(`✅ Optimized JPEG: ${outputPath}`);
      } else if (fileExt === '.png') {
        // For PNG files, we need to be careful with transparency
        await image
          .png(pngOptions)
          .toFile(outputPath);
        console.log(`✅ Optimized PNG: ${outputPath}`);
      } else if (fileExt === '.webp') {
        await image
          .webp(webpOptions)
          .toFile(outputPath);
        console.log(`✅ Optimized WebP: ${outputPath}`);
      }
      
      // Create a WebP version for all non-WebP images
      // Only create WebP if the source is not already WebP
      if (fileExt !== '.webp') {
        const webpOptions = {
          quality: 80,
          // Use lossless for PNGs to preserve transparency
          lossless: fileExt === '.png',
          nearLossless: false
        };
        
        const webpOutputPath = path.join(destDir, `${fileName}.webp`);
        await image
          .webp(webpOptions)
          .toFile(webpOutputPath);
        console.log(`✅ Created WebP version: ${webpOutputPath}`);
      }
      
      console.log(`✅ Optimized: ${file}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error optimizing ${file}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`Image optimization complete! ${successCount} successful, ${errorCount} failed`);
  
  // Print a summary of the types of images processed
  const jpgCount = imageFiles.filter(file => /\.(jpg|jpeg)$/i.test(file)).length;
  const pngCount = imageFiles.filter(file => /\.png$/i.test(file)).length;
  const webpCount = imageFiles.filter(file => /\.webp$/i.test(file)).length;
  
  console.log(`\nImage types processed:`);
  console.log(`- JPG/JPEG: ${jpgCount}`);
  console.log(`- PNG: ${pngCount}`);
  console.log(`- WebP: ${webpCount}`);
  console.log(`\nTotal WebP images created: ${jpgCount + pngCount}`);
}

// Run the image processing
processImages().catch(err => {
  console.error('Fatal error during image optimization:', err);
  process.exit(1);
}); 