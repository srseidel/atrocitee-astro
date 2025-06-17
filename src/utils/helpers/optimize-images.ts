import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

interface OptimizeOptions {
  quality?: number;
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format?: 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif';
}

/**
 * Optimize an image and save it in multiple formats
 * 
 * @param inputPath Path to the input image
 * @param options Optimization options
 * @returns Path to the optimized image
 */
export async function optimizeImage(
  inputPath: string,
  options: OptimizeOptions = {}
): Promise<string> {
  try {
    const { 
      quality = 80,
      width,
      height,
      fit = 'cover',
      format = 'webp'
    } = options;
    
    // Create Sharp instance
    let image = sharp(inputPath);
    
    // Resize if dimensions provided
    if (width || height) {
      image = image.resize({
        width,
        height,
        fit,
        withoutEnlargement: true
      });
    }
    
    // Get input file info
    const parsedPath = path.parse(inputPath);
    const outputDir = parsedPath.dir;
    const baseName = parsedPath.name;
    
    // Generate filename for optimized image
    const outputPath = path.join(outputDir, `${baseName}.${format}`);
    
    // Process based on format
    if (format === 'webp') {
      await image
        .webp({ quality })
        .toFile(outputPath);
    } else if (format === 'avif') {
      await image
        .avif({ quality })
        .toFile(outputPath);
    } else if (format === 'png') {
      await image
        .png({ quality })
        .toFile(outputPath);
    } else {
      // Default to jpeg/jpg
      await image
        .jpeg({ quality })
        .toFile(outputPath);
    }
    
    console.log(`Optimized image saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Return original path if optimization fails
    return inputPath;
  }
}

/**
 * Create multiple optimized versions of an image
 * 
 * @param inputPath Path to the input image
 * @param options Optimization options
 * @returns Object with paths to all generated images
 */
export async function createImageVariants(
  inputPath: string,
  options: OptimizeOptions = {}
): Promise<Record<string, string>> {
  const paths: Record<string, string> = {};
  
  try {
    // Generate webp version
    paths.webp = await optimizeImage(inputPath, { ...options, format: 'webp' });
    
    // Generate jpg version
    paths.jpg = await optimizeImage(inputPath, { ...options, format: 'jpg' });
    
    // Add original path
    paths.original = inputPath;
    
    return paths;
  } catch (error) {
    console.error('Error creating image variants:', error);
    return { original: inputPath };
  }
} 