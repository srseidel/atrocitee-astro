/**
 * Printful API Types
 * 
 * Type definitions for Printful API responses and requests
 */

// Product types
export interface PrintfulProduct {
  id: number;
  external_id: string;
  name: string;
  description?: string;
  variants_count: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
}

export interface PrintfulProductList {
  result: {
    sync_product: PrintfulProduct;
    sync_variants: PrintfulVariant[];
  };
}

export interface PrintfulVariant {
  id: number;
  external_id: string;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number;
  main_category_id: number;
  warehouse_product_variant_id: number;
  retail_price: string;
  sku: string;
  currency: string;
  in_stock: boolean;
  product: {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
  };
  files: any[];
  options: Array<{
    id: string;
    value: string;
  }>;
  is_ignored: boolean;
}

export interface PrintfulResponse<T> {
  code: number;
  result: T;
  error?: {
    code: number;
    message: string;
    reason?: string;
  };
}

export interface PrintfulCatalogProduct {
  id: number;
  title: string;
  type: string;
  type_name: string;
  brand: string;
  model: string;
  image: string;
  description: string;
  main_category_id: number;
  variant_count: number;
  currency: string;
  files: any[];
  options: any[];
  dimensions: {
    front: {
      width: number;
      height: number;
    };
  };
}

export interface PrintfulCatalogVariant {
  id: number;
  title: string;
  type: string;
  type_name: string;
  brand: string;
  model: string;
  image: string;
  description: string;
  main_category_id: number;
  variant_count: number;
  currency: string;
  files: any[];
  options: any[];
  dimensions: {
    front: {
      width: number;
      height: number;
    };
  };
} 