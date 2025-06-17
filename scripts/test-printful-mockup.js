#!/usr/bin/env node

/**
 * This script tests the Printful mockup generation API
 * Run with: node scripts/test-printful-mockup.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Constants
const API_KEY = process.env.PRINTFUL_API_KEY;
const BASE_URL = 'https://api.printful.com';
const OUTPUT_DIR = 'mockups';

// Make sure we have the API key
if (!API_KEY) {
  console.error('Error: PRINTFUL_API_KEY environment variable is required');
  process.exit(1);
}

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Headers for API requests
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

// Function to create a mockup task
async function createTask(productId, templateId, variantIds, files) {
  console.log(`Creating mockup task for product ${productId} with template ${templateId || 'auto-select'}`);
  
  const payload = {
    variant_ids: variantIds,
    files: files,
    format: 'png',
  };
  
  // Only add template_id if it's not null
  if (templateId) {
    payload.template_id = templateId;
  }
  
  console.log('Request payload:', JSON.stringify(payload, null, 2));
  
  const response = await fetch(`${BASE_URL}/mockup-generator/create-task/${productId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('Error response:', data);
    throw new Error(`Failed to create mockup task: ${response.status} ${response.statusText}`);
  }
  
  console.log('Task created successfully:', data.result);
  return data.result.task_key;
}

// Function to check task status
async function checkTaskStatus(taskKey, pollIntervalMs = 2000) {
  console.log(`Checking status of task ${taskKey}...`);
  
  while (true) {
    const response = await fetch(`${BASE_URL}/mockup-generator/task?task_key=${taskKey}`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error checking task status:', data);
      throw new Error(`Failed to check task status: ${response.status} ${response.statusText}`);
    }
    
    const status = data.result.status;
    console.log(`Task status: ${status}`);
    
    if (status === 'completed') {
      return data.result.mockups;
    } else if (status === 'failed') {
      throw new Error(`Mockup generation failed: ${data.result.error || 'Unknown error'}`);
    }
    
    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
}

// Function to download a file
async function downloadFile(url, filePath) {
  console.log(`Downloading ${url} to ${filePath}...`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
  }
  
  const fileStream = fs.createWriteStream(filePath);
  return new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on('error', reject);
    fileStream.on('finish', resolve);
  });
}

// Function to get product information
async function getProductInfo(productId) {
  console.log(`Fetching information for product ${productId}...`);
  
  const response = await fetch(`${BASE_URL}/store/products/${productId}`, {
    method: 'GET',
    headers
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('Error response:', data);
    throw new Error(`Failed to get product info: ${response.status} ${response.statusText}`);
  }
  
  console.log('Product information:', JSON.stringify(data.result, null, 2));
  return data.result;
}

// Main function
async function main() {
  try {
    // Get the product ID, template ID, and variant ID from command line arguments or use defaults
    const productId = process.argv[2] || 71; // Default to Bella+Canvas 3001 T-shirt catalog product ID
    const templateId = process.argv[3] || null; // Default template ID (null to auto-select)
    const variantId = process.argv[4] || 4012; // Default variant ID for Bella+Canvas 3001
    
    console.log(`Using catalog product ID: ${productId}, template ID: ${templateId}, variant ID: ${variantId}`);
    
    // Sample file for mockup generation
    const files = [
      {
        placement: 'front', // T-shirts use 'front'
        image_url: 'https://files.cdn.printful.com/upload/generator/a7g2-mockup-generator-4d0f4.png'
      }
    ];
    
    // Create the mockup task
    const taskKey = await createTask(productId, templateId, [variantId], files);
    
    // Poll for task completion
    const mockups = await checkTaskStatus(taskKey);
    console.log(`Generated ${mockups.length} mockups.`);
    
    // Download all mockups
    for (let i = 0; i < mockups.length; i++) {
      const mockup = mockups[i];
      const filename = `mockup_${productId}_${variantId}_${i + 1}.png`;
      const filePath = path.join(OUTPUT_DIR, filename);
      
      await downloadFile(mockup.mockup_url, filePath);
      console.log(`Downloaded mockup ${i + 1} to ${filePath}`);
    }
    
    console.log('✓ All mockups downloaded successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main(); 