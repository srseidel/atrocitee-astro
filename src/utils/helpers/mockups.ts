import type { ProductMockup, MockupSet, ProductColor, ProductView } from '@local-types/common/mockups';
import type { Database } from '@local-types/database/schema';

type ProductVariant = Database['public']['Tables']['product_variants']['Row'];

// Import all mockup images
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

// Import mockup images dynamically
const mockupImages = import.meta.glob<{ default: ImageMetadata }>('/src/assets/mockups/*.{jpg,png,webp}', {
  import: 'default',
  eager: true
});

/**
 * Parse a mockup filename to extract its components
 * @param filename The full filename of the mockup image
 * @returns Object containing the parsed components
 */
export function parseMockupFilename(filename: string): Partial<ProductMockup> {
  // Remove path and extension
  const basename = filename.split('/').pop()?.replace(/\.(jpg|png|webp)$/, '') || '';
  
  // Split the filename into components
  const parts = basename.split('-');
  const id = parts.pop() || '';
  
  // Extract view by working backwards - the last two parts before id are the view
  let viewParts = [];
  let colorIndex = -1;
  
  // Find known view parts from the end (before the ID)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].toLowerCase();
    if (['front', 'back', 'left', 'right', 'front-2', 'back-2'].includes(part) || 
        part === 'front' && parts[i-1]?.toLowerCase() === 'left' ||
        part === 'front' && parts[i-1]?.toLowerCase() === 'right') {
      viewParts.unshift(part);
      if (part === 'front' && (parts[i-1]?.toLowerCase() === 'left' || parts[i-1]?.toLowerCase() === 'right')) {
        viewParts.unshift(parts[i-1].toLowerCase());
        i--; // Skip the next part as we've already processed it
      }
      colorIndex = i - 1;
      break;
    }
  }
  
  // Join view parts with hyphens
  const view = viewParts.join('-') as ProductView;
  
  // The color should be the part before the view
  const color = colorIndex >= 0 ? parts[colorIndex] as ProductColor : 'unknown';
  
  // The product type is everything up to the color
  const productType = parts.slice(0, colorIndex).join('-');

  return {
    productType,
    color,
    view,
    id,
    path: filename
  };
}

/**
 * Get all mockup images for a specific variant
 * @param variant The product variant
 * @returns A set of mockup images for the variant
 */
export async function getMockupSet(variant: ProductVariant): Promise<MockupSet | null> {
  try {
    // Parse variant name to get color
    const [_productName, color] = (variant.name || '').split('/').map((part: string) => part.trim());
    
    if (!color) {
      console.error('No color found in variant name:', variant.name);
      return null;
    }

    const mockupSet: Partial<MockupSet> = {};
    
    // Log available mockup images for debugging
    console.log('Available mockup images:', Object.keys(mockupImages));
    
    // Convert all image paths to optimized versions
    for (const [path, importedImage] of Object.entries(mockupImages)) {
      const parsed = parseMockupFilename(path);
      
      // Log parsed filename components
      console.log('Parsed mockup file:', {
        path,
        parsed,
        variantColor: color.toLowerCase(),
        matches: parsed.color?.toLowerCase() === color.toLowerCase()
      });
      
      if (parsed.color?.toLowerCase() !== color.toLowerCase()) continue;

      // Convert the imported image to an optimized version
      const optimizedImage = await getImage({
        src: importedImage.default,
        width: 800,
        format: 'webp'
      });

      const mockup: ProductMockup = {
        ...parsed as ProductMockup,
        path: optimizedImage.src
      };

      // Map the view to the correct property in MockupSet
      switch (parsed.view) {
        case 'front':
          mockupSet.front = mockup;
          break;
        case 'back':
          mockupSet.back = mockup;
          break;
        case 'left':
          mockupSet.left = mockup;
          break;
        case 'right':
          mockupSet.right = mockup;
          break;
        case 'left-front':
          mockupSet.leftFront = mockup;
          break;
        case 'right-front':
          mockupSet.rightFront = mockup;
          break;
        case 'front-and-back':
          mockupSet.frontAndBack = mockup;
          break;
        case 'front-2':
          mockupSet.front2 = mockup;
          break;
        case 'back-2':
          mockupSet.back2 = mockup;
          break;
      }
    }

    // Log final mockup set
    console.log('Generated mockup set:', mockupSet);

    // Only return if we have at least a front image
    return mockupSet.front ? mockupSet as MockupSet : null;
  } catch (error) {
    console.error('Error getting mockup set:', error);
    return null;
  }
}

/**
 * Get the primary mockup image for a variant
 * @param variant The product variant
 * @returns The front view mockup image or null
 */
export async function getPrimaryMockup(variant: ProductVariant): Promise<ProductMockup | null> {
  const mockupSet = await getMockupSet(variant);
  return mockupSet?.front || null;
}

/**
 * Get a human-readable label for a view type
 * @param viewId The view identifier
 * @returns A formatted label for the view
 */
export function getViewLabel(viewId: string): string {
  const viewLabels: Record<string, string> = {
    'front': 'Front',
    'back': 'Back',
    'left': 'Left',
    'right': 'Right',
    'left_front': 'Left Front',
    'right_front': 'Right Front',
    'front-2': 'Front Detail',
    'back-2': 'Back Detail',
    'front-and-back': 'Front & Back',
    'flat': 'Flat',
    'lifestyle': 'Lifestyle'
  };
  
  return viewLabels[viewId] || viewId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
} 