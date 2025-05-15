/**
 * Printful API Type Definitions
 */

// General API response structure
export interface PrintfulResponse<T> {
  code: number;
  result: T;
  error?: {
    message: string;
    code: number;
    reason?: string;
  };
}

// Product types
export interface PrintfulProduct {
  id: number;
  external_id: string | null;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string | null;
  is_ignored: boolean;
}

export interface PrintfulProductList {
  sync_product: PrintfulProduct;
  sync_variants: PrintfulVariant[];
}

export interface PrintfulVariant {
  id: number;
  external_id: string | null;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number;
  main_category_id: number;
  warehouse_product_variant_id: number;
  retail_price: string;
  sku: string;
  currency: string;
  product: {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
  };
  files: PrintfulFile[];
  options: PrintfulOption[];
  is_ignored: boolean;
}

export interface PrintfulFile {
  id: number;
  type: string;
  hash: string;
  url: string;
  filename: string;
  mime_type: string;
  size: number;
  width: number;
  height: number;
  dpi: number | null;
  status: string;
  created: number;
  thumbnail_url: string;
  preview_url: string;
  visible: boolean;
  is_temporary: boolean;
}

export interface PrintfulOption {
  id: string;
  value: string | number | boolean;
}

// Webhook types
export interface PrintfulWebhookPayload {
  type: string;
  created: number;
  retries: number;
  store: number;
  resource: string;
  resource_id: number;
  data: any;
}

// Error types
export interface PrintfulError {
  code: number;
  message: string;
  reason?: string;
}

// Catalog types
export interface PrintfulCatalogProduct {
  id: number;
  main_category_id: number;
  type: string;
  description: string;
  type_name: string;
  title: string;
  brand: string;
  model: string;
  image: string;
  variant_count: number;
  currency: string;
  files: PrintfulProductFile[];
  options: PrintfulProductOption[];
  dimensions: {
    front: { width: number; height: number };
    back?: { width: number; height: number };
    [key: string]: { width: number; height: number } | undefined;
  };
}

export interface PrintfulProductFile {
  id: string;
  type: string;
  title: string;
  additional_price: string;
}

export interface PrintfulProductOption {
  id: string;
  title: string;
  type: string;
  values: {
    id: string;
    title: string;
    [key: string]: any;
  }[];
}

// Product variant types
export interface PrintfulCatalogVariant {
  id: number;
  product_id: number;
  name: string;
  size: string;
  color: string;
  color_code: string;
  color_code2: string | null;
  image: string;
  price: string;
  in_stock: boolean;
  availability_status: string;
}

// Shipping types
export interface PrintfulShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  min_delivery_days: number;
  max_delivery_days: number;
}

// Tax types
export interface PrintfulTaxRate {
  required: boolean;
  rate: number;
  shipping_taxable: boolean;
}

// Export a namespace for additional constants
export namespace PrintfulConstants {
  export enum WebhookType {
    STOCK_UPDATED = 'stock_updated',
    PRODUCT_UPDATED = 'product_updated',
    ORDER_CREATED = 'order_created',
    ORDER_STATUS_CHANGED = 'order_status_changed',
    PACKAGE_SHIPPED = 'package_shipped',
    PRODUCT_SYNCED = 'product_synced'
  }
} 