/**
 * Types for product mockup settings
 */

// Details for a single mockup image
export interface MockupDetails {
  filename: string;
  color?: string;
  size?: string;
  updated_at?: string;
}

// Structure for mockup settings stored in product_variants.mockup_settings
export interface MockupSettings {
  mockups?: Record<string, MockupDetails>;
  // Additional settings can be added here in the future
}

// Mockup view types
export type MockupViewType = 'front' | 'back' | 'left' | 'right' | 'left_front' | 'right_front' | 'flat' | 'lifestyle';

// Mockup object for API responses
export interface MockupResponse {
  view: string;
  filename: string;
  url: string;
  color?: string;
  size?: string;
  updated_at?: string;
} 