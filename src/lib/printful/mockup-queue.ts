import { createClient } from '@supabase/supabase-js';
import { PrintfulService } from './service';

// Queue type definitions
interface MockupTask {
  id: string;
  variantId: string;
  printfulProductId: number;
  printfulVariantId: number;
  printfulExternalId: string;
  view: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'rate_limited';
  retryAfter?: Date;
  createdAt: Date;
  updatedAt: Date;
  result?: any;
  error?: string;
}

// In-memory queue (would be better to use Redis or a database in production)
let taskQueue: MockupTask[] = [];
let isProcessing = false;
let supabaseClient: any = null;

// Configure rate limiting
const RATE_LIMIT = 2; // Printful allows 2 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds in ms
let lastRequestTimes: number[] = [];

/**
 * Initialize the queue with Supabase client
 */
export function initQueue(supabase: any) {
  supabaseClient = supabase;
  return {
    addTask,
    getQueueStatus,
    processQueue
  };
}

/**
 * Add a new task to the queue
 */
export async function addTask(task: Omit<MockupTask, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
  const now = new Date();
  const id = crypto.randomUUID();
  
  const newTask: MockupTask = {
    ...task,
    id,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  };
  
  taskQueue.push(newTask);
  
  // Store in database if available
  if (supabaseClient) {
    try {
      await supabaseClient
        .from('printful_mockup_tasks')
        .insert({
          id: newTask.id,
          product_variant_id: newTask.variantId,
          view_type: newTask.view,
          status: newTask.status,
          created_at: newTask.createdAt.toISOString(),
          updated_at: newTask.updatedAt.toISOString()
        });
    } catch (error) {
      console.error('Error storing task in database:', error);
    }
  }
  
  // Start processing the queue if not already running
  if (!isProcessing) {
    processQueue();
  }
  
  return id;
}

/**
 * Get the current status of the queue for a variant
 */
export function getQueueStatus(variantId: string): {
  pending: number;
  processing: number;
  completed: number;
  error: number;
  rateLimited: number;
  total: number;
  currentTask?: MockupTask;
} {
  const variantTasks = taskQueue.filter(task => task.variantId === variantId);
  
  const pending = variantTasks.filter(task => task.status === 'pending').length;
  const processing = variantTasks.filter(task => task.status === 'processing').length;
  const completed = variantTasks.filter(task => task.status === 'completed').length;
  const error = variantTasks.filter(task => task.status === 'error').length;
  const rateLimited = variantTasks.filter(task => task.status === 'rate_limited').length;
  
  // Get the current processing task
  const currentTask = variantTasks.find(task => task.status === 'processing');
  
  return {
    pending,
    processing,
    completed,
    error,
    rateLimited,
    total: variantTasks.length,
    currentTask
  };
}

/**
 * Process the next task in the queue
 */
export async function processQueue(): Promise<void> {
  // If already processing or queue is empty, exit
  if (isProcessing || taskQueue.length === 0) {
    return;
  }
  
  isProcessing = true;
  
  try {
    // Find the next task to process
    const pendingTasks = taskQueue.filter(task => task.status === 'pending');
    const rateLimitedTasks = taskQueue.filter(task => 
      task.status === 'rate_limited' && 
      (!task.retryAfter || task.retryAfter <= new Date())
    );
    
    // Prioritize regular pending tasks, then retry rate limited ones
    const nextTask = pendingTasks[0] || rateLimitedTasks[0];
    
    if (!nextTask) {
      isProcessing = false;
      return;
    }
    
    // Check if we can process based on rate limits
    if (!canProcessRequest()) {
      // Update the task to rate limited
      nextTask.status = 'rate_limited';
      nextTask.retryAfter = new Date(Date.now() + getRetryAfterTime());
      nextTask.updatedAt = new Date();
      
      // Update database if available
      if (supabaseClient) {
        await supabaseClient
          .from('printful_mockup_tasks')
          .update({
            status: 'rate_limited',
            updated_at: nextTask.updatedAt.toISOString()
          })
          .eq('id', nextTask.id);
      }
      
      // Process the queue again after rate limit window
      setTimeout(() => {
        isProcessing = false;
        processQueue();
      }, getRetryAfterTime());
      
      return;
    }
    
    // Mark task as processing
    nextTask.status = 'processing';
    nextTask.updatedAt = new Date();
    
    // Update database if available
    if (supabaseClient) {
      await supabaseClient
        .from('printful_mockup_tasks')
        .update({
          status: 'processing',
          updated_at: nextTask.updatedAt.toISOString()
        })
        .eq('id', nextTask.id);
    }
    
    // Process the task by calling Printful API
    try {
      // Record this request for rate limiting
      lastRequestTimes.push(Date.now());
      
      // Get the PrintfulService instance
      const printfulService = PrintfulService.getInstance();
      
      console.log(`Creating mockup task for variant ${nextTask.printfulVariantId}, view: ${nextTask.view}`);
      
      // Call the Printful API to create a mockup task
      const mockupTask = await printfulService.createMockupGenerationTask(
        nextTask.printfulProductId,
        nextTask.printfulVariantId,
        {
          position: nextTask.view,
          variantExternalId: nextTask.printfulExternalId,
          format: 'jpg',
          // Always include a default file to ensure we have at least one required parameter
          files: [
            {
              placement: mapViewToPlacement(nextTask.view),
              image_url: 'https://files.cdn.printful.com/upload/generator/a7g2-mockup-generator-4d0f4.png'
            }
          ]
        }
      );
      
      console.log(`Mockup task created successfully: ${mockupTask.task_key}`);
      
      // Update task with the Printful task key
      nextTask.status = 'completed';
      nextTask.updatedAt = new Date();
      nextTask.result = mockupTask;
    
    // Update database if available
    if (supabaseClient) {
      await supabaseClient
        .from('printful_mockup_tasks')
        .update({
          status: 'completed',
          result: nextTask.result,
          updated_at: nextTask.updatedAt.toISOString()
        })
        .eq('id', nextTask.id);
    }
  } catch (error) {
    // Check if it's a rate limit error
    const isRateLimit = error instanceof Error && 
      error.message.includes('Too Many Requests');
    
    if (isRateLimit) {
      // Extract retry-after time if available
      let retryAfterSeconds = 60;
      try {
        const match = error.message.match(/try again after (\d+) seconds/i);
        if (match && match[1]) {
          retryAfterSeconds = parseInt(match[1], 10);
        }
      } catch (parseError) {
        console.error('Failed to parse retry-after value', parseError);
      }
      
      // Update task to rate limited
      nextTask.status = 'rate_limited';
      nextTask.retryAfter = new Date(Date.now() + (retryAfterSeconds * 1000) + 1000);
      nextTask.updatedAt = new Date();
      nextTask.error = error instanceof Error ? error.message : 'Rate limit error';
      
      // Update database if available
      if (supabaseClient) {
        await supabaseClient
          .from('printful_mockup_tasks')
          .update({
            status: 'rate_limited',
            error: nextTask.error,
            updated_at: nextTask.updatedAt.toISOString()
          })
          .eq('id', nextTask.id);
      }
    } else {
      // Update task to error
      nextTask.status = 'error';
      nextTask.updatedAt = new Date();
      nextTask.error = error instanceof Error ? error.message : 'Unknown error';
      
      // Update database if available
      if (supabaseClient) {
        await supabaseClient
          .from('printful_mockup_tasks')
          .update({
            status: 'error',
            error: nextTask.error,
            updated_at: nextTask.updatedAt.toISOString()
          })
          .eq('id', nextTask.id);
      }
    }
  }
  
  // Process next task after a short delay
  setTimeout(() => {
    isProcessing = false;
    processQueue();
  }, 100);
} catch (error) {
  console.error('Error processing queue:', error);
  isProcessing = false;
}
}

/**
 * Check if we can process a request based on rate limits
 */
function canProcessRequest(): boolean {
  const now = Date.now();
  
  // Clean up old request times
  lastRequestTimes = lastRequestTimes.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  // Check if we've hit the rate limit
  return lastRequestTimes.length < RATE_LIMIT;
}

/**
 * Get the time to wait before retrying (in ms)
 */
function getRetryAfterTime(): number {
  if (lastRequestTimes.length === 0) {
    return 0;
  }
  
  const oldestRequest = Math.min(...lastRequestTimes);
  const timeToWait = RATE_LIMIT_WINDOW - (Date.now() - oldestRequest);
  
  // Add a 10% buffer
  return Math.max(1000, Math.ceil(timeToWait * 1.1));
}

/**
 * Maps our view names to Printful placement identifiers
 * @param view The view name from our frontend
 * @returns The corresponding Printful placement identifier
 */
function mapViewToPlacement(view: string): string {
  const placementMap: Record<string, string> = {
    'front': 'front',
    'back': 'back',
    'left_front': 'left',
    'right_front': 'right',
    'flat': 'flat',
    'lifestyle': 'lifestyle',
    // For hats
    'top': 'embroidery_front',
    // Fallbacks for other types
    'default': 'front'
  };
  
  return placementMap[view] || placementMap['default'];
} 