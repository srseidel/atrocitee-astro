/**
 * Printful Order Service
 * 
 * Handles order submission and status synchronization with Printful
 */

import { PrintfulClient } from './api-client';
import { debug } from '@lib/utils/debug';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PrintfulOrderItem {
  sync_variant_id: number;
  quantity: number;
  retail_price: string;
  name?: string;
  files?: Array<{
    url: string;
    type: string;
    filename: string;
  }>;
}

export interface PrintfulShippingAddress {
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
  phone?: string;
  email?: string;
}

export interface PrintfulOrderData {
  external_id: string;
  shipping: string; // shipping method
  recipient: PrintfulShippingAddress;
  items: PrintfulOrderItem[];
  retail_costs?: {
    currency: string;
    subtotal: string;
    discount?: string;
    shipping?: string;
    tax?: string;
  };
  gift?: {
    subject: string;
    message: string;
  };
}

export interface PrintfulOrderResponse {
  id: number;
  external_id: string;
  status: string;
  shipping: string;
  created: number;
  updated: number;
  recipient: PrintfulShippingAddress;
  items: Array<{
    id: number;
    external_id: string;
    sync_variant_id: number;
    external_variant_id: string;
    quantity: number;
    price: string;
    retail_price: string;
    name: string;
    product: {
      variant_id: number;
      product_id: number;
      image: string;
      name: string;
    };
    files: Array<{
      id: number;
      type: string;
      hash: string;
      url: string;
      filename: string;
      mime_type: string;
      size: number;
      width: number;
      height: number;
      dpi: number;
      status: string;
      created: number;
      thumbnail_url: string;
      preview_url: string;
      visible: boolean;
    }>;
  }>;
  branding_items: any[];
  shipments: Array<{
    id: number;
    carrier: string;
    service: string;
    tracking_number: string;
    tracking_url: string;
    created: number;
    ship_date: string;
    shipped_at: number;
    reshipment: boolean;
    items: Array<{
      item_id: number;
      quantity: number;
    }>;
  }>;
  costs: {
    currency: string;
    subtotal: string;
    discount: string;
    shipping: string;
    digitization: string;
    additional_fee: string;
    fulfillment_fee: string;
    retail_delivery_fee: string;
    tax: string;
    vat: string;
    total: string;
  };
  retail_costs: {
    currency: string;
    subtotal: string;
    discount: string;
    shipping: string;
    tax: string;
    total: string;
  };
  pricing_breakdown: Array<{
    customer_pays: string;
    printful_price: string;
    profit: string;
    currency: string;
  }>;
}

export class PrintfulOrderService {
  private printfulClient: PrintfulClient;

  constructor(apiKey?: string, sandboxMode?: boolean) {
    this.printfulClient = new PrintfulClient(apiKey, sandboxMode);
  }

  /**
   * Submit an order to Printful for fulfillment
   */
  async submitOrder(orderData: PrintfulOrderData): Promise<PrintfulOrderResponse> {
    try {
      console.log('Submitting order to Printful:', orderData.external_id);
      
      const response = await this.printfulClient.submitOrder<{ result: PrintfulOrderResponse }>(orderData);
      
      if (!response.result) {
        throw new Error('Invalid response from Printful API');
      }
      
      console.log('Order submitted successfully:', response.result.id);
      return response.result;
      
    } catch (error) {
      console.error('Error submitting order to Printful:', error);
      throw error;
    }
  }

  /**
   * Get order status from Printful
   */
  async getOrderStatus(printfulOrderId: number): Promise<PrintfulOrderResponse> {
    try {
      const response = await this.printfulClient.getOrder<{ result: PrintfulOrderResponse }>(printfulOrderId);
      
      if (!response.result) {
        throw new Error('Invalid response from Printful API');
      }
      
      return response.result;
      
    } catch (error) {
      console.error('Error getting order status from Printful:', error);
      throw error;
    }
  }

  /**
   * Update local order status based on Printful order data
   */
  async updateLocalOrderStatus(
    supabase: SupabaseClient,
    orderId: string,
    printfulOrder: PrintfulOrderResponse
  ): Promise<void> {
    try {
      // Map Printful status to our local status
      const localStatus = this.mapPrintfulStatusToLocal(printfulOrder.status);
      
      // Prepare update data
      const updateData: any = {
        status: localStatus,
        updated_at: new Date().toISOString()
      };
      
      // Add tracking information if available
      if (printfulOrder.shipments && printfulOrder.shipments.length > 0) {
        const latestShipment = printfulOrder.shipments[printfulOrder.shipments.length - 1];
        updateData.tracking_number = latestShipment.tracking_number;
        updateData.tracking_url = latestShipment.tracking_url;
        updateData.shipped_at = new Date(latestShipment.shipped_at * 1000).toISOString();
      }
      
      // Update the local order
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
      
      if (error) {
        throw error;
      }
      
      console.log(`Order ${orderId} status updated to ${localStatus}`);
      
    } catch (error) {
      console.error('Error updating local order status:', error);
      throw error;
    }
  }

  /**
   * Create a test order in Printful sandbox
   */
  async createTestOrder(
    externalId: string,
    recipientEmail: string,
    recipientName: string
  ): Promise<PrintfulOrderResponse> {
    // Sample test order data using common Printful test products
    const testOrderData: PrintfulOrderData = {
      external_id: externalId,
      shipping: 'STANDARD', // Standard shipping
      recipient: {
        name: recipientName,
        address1: '123 Test Street',
        address2: 'Apt 4B',
        city: 'Los Angeles',
        state_code: 'CA',
        country_code: 'US',
        zip: '90210',
        phone: '+1-555-123-4567',
        email: recipientEmail
      },
      items: [
        {
          sync_variant_id: 1, // Printful's test sync variant ID
          quantity: 1,
          retail_price: '25.00',
          name: 'Test Product - Unisex T-Shirt'
        }
      ],
      retail_costs: {
        currency: 'USD',
        subtotal: '25.00',
        shipping: '8.99',
        tax: '2.83',
      }
    };

    return await this.submitOrder(testOrderData);
  }

  /**
   * Map Printful order status to local order status
   */
  private mapPrintfulStatusToLocal(printfulStatus: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'pending',
      'pending': 'pending', 
      'failed': 'cancelled',
      'canceled': 'cancelled',
      'onhold': 'pending',
      'inprocess': 'processing',
      'fulfilled': 'shipped',
      'shipped': 'shipped',
      'delivered': 'delivered'
    };

    return statusMap[printfulStatus] || 'pending';
  }

  /**
   * Convert local order to Printful order format
   */
  async convertLocalOrderToPrintful(
    supabase: SupabaseClient,
    localOrderId: string
  ): Promise<PrintfulOrderData> {
    // Fetch the local order with items and product variant data
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          variant_id,
          product_name,
          variant_name,
          quantity,
          unit_price,
          variant_options
        )
      `)
      .eq('id', localOrderId)
      .single();

    if (error || !order) {
      throw new Error(`Order ${localOrderId} not found: ${error?.message}`);
    }

    if (!order.order_items || order.order_items.length === 0) {
      throw new Error(`No items found for order ${localOrderId}`);
    }

    // Get Printful sync variant IDs for the products
    const variantIds = order.order_items.map((item: any) => item.variant_id);
    
    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select('id, printful_id, printful_product_id')
      .in('id', variantIds);

    if (variantError) {
      console.warn('Could not fetch variant data:', variantError);
    }

    // Create variant lookup map
    const variantMap = new Map();
    variants?.forEach(variant => {
      variantMap.set(variant.id, {
        printful_id: variant.printful_id,
        printful_product_id: variant.printful_product_id
      });
    });

    // Convert country code to Printful format
    const convertCountryCode = (country: string): string => {
      const countryMap: Record<string, string> = {
        'US': 'US',
        'USA': 'US',
        'United States': 'US',
        'CA': 'CA',
        'Canada': 'CA',
        'GB': 'GB',
        'UK': 'GB',
        'United Kingdom': 'GB'
      };
      return countryMap[country] || country;
    };

    // Generate Printful-compatible external ID (max 32 chars, alphanumeric)
    const generatePrintfulExternalId = (orderId: string): string => {
      // Remove hyphens and take first 32 characters
      const cleanId = orderId.replace(/-/g, '').substring(0, 32);
      // Add timestamp suffix to ensure uniqueness
      const timestamp = Date.now().toString(36).substring(-8);
      return `${cleanId.substring(0, 24)}${timestamp}`;
    };

    const printfulExternalId = generatePrintfulExternalId(order.id);
    console.log('Generated Printful external ID:', {
      original: order.id,
      printful: printfulExternalId,
      length: printfulExternalId.length
    });

    // Convert to Printful format
    const printfulOrder: PrintfulOrderData = {
      external_id: printfulExternalId,
      shipping: 'STANDARD', // Standard shipping
      recipient: {
        name: order.customer_name,
        address1: order.shipping_address.line1,
        address2: order.shipping_address.line2 || undefined,
        city: order.shipping_address.city,
        state_code: order.shipping_address.state,
        country_code: convertCountryCode(order.shipping_address.country),
        zip: order.shipping_address.postal_code,
        email: order.customer_email
      },
      items: order.order_items.map((item: any) => {
        const variantData = variantMap.get(item.variant_id);
        
        return {
          sync_variant_id: variantData?.printful_id || 1, // Fallback to test variant ID
          quantity: item.quantity,
          retail_price: item.unit_price.toString(),
          name: `${item.product_name} - ${item.variant_name}`
        };
      }),
      retail_costs: {
        currency: 'USD',
        subtotal: order.subtotal.toString(),
        shipping: order.shipping_cost.toString(),
        tax: order.tax.toString()
      }
    };

    console.log('Converted order to Printful format:', {
      external_id: printfulOrder.external_id,
      items: printfulOrder.items.length,
      total_cost: order.total_amount,
      recipient: {
        country_code: printfulOrder.recipient.country_code,
        state_code: printfulOrder.recipient.state_code,
        address1: printfulOrder.recipient.address1,
        city: printfulOrder.recipient.city
      }
    });

    return printfulOrder;
  }
}

// Export singleton instance for common usage
export const printfulOrderService = new PrintfulOrderService();