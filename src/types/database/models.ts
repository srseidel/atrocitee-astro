/**
 * Database Model Types
 * 
 * Type definitions for database entities and their relationships
 */

// User profile types
export interface Profile {
  id: string; // UUID - matches auth.users id
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

// Core category constants
export const CORE_CATEGORIES = {
  POLITICAL: 'political',
  SOCIAL: 'social',
  ENVIRONMENTAL: 'environmental',
  HUMAN_RIGHTS: 'human-rights',
  ANIMAL_RIGHTS: 'animal-rights',
  EDUCATION: 'education',
  HEALTHCARE: 'healthcare',
  ECONOMIC: 'economic',
  OTHER: 'other'
} as const;

export type CoreCategory = typeof CORE_CATEGORIES[keyof typeof CORE_CATEGORIES];

// Category display names for UI
export const CATEGORY_DISPLAY_NAMES: Record<CoreCategory, string> = {
  [CORE_CATEGORIES.POLITICAL]: 'Political',
  [CORE_CATEGORIES.SOCIAL]: 'Social Justice',
  [CORE_CATEGORIES.ENVIRONMENTAL]: 'Environmental',
  [CORE_CATEGORIES.HUMAN_RIGHTS]: 'Human Rights',
  [CORE_CATEGORIES.ANIMAL_RIGHTS]: 'Animal Rights',
  [CORE_CATEGORIES.EDUCATION]: 'Education',
  [CORE_CATEGORIES.HEALTHCARE]: 'Healthcare',
  [CORE_CATEGORIES.ECONOMIC]: 'Economic Justice',
  [CORE_CATEGORIES.OTHER]: 'Other'
};

// Category types
export interface Category {
  id: string; // UUID
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null; // UUID reference to parent category
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Product types
export interface Product {
  id: string; // UUID
  name: string;
  slug: string;
  description: string | null;
  price: number;
  inventory_count: number;
  category_id: string | null; // UUID reference to category
  image_urls: string[];
  featured: boolean;
  active: boolean;
  
  // Versioning fields
  version: number;
  version_name: string | null;
  version_description: string | null;
  previous_version_id: string | null; // UUID reference to previous version
  
  // Atrocitee-specific fields
  donation_amount: number | null;
  tags: string[];
  
  // Printful-specific fields
  printful_product_id: number | null; // External Printful ID
  printful_sync_product_id: number | null;
  
  created_at: string;
  updated_at: string;
}

// Product variant types
export interface ProductVariant {
  id: string; // UUID
  product_id: string; // UUID reference to product
  name: string;
  sku: string;
  price: number;
  
  // Variant attributes - can have custom options based on product type
  options: Record<string, string>; // e.g., { "size": "M", "color": "Blue" }
  
  // Printful-specific fields
  printful_variant_id: number | null;
  printful_sync_variant_id: number | null;
  
  // Inventory
  inventory_count: number;
  active: boolean;
  
  created_at: string;
  updated_at: string;
}

// Printful sync history - to track synchronization events
export interface PrintfulSyncHistory {
  id: string; // UUID
  sync_type: 'manual' | 'scheduled' | 'webhook';
  status: 'success' | 'partial' | 'failed';
  message: string | null;
  started_at: string;
  completed_at: string | null;
  products_synced: number;
  products_failed: number;
  details: Record<string, any> | null; // JSON field for additional details
  created_at: string;
}

// Printful product change log - for tracking changes between sync operations
export interface PrintfulProductChange {
  id: string; // UUID
  product_id: string; // UUID reference to local product
  printful_product_id: number;
  change_type: 'price' | 'inventory' | 'metadata' | 'image' | 'variant' | 'other';
  change_severity: 'critical' | 'standard' | 'minor';
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  sync_history_id: string | null; // UUID reference to sync history
  status: 'pending_review' | 'approved' | 'rejected' | 'applied';
  reviewed_by: string | null; // UUID reference to profiles
  reviewed_at: string | null;
  created_at: string;
}

// Many-to-many relationship between products and categories
export interface ProductCategory {
  id: string; // UUID
  product_id: string; // UUID reference to product
  category_id: string; // UUID reference to category
  primary: boolean; // Whether this is the primary category for the product
  created_at: string;
}

// Product tags
export interface Tag {
  id: string; // UUID
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

// Many-to-many relationship between products and tags
export interface ProductTag {
  id: string; // UUID
  product_id: string; // UUID reference to product
  tag_id: string; // UUID reference to tag
  created_at: string;
} 