/**
 * ESM-compatible version of mockup utilities for client-side use
 * Contains only the functions needed by product pages
 */

/**
 * Parse a mockup filename to extract product, color, variant info
 * @param filename The filename to parse
 * @returns Object with parsed information or null if parsing fails
 */
export function parseMockupFilename(filename: string): {
  productType: string;
  color: string;
  size?: string;
  view: string;
  hash?: string;
} | null {
  if (!filename) return null;
  
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
  
  // Check if the second-to-last part is a size
  let size: string | undefined;
  let color: string = 'unknown';
  
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1].toLowerCase();
    
    // Check if it's a size (common patterns like s, m, l, xl, 2xl, etc.)
    const sizePattern = /^(xs|s|m|l|xl|2xl|3xl|4xl|5xl|6xl|one|size|one-size|small|medium|large|x-large|xx-large)$/i;
    
    if (sizePattern.test(lastPart)) {
      // It's a size
      size = parts.pop() || undefined;
      
      // Format size properly
      if (size) {
        if (/^[0-9]+xl$/i.test(size)) {
          // Convert 2xl to 2XL format
          size = size.replace(/^([0-9]+)xl$/i, '$1XL');
        } else if (/^[xsml]$/i.test(size)) {
          // Single letter sizes to uppercase
          size = size.toUpperCase();
        } else if (size.toLowerCase() === 'xl') {
          size = 'XL';
        } else if (size.toLowerCase() === 'one-size' || size.toLowerCase() === 'one') {
          size = 'One Size';
        }
      }
      
      // Color is now the next part
      if (parts.length > 0) {
        color = parts.pop() || 'unknown';
      }
    } else {
      // It's a color
      color = parts.pop() || 'unknown';
    }
  }
  
  // Everything else is considered the product type
  const productType = parts.join('-');
  
  // Capitalize color
  color = color.charAt(0).toUpperCase() + color.slice(1);
  
  return {
    productType,
    color,
    size,
    view,
    hash
  };
}

/**
 * Get a human-readable label for a view type
 * @param view The view type (e.g., 'front', 'back')
 * @returns Human-readable label
 */
export function getViewLabel(view: string): string {
  const viewMap: Record<string, string> = {
    'front': 'Front View',
    'back': 'Back View',
    'left': 'Left Side',
    'right': 'Right Side',
    'detail': 'Detail View',
    'lifestyle': 'Lifestyle',
    'product-details': 'Product Details',
    'left-front': 'Left Front',
    'right-front': 'Right Front',
    'mockup': 'Mockup',
    'inside': 'Inside',
    'outside': 'Outside',
    'top': 'Top View',
    'bottom': 'Bottom View'
  };
  
  return viewMap[view.toLowerCase()] || view.charAt(0).toUpperCase() + view.slice(1);
}

/**
 * Generate a standardized filename from product and variant data
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