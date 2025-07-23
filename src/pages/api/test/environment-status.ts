/**
 * Test Environment Status API
 * 
 * Provides test environment configuration status to client-side components
 */

import type { APIRoute } from 'astro';
import { validateTestEnvironment, isTestEnvironment } from '@lib/testing/config';

export const prerender = false;

export const GET: APIRoute = async () => {
  console.log('Environment Status API called');
  
  try {
    // Check if test environment is enabled
    console.log('Checking if test environment is enabled...');
    const testModeEnabled = isTestEnvironment();
    console.log('Test mode enabled:', testModeEnabled);
    
    if (!testModeEnabled) {
      console.log('Test mode not enabled, returning error response');
      return new Response(
        JSON.stringify({
          success: false,
          configured: false,
          error: 'Test mode is not enabled',
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate test environment configuration
    console.log('Validating test environment...');
    const testConfig = validateTestEnvironment();
    console.log('Test config:', testConfig);
    
    return new Response(
      JSON.stringify({
        success: true,
        configured: true,
        config: testConfig,
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Environment validation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};