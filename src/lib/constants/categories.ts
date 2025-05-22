/**
 * Core product categories for Atrocitee
 * These are the main categories that products can be assigned to
 */

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export const CORE_CATEGORIES: ProductCategory[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'T-Shirts',
    slug: 't-shirts',
    description: 'Politically-charged t-shirts and tops'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Hats',
    slug: 'hats',
    description: 'Caps and hats with political messages'
  }
];

/**
 * Helper function to get a category by ID
 */
export function getCategoryById(id: string): ProductCategory | undefined {
  return CORE_CATEGORIES.find(category => category.id === id);
}

/**
 * Helper function to get a category by slug
 */
export function getCategoryBySlug(slug: string): ProductCategory | undefined {
  return CORE_CATEGORIES.find(category => category.slug === slug);
} 