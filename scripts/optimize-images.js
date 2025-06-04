#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create destination directory if it doesn't exist
const sourceDir = path.join(__dirname, '../src/assets/mockups');
const destDir = path.join(__dirname, '../public/images/mockups');

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
  console.log(`Created directory: ${destDir}`);
}

// Get all image files from source directory
const imageFiles = readdirSync(sourceDir)
  .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

console.log(`Found ${imageFiles.length} images to optimize`);

// Optimization settings
const jpegOptions = { 
  quality: 80, 
  mozjpeg: true 
};

const pngOptions = { 
  quality: 80, 
  compressionLevel: 8 
};

const webpOptions = { 
  quality: 80 
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
      
      // Apply optimization based on file type
      if (fileExt === '.jpg' || fileExt === '.jpeg') {
        await image
          .jpeg(jpegOptions)
          .toFile(path.join(destDir, `${fileName}.jpg`));
      } else if (fileExt === '.png') {
        await image
          .png(pngOptions)
          .toFile(path.join(destDir, `${fileName}.png`));
      } else if (fileExt === '.webp') {
        await image
          .webp(webpOptions)
          .toFile(path.join(destDir, `${fileName}.webp`));
      }
      
      // Create a WebP version for all non-WebP images
      if (fileExt !== '.webp') {
        await image
          .webp(webpOptions)
          .toFile(path.join(destDir, `${fileName}.webp`));
        console.log(`✅ Created WebP version: ${fileName}.webp`);
      }
      
      console.log(`✅ Optimized: ${file}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error optimizing ${file}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`Image optimization complete! ${successCount} successful, ${errorCount} failed`);
}

// Run the image processing
processImages().catch(err => {
  console.error('Fatal error during image optimization:', err);
  process.exit(1);
}); 