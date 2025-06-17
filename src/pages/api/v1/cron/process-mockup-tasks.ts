import type { APIRoute } from 'astro';
import { createClient } from '@lib/supabase/client';
import { PrintfulService } from '@lib/printful/service';

// Ensure this endpoint is server-rendered
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    // Check for the cron-secret header to secure this endpoint
    const cronSecret = request.headers.get('x-cron-secret');
    const validSecret = import.meta.env.CRON_SECRET || 'your-cron-secret';
    
    if (cronSecret !== validSecret) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid or missing cron secret'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Initialize Supabase client using service role (for admin access)
    const supabase = createClient();
    
    // Initialize Printful service
    const printfulService = PrintfulService.getInstance();
    
    // Get all pending mockup tasks
    const { data: pendingTasks, error: tasksError } = await supabase
      .from('printful_mockup_tasks')
      .select(`
        id,
        task_id,
        view_type,
        product_variant_id,
        status,
        created_at
      `)
      .eq('status', 'pending')
      .order('created_at');
      
    if (tasksError) {
      console.error('Error fetching pending tasks:', tasksError);
      throw tasksError;
    }
    
    console.log(`Found ${pendingTasks?.length || 0} pending mockup tasks`);
    
    if (!pendingTasks || pendingTasks.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending tasks to process'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Process each pending task
    const results = [];
    for (const task of pendingTasks) {
      try {
        console.log(`Processing task ${task.id} (${task.task_id})`);
        
        // Check task status with Printful
        const taskStatus = await printfulService.getMockupGenerationTask(task.task_id);
        
        if (taskStatus.status === 'completed') {
          console.log(`Task ${task.id} completed successfully`);
          
          // Update task status in the database
          await supabase
            .from('printful_mockup_tasks')
            .update({
              status: 'completed',
              result: taskStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', task.id);
          
          // Get the variant this task belongs to
          const { data: variant } = await supabase
            .from('product_variants')
            .select('id, name, files, products!inner(id, slug)')
            .eq('id', task.product_variant_id)
            .single();
            
          if (variant) {
            // Update the variant's files array with the new mockup
            let variantFiles = Array.isArray(variant.files) ? [...variant.files] : [];
            
            // Add mockup file(s) to the variant's files
            if (taskStatus.mockups && Array.isArray(taskStatus.mockups)) {
              for (const mockup of taskStatus.mockups) {
                // Check if this mockup file already exists to avoid duplicates
                const mockupExists = variantFiles.some(file => 
                  file.type === task.view_type && 
                  file.url === mockup.mockup_url
                );
                
                if (!mockupExists) {
                  variantFiles.push({
                    type: task.view_type,
                    url: mockup.mockup_url,
                    preview_url: mockup.mockup_url,
                    mockup_task_id: task.id,
                    generated: true,
                    created_at: new Date().toISOString()
                  });
                }
              }
              
              // Update the variant in the database
              await supabase
                .from('product_variants')
                .update({
                  files: variantFiles,
                  updated_at: new Date().toISOString()
                })
                .eq('id', variant.id);
                
              results.push({
                taskId: task.id,
                status: 'completed',
                variantId: variant.id,
                mockupCount: taskStatus.mockups.length
              });
            } else {
              console.warn(`Task ${task.id} completed but no mockups found in result`);
              results.push({
                taskId: task.id,
                status: 'completed',
                variantId: variant.id,
                mockupCount: 0,
                warning: 'No mockups found in result'
              });
            }
          } else {
            console.warn(`Variant ${task.product_variant_id} not found for task ${task.id}`);
            results.push({
              taskId: task.id,
              status: 'orphaned',
              warning: 'Variant not found'
            });
          }
        } else if (taskStatus.status === 'failed') {
          console.error(`Task ${task.id} failed:`, taskStatus.error || 'Unknown error');
          
          // Update task status in the database
          await supabase
            .from('printful_mockup_tasks')
            .update({
              status: 'failed',
              error: JSON.stringify(taskStatus.error || 'Unknown error'),
              updated_at: new Date().toISOString()
            })
            .eq('id', task.id);
            
          results.push({
            taskId: task.id,
            status: 'failed',
            error: taskStatus.error || 'Unknown error'
          });
        } else {
          // Still pending or in progress
          console.log(`Task ${task.id} is still ${taskStatus.status}`);
          results.push({
            taskId: task.id,
            status: taskStatus.status
          });
        }
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
        results.push({
          taskId: task.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error processing mockup tasks:', error);
    return new Response(JSON.stringify({
      error: 'Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 