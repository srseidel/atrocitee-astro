#!/usr/bin/env node

/**
 * Script to move mockup images from mockups-new to mockups directory with proper naming
 */

const fs = require('fs');
const path = require('path');

// Directory paths
const sourceDir = path.join(__dirname, '..', 'src', 'assets', 'mockups-new');
const targetDir = path.join(__dirname, '..', 'src', 'assets', 'mockups');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created target directory: ${targetDir}`);
}

// Get all mockup files from the source directory
const mockupFiles = fs.readdirSync(sourceDir)
  .filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));

console.log(`Found ${mockupFiles.length} mockup files in source directory`);

// Process each mockup file
let processedCount = 0;
let skippedCount = 0;

mockupFiles.forEach(filename => {
  try {
    const sourcePath = path.join(sourceDir, filename);
    
    // Extract product type and color from filename
    // Example: "under-armour-dad-hat-black-front-684cafd737818.png"
    const parts = filename.split('-');
    
    // Find the view part (front, back, etc.)
    const viewKeywords = ['front', 'back', 'left', 'right', 'flat', 'lifestyle'];
    let viewIndex = -1;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].toLowerCase();
      if (viewKeywords.some(keyword => part.includes(keyword))) {
        viewIndex = i;
        break;
      }
    }
    
    if (viewIndex === -1) {
      console.warn(`Could not determine view for file: ${filename}, skipping`);
      skippedCount++;
      return;
    }
    
    // Extract product type (everything before the view)
    const productType = parts.slice(0, viewIndex).join('-');
    
    // Extract color (typically right before the view)
    const colorIndex = viewIndex - 1;
    const color = colorIndex >= 0 ? parts[colorIndex] : 'unknown';
    
    // Extract view
    let view = parts[viewIndex].replace('.png', '').replace('.jpg', '').replace('.jpeg', '');
    
    // Handle compound views like "left-front"
    if (viewIndex + 1 < parts.length && 
        (parts[viewIndex + 1].includes('front') || parts[viewIndex + 1].includes('back'))) {
      view = `${view}-${parts[viewIndex + 1]}`;
    }
    
    // Clean up the view by removing any hash or ID
    view = view.split('-').filter(part => {
      // Keep only parts that are actual view names
      return viewKeywords.some(keyword => part.includes(keyword));
    }).join('-');
    
    // Construct new filename: product-type-color-view.ext
    const extension = path.extname(filename);
    const newFilename = `${productType}-${color}-${view}${extension}`;
    const targetPath = path.join(targetDir, newFilename);
    
    // Check if target file already exists
    if (fs.existsSync(targetPath)) {
      console.log(`File already exists: ${newFilename}, skipping`);
      skippedCount++;
      return;
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Processed: ${filename} -> ${newFilename}`);
    processedCount++;
  } catch (error) {
    console.error(`Error processing file ${filename}:`, error);
    skippedCount++;
  }
});

console.log(`\nProcessing complete: ${processedCount} files processed, ${skippedCount} files skipped`); 