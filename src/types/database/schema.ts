/**
 * Database Schema Types
 * 
 * Type definitions for Supabase database tables and their relationships
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          printful_id: number | null
          printful_external_id: string | null
          printful_synced: boolean
          name: string
          description: string | null
          slug: string
          thumbnail_url: string | null
          published_status: boolean
          atrocitee_base_price: number | null
          atrocitee_donation_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          printful_id?: number | null
          printful_external_id?: string | null
          printful_synced?: boolean
          name: string
          description?: string | null
          slug: string
          thumbnail_url?: string | null
          published_status?: boolean
          atrocitee_base_price?: number | null
          atrocitee_donation_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          printful_id?: number | null
          printful_external_id?: string | null
          printful_synced?: boolean
          name?: string
          description?: string | null
          slug?: string
          thumbnail_url?: string | null
          published_status?: boolean
          atrocitee_base_price?: number | null
          atrocitee_donation_amount?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          printful_id: number | null
          printful_external_id: string | null
          printful_product_id: number | null
          printful_synced: boolean
          name: string
          sku: string | null
          retail_price: number | null
          currency: string
          options: Json
          files: Json
          in_stock: boolean
          stock_level: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          printful_id?: number | null
          printful_external_id?: string | null
          printful_product_id?: number | null
          printful_synced?: boolean
          name: string
          sku?: string | null
          retail_price?: number | null
          currency?: string
          options?: Json
          files?: Json
          in_stock?: boolean
          stock_level?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          printful_id?: number | null
          printful_external_id?: string | null
          printful_product_id?: number | null
          printful_synced?: boolean
          name?: string
          sku?: string | null
          retail_price?: number | null
          currency?: string
          options?: Json
          files?: Json
          in_stock?: boolean
          stock_level?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          parent_id: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          parent_id?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          parent_id?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      printful_sync_history: {
        Row: {
          id: string
          sync_type: string
          status: string
          message: string | null
          products_synced: number
          products_failed: number
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          sync_type: string
          status: string
          message?: string | null
          products_synced?: number
          products_failed?: number
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          sync_type?: string
          status?: string
          message?: string | null
          products_synced?: number
          products_failed?: number
          started_at?: string
          completed_at?: string | null
        }
      }
      printful_product_changes: {
        Row: {
          id: string
          product_id: string
          change_type: string
          change_severity: string
          field_name: string
          old_value: Json | null
          new_value: Json | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          change_type: string
          change_severity: string
          field_name: string
          old_value?: Json | null
          new_value?: Json | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          change_type?: string
          change_severity?: string
          field_name?: string
          old_value?: Json | null
          new_value?: Json | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
      printful_category_mapping: {
        Row: {
          id: string
          printful_category_id: number
          printful_category_name: string
          atrocitee_category_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          printful_category_id: number
          printful_category_name: string
          atrocitee_category_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          printful_category_id?: number
          printful_category_name?: string
          atrocitee_category_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      charities: {
        Row: {
          id: string
          name: string
          description: string | null
          website_url: string | null
          logo_url: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 