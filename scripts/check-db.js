// Simple script to test Supabase connection
// Run with: node check-db.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Not found');
console.log('Supabase Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 5)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 5)}` : 'Not found');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test tables
const tables = [
  'categories',
  'tags',
  'products',
  'printful_category_mapping'
];

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Check if the client is properly initialized
    if (!supabase) {
      console.error('Supabase client is not initialized!');
      return;
    }
    
    // Test each table
    for (const table of tables) {
      console.log(`\nTesting table: ${table}`);
      try {
        const { data, error, status } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true });
        
        if (error) {
          console.error(`Error accessing table ${table}:`, error);
        } else {
          console.log(`✅ Successfully accessed table ${table}. Status: ${status}`);
          console.log(`Response:`, data);
        }
      } catch (tableError) {
        console.error(`Exception when accessing table ${table}:`, tableError);
      }
    }
    
    // Test a simple RPC call
    try {
      console.log('\nTesting RPC function: check_table_exists');
      const { data, error } = await supabase.rpc('check_table_exists', { table_name_param: 'categories' });
      
      if (error) {
        console.error('Error calling RPC function:', error);
      } else {
        console.log('RPC function result:', data);
      }
    } catch (rpcError) {
      console.error('Exception when calling RPC function:', rpcError);
    }
    
  } catch (error) {
    console.error('General error during connection test:', error);
  }
}

testConnection(); 