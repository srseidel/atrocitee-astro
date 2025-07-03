/**
 * Product helper functions, types, and constants
 */

// ===== Types =====

export interface MockupView {
  view: string;
  label: string;
  filename: string;
  url: string;
  webpUrl: string;
}

export interface ProductVariantOptions {
  color?: string;
  size?: string;
  [key: string]: string | undefined;
}

export interface MockupSetting {
  filename: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface MockupSettings {
  views?: Array<{
    view: string;
    filename: string;
    url: string;
    webpUrl: string;
  }>;
  mockups?: Record<string, MockupSetting>;
  [key: string]: unknown;
}

export interface ProductVariant {
  id: string;
  name?: string;
  sku?: string;
  retail_price: number | null;
  options: ProductVariantOptions;
  in_stock: boolean;
  stock_level?: number | null;
  mockup_settings?: MockupSettings;
  mockupViews: MockupView[];
  [key: string]: unknown;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  details?: string;
  published_status: boolean;
  variants: ProductVariant[];
  thumbnail_url?: string;
  [key: string]: unknown;
}

// Simplified variant type for client-side use
export interface ClientVariant {
  id: string;
  options: ProductVariantOptions;
  mockupViews: MockupView[];
  in_stock: boolean;
  retail_price: number | null;
  [key: string]: unknown; // Add index signature to match ProductVariant
}

// Type that works for both server and client variants
export type AnyVariant = ProductVariant | ClientVariant;

// ===== Color Classes =====

export const colorClasses: Record<string, string> = {
  Black: 'bg-black',
  White: 'bg-white border border-gray-300',
  Gray: 'bg-gray-500',
  Red: 'bg-red-600',
  Blue: 'bg-blue-600',
  Navy: 'bg-blue-900',
  Green: 'bg-green-600',
  Yellow: 'bg-yellow-500',
  Orange: 'bg-orange-500',
  Purple: 'bg-purple-600',
  Pink: 'bg-pink-500',
  Brown: 'bg-amber-800',
  'Heather Gray': 'bg-gray-400',
  Charcoal: 'bg-gray-700',
  'Athletic Heather': 'bg-gray-300',
  'Royal Blue': 'bg-blue-700',
  'Forest Green': 'bg-green-800',
  Maroon: 'bg-red-900',
  Gold: 'bg-yellow-600',
  Teal: 'bg-teal-500',
  Burgundy: 'bg-red-800',
  Olive: 'bg-olive-700',
  Mint: 'bg-mint-400',
  Coral: 'bg-coral-500',
  Cream: 'bg-cream-200',
  Tan: 'bg-tan-400',
  'Light Blue': 'bg-blue-300',
  'Light Pink': 'bg-pink-300',
  'Light Green': 'bg-green-300',
  'Dark Green': 'bg-green-900',
  'Dark Blue': 'bg-blue-950',
  'Dark Gray': 'bg-gray-800',
};

// ===== Variant Helper Functions =====

/**
 * Find a variant by color and size
 * @param color The color to match
 * @param size The size to match
 * @param variants Array of variants to search
 * @returns The matching variant or undefined
 */
export function findVariant<T extends AnyVariant>(
  color: string,
  size: string,
  variants: T[]
): T | undefined {
  if (!variants || variants.length === 0) return undefined;
  
  // Normalize inputs
  const colorLower = color ? color.toLowerCase().trim() : '';
  const sizeLower = size ? size.toLowerCase().trim() : '';
  
  // First try exact match (case insensitive)
  if (colorLower && sizeLower) {
    const exactMatch = variants.find(v => {
      const variantColorLower = (v.options.color || '').toLowerCase().trim();
      const variantSizeLower = (v.options.size || '').toLowerCase().trim();
      return variantColorLower === colorLower && variantSizeLower === sizeLower;
    });
    
    if (exactMatch) return exactMatch;
  }
  
  // Then try to match just by color (case insensitive)
  if (colorLower) {
    // Get all variants with this color
    const colorVariants = variants.filter(v => 
      v.options.color && 
      v.options.color.toLowerCase().trim() === colorLower
    );
    
    if (colorVariants.length > 0) {
      // Sort by having mockup views first
      colorVariants.sort((a, b) => {
        const aHasViews = a.mockupViews && a.mockupViews.length > 0;
        const bHasViews = b.mockupViews && b.mockupViews.length > 0;
        if (aHasViews && !bHasViews) return -1;
        if (!aHasViews && bHasViews) return 1;
        return 0;
      });
      
      return colorVariants[0];
    }
    
    // Special handling for Navy color
    if (colorLower === 'navy') {
      // Try to find any blue-ish variant
      const blueVariant = variants.find(
        v => v.options.color && 
             ['blue', 'dark blue', 'navy blue'].includes(v.options.color.toLowerCase().trim())
      );
      
      if (blueVariant) return blueVariant;
    }
  }
  
  // If still no match, try to find by size only
  if (sizeLower) {
    const sizeVariant = variants.find(
      v => v.options.size && v.options.size.toLowerCase().trim() === sizeLower
    );
    
    if (sizeVariant) return sizeVariant;
  }
  
  // If still no variant found, just return the first one with mockup views
  return findVariantWithImages(variants);
}

/**
 * Find a variant that has mockup images
 * @param variants Array of variants to search
 * @returns The first variant with images, or the first variant if none have images
 */
export function findVariantWithImages<T extends AnyVariant>(variants: T[]): T | undefined {
  if (!variants || variants.length === 0) return undefined;
  
  // First try to find a variant with both color/size and images
  const variantWithImagesAndOptions = variants.find(
    v => v.mockupViews && 
         v.mockupViews.length > 0 && 
         v.options.color && 
         v.options.size
  );
  
  if (variantWithImagesAndOptions) {
    return variantWithImagesAndOptions;
  }
  
  // Then try to find any variant with images
  const variantWithImages = variants.find(
    v => v.mockupViews && v.mockupViews.length > 0
  );
  
  if (variantWithImages) {
    return variantWithImages;
  }
  
  // Fall back to first variant
  return variants[0];
}

/**
 * Generate mockup URLs for a product
 * @param slug Product slug
 * @param filename Mockup filename
 * @returns Object with url and webpUrl properties
 */
export function generateMockupUrls(slug: string, filename: string) {
  if (!filename) return { url: '', webpUrl: '' };
  
  const baseUrl = `/images/mockups/${slug}/${filename}`;
  const webpUrl = baseUrl.replace(/\.(png|jpe?g)$/i, '.webp');
  
  return { url: baseUrl, webpUrl };
}

// ===== Client-side Product Page Logic =====

export interface ProductPageConfig {
  variants: ClientVariant[];
  productName: string;
  productSlug: string;
  isDevelopment?: boolean;
}

/**
 * Initialize the product page with interactive functionality
 */
export function initProductPage(config: ProductPageConfig) {
  const { variants, productName, productSlug, isDevelopment = false } = config;
  
  // Enable debug panel in development
  if (isDevelopment) {
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) debugInfo.style.display = 'block';
  }
  
  // Helper function to update the UI for a selected variant
  function updateUI(variant: ClientVariant | undefined) {
    if (!variant) return;
    
    // Update selected color and size display
    const colorEl = document.getElementById('selected-color');
    const sizeEl = document.getElementById('selected-size');
    if (colorEl) colorEl.textContent = variant.options.color || 'Not set';
    if (sizeEl) sizeEl.textContent = variant.options.size || 'Not set';
    
    // Update form input
    const variantInput = document.getElementById('variant-id-input') as HTMLInputElement;
    if (variantInput) variantInput.value = variant.id;
    
    // Update price
    if (variant.retail_price) {
      const formattedPrice = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(variant.retail_price);
      
      const priceEl = document.getElementById('product-price');
      if (priceEl) priceEl.textContent = formattedPrice;
    }
    
    // Update add to cart button
    const addToCartButton = document.getElementById('add-to-cart-button') as HTMLButtonElement;
    if (addToCartButton) {
      addToCartButton.disabled = !variant.in_stock;
      addToCartButton.textContent = variant.in_stock ? 'Add to Cart' : 'Out of Stock';
    }
    
    // Update color selectors
    document.querySelectorAll('.color-selector').forEach(el => {
      const isSelected = (el as HTMLElement).dataset.color === variant.options.color;
      el.setAttribute('aria-selected', isSelected.toString());
      if (isSelected) {
        el.classList.add('ring-2', 'ring-offset-2', 'ring-primary');
      } else {
        el.classList.remove('ring-2', 'ring-offset-2', 'ring-primary');
      }
    });
    
    // Update size selectors
    document.querySelectorAll('.size-selector').forEach(el => {
      const isSelected = (el as HTMLElement).dataset.size === variant.options.size;
      el.setAttribute('aria-selected', isSelected.toString());
      if (isSelected) {
        el.classList.add('border-primary', 'bg-primary', 'text-white');
        el.classList.remove('border-gray-300');
      } else {
        el.classList.remove('border-primary', 'bg-primary', 'text-white');
        el.classList.add('border-gray-300');
      }
    });
    
    // Update images
    updateImages(variant);
    
    // Update URL without reloading the page
    const url = new URL(window.location.href);
    url.searchParams.set('color', variant.options.color || '');
    url.searchParams.set('size', variant.options.size || '');
    window.history.replaceState({}, '', url.toString());
  }
  
  // Helper function to update images for a variant
  function updateImages(variant: ClientVariant) {
    const variantViews = variant.mockupViews || [];
    if (variantViews.length === 0) return;
    
    // Update main image
    const mainImage = variantViews[0];
    const mainImg = document.getElementById('main-product-image') as HTMLImageElement;
    const mainWebp = document.querySelector('source[type="image/webp"]');
    
    if (mainImg && mainImage) {
      mainImg.src = mainImage.url;
      mainImg.alt = `${productName} - ${variant.options.color} - ${mainImage.label}`;
    }
    
    if (mainWebp && mainImage) {
      (mainWebp as HTMLSourceElement).srcset = mainImage.webpUrl;
    }
    
    // Update thumbnails
    const thumbnailContainer = document.getElementById('thumbnail-container');
    if (thumbnailContainer && variantViews.length > 1) {
      thumbnailContainer.innerHTML = '';
      
      variantViews.forEach(view => {
        const thumbnailLink = document.createElement('a');
        thumbnailLink.href = `#view-${view.view}`;
        thumbnailLink.className = 'block cursor-pointer thumbnail-link';
        thumbnailLink.dataset.src = view.url;
        thumbnailLink.dataset.webp = view.webpUrl;
        thumbnailLink.dataset.view = view.view;
        
        thumbnailLink.innerHTML = `
          <picture>
            <source srcset="${view.webpUrl}" type="image/webp" />
            <img 
              src="${view.url}" 
              alt="${productName} - ${variant.options.color} - ${view.label}" 
              class="w-full h-auto object-cover rounded border hover:border-primary" 
              width="150" 
              height="150" 
            />
          </picture>
        `;
        
        thumbnailLink.addEventListener('click', (e) => {
          e.preventDefault();
          if (mainImg) {
            mainImg.src = view.url;
            mainImg.alt = `${productName} - ${variant.options.color} - ${view.label}`;
          }
          if (mainWebp) (mainWebp as HTMLSourceElement).srcset = view.webpUrl;
          
          // Update active state on thumbnails
          document.querySelectorAll('.thumbnail-link').forEach(link => {
            link.classList.remove('border-primary');
            const img = link.querySelector('img');
            if (img) img.classList.remove('border-primary');
          });
          thumbnailLink.classList.add('border-primary');
          const img = thumbnailLink.querySelector('img');
          if (img) img.classList.add('border-primary');
        });
        
        thumbnailContainer.appendChild(thumbnailLink);
      });
    }
  }
  
  // Function to update available sizes based on selected color
  function updateAvailableSizes(color: string) {
    // Find all sizes available for this color
    const sizesForColor = variants
      .filter(v => 
        v.options.color === color || 
        (v.options.color || '').toLowerCase() === color.toLowerCase()
      )
      .map(v => v.options.size)
      .filter(Boolean) as string[];
    
    // Update size buttons
    document.querySelectorAll('[data-size]').forEach(sizeButton => {
      const size = (sizeButton as HTMLElement).dataset.size;
      const isAvailable = sizesForColor.includes(size || '');
      
      if (isAvailable) {
        // Size is available for this color
        sizeButton.classList.remove('bg-gray-100', 'text-gray-400', 'cursor-not-allowed');
        if (sizeButton.classList.contains('size-selector')) {
          sizeButton.classList.add('hover:border-primary');
        }
        (sizeButton as HTMLButtonElement).disabled = false;
      } else {
        // Size is not available for this color
        sizeButton.classList.add('bg-gray-100', 'text-gray-400', 'cursor-not-allowed');
        sizeButton.classList.remove('hover:border-primary', 'border-primary', 'bg-primary', 'text-white');
        (sizeButton as HTMLButtonElement).disabled = true;
      }
    });
  }
  
  // Get current URL parameters
  const params = new URLSearchParams(window.location.search);
  const colorParam = params.get('color');
  const sizeParam = params.get('size');
  
  // Add click handlers for color selectors
  document.querySelectorAll('.color-selector').forEach(colorButton => {
    colorButton.addEventListener('click', (e) => {
      e.preventDefault();
      const color = (colorButton as HTMLElement).dataset.color || '';
      
      // Find the current size
      const currentSize = document.getElementById('selected-size')?.textContent || '';
      
      // Find variant using helper function
      let variant = findVariant(color, currentSize, variants);
      
      // If no variant found, use default
      if (!variant) {
        variant = findVariantWithImages(variants);
      }
      
      // Update the UI
      updateUI(variant);
      
      // Update available sizes for this color
      updateAvailableSizes(color);
    });
  });
  
  // Add click handlers for size selectors
  document.querySelectorAll('.size-selector').forEach(sizeButton => {
    sizeButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Skip if button is disabled (size not available for current color)
      if ((sizeButton as HTMLButtonElement).disabled) {
        return;
      }
      
      const size = (sizeButton as HTMLElement).dataset.size || '';
      
      // Find the current color
      const currentColor = document.getElementById('selected-color')?.textContent || '';
      
      // Find variant using helper function
      let variant = findVariant(currentColor, size, variants);
      
      // If no variant found, find one with just this size
      if (!variant) {
        variant = findVariant('', size, variants);
        
        // Also update color selectors since we're changing color
        if (variant) {
          setTimeout(() => {
            if (document.getElementById('selected-color')) {
              document.getElementById('selected-color')!.textContent = variant!.options.color || '';
            }
          }, 10);
        }
      }
      
      // If still no variant, use default
      if (!variant) {
        variant = findVariantWithImages(variants);
      }
      
      // Update the UI
      updateUI(variant);
    });
  });

  // Add click handlers for thumbnails
  document.querySelectorAll('.thumbnail-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const mainImg = document.getElementById('main-product-image') as HTMLImageElement;
      const mainWebp = document.querySelector('source[type="image/webp"]');
      if (mainImg) {
        mainImg.src = (link as HTMLElement).dataset.src || '';
        mainImg.alt = `${productName} - ${(link as HTMLElement).dataset.view || ''}`;
      }
      if (mainWebp) (mainWebp as HTMLSourceElement).srcset = (link as HTMLElement).dataset.webp || '';
      
      // Update active state
      document.querySelectorAll('.thumbnail-link').forEach(l => {
        l.classList.remove('border-primary');
        const img = l.querySelector('img');
        if (img) img.classList.remove('border-primary');
      });
      link.classList.add('border-primary');
      const img = link.querySelector('img');
      if (img) img.classList.add('border-primary');
    });
  });
  
  // Initialize the page with the best variant
  function initializePage() {
    // If URL has parameters, find the matching variant
    if (colorParam || sizeParam) {
      let urlVariant = findVariant(colorParam || '', sizeParam || '', variants);
      
      if (urlVariant) {
        // Force update UI for the variant
        setTimeout(() => {
          updateUI(urlVariant);
        }, 100);
        return;
      }
    }
    
    // Otherwise, find the best variant to show
    const bestVariant = findVariantWithImages(variants);
    if (bestVariant) {
      updateUI(bestVariant);
      
      // Update available sizes for the selected color
      if (bestVariant.options.color) {
        updateAvailableSizes(bestVariant.options.color);
      }
    }
  }
  
  // Call initialization
  initializePage();
  
  // Debug functionality
  if (isDevelopment) {
    setupDebugTools();
  }
  
  function setupDebugTools() {
    const debugButton = document.getElementById('toggle-debug');
    const debugDetails = document.getElementById('debug-details');
    const debugInfo = document.getElementById('debug-info');
    
    if (debugButton && debugDetails) {
      debugButton.addEventListener('click', () => {
        debugDetails.classList.toggle('hidden');
      });
      
      // Add keyboard shortcut for debug mode (Ctrl+Shift+D)
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          if (debugInfo) {
            debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
          }
        }
      });
    }
  }
} 