declare module 'printful' {
  export interface PrintfulProduct {
    id: number;
    name: string;
    thumbnail_url: string;
    // Add other properties as needed
  }

  export interface PrintfulVariant {
    id: number;
    name: string;
    sku: string;
    retail_price: string;
    options?: { id: string; value: string }[];
    // Add other properties as needed
  }
} 