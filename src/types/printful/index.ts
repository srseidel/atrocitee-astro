/**
 * Printful API Type Definitions
 */

// General API response structure
export interface PrintfulResponse<T> {
  code: number;
  result: T;
  error?: PrintfulError;
}

// Product types
export interface PrintfulProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
}

export interface PrintfulProductList {
  sync_product: PrintfulProduct;
  sync_variants: PrintfulVariant[];
}

export interface PrintfulVariant {
  id: number;
  external_id: string;
  product_id: number;
  name: string;
  sku: string;
  retail_price: string;
  currency: string;
  files: PrintfulFile[];
  options: PrintfulOption[];
  is_ignored: boolean;
}

export interface PrintfulFile {
  id: number;
  type: string;
  title: string;
  url: string;
  preview_url: string;
  visible: boolean;
}

export interface PrintfulOption {
  id: string;
  value: string;
}

// Webhook types
export interface PrintfulWebhookPayload {
  type: string;
  created: number;
  retries: number;
  store: number;
  resource: string;
  resource_id: number;
  data: PrintfulWebhookData;
}

export interface PrintfulWebhookData {
  sync_product?: PrintfulProduct;
  sync_variant?: PrintfulVariant;
  order?: PrintfulOrder;
  status?: string;
  [key: string]: unknown;
}

export interface PrintfulOrder {
  id: number;
  external_id: string;
  status: string;
  shipping: string;
  tracking_number?: string;
  tracking_url?: string;
  shipping_provider?: string;
  created: number;
  updated: number;
  recipient: PrintfulRecipient;
  items: PrintfulOrderItem[];
  costs: PrintfulOrderCosts;
}

export interface PrintfulRecipient {
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state_code: string;
  state_name: string;
  country_code: string;
  country_name: string;
  zip: string;
  phone?: string;
  email?: string;
}

export interface PrintfulOrderItem {
  id: number;
  external_id: string;
  variant_id: number;
  sync_variant_id: number;
  external_variant_id: string;
  warehouse_product_variant_id: number;
  quantity: number;
  sku: string;
  retail_price: string;
  name: string;
  product: PrintfulProduct;
  files: PrintfulFile[];
  options: PrintfulOption[];
}

export interface PrintfulOrderCosts {
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
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
  values: PrintfulProductOptionValue[];
}

export interface PrintfulProductOptionValue {
  id: string;
  title: string;
  colors?: string[];
  sizes?: string[];
  [key: string]: unknown;
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

// Category types
export interface PrintfulCategory {
  id: number;
  parent_id: number | null;
  title: string;
  type: string;
  size?: string;
  color?: string;
  color_code?: string;
  color_code2?: string | null;
  image?: string;
  price?: string;
  in_stock?: boolean;
  availability_status?: string;
}

// Product data types
export interface PrintfulProductData {
  sync_product: {
    name: string;
    external_id: string;
    thumbnail?: string;
  };
  sync_variants: Array<{
    external_id: string;
    name: string;
    retail_price: string;
    sku: string;
    files: Array<{
      url: string;
      type: string;
      position: string;
    }>;
    options: Array<{
      id: string;
      value: string;
    }>;
  }>;
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