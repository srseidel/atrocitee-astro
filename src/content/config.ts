import { defineCollection, z } from 'astro:content';

// About collection schema
const aboutCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    order: z.number().optional(),
  }),
});

// Products collection schema
const productsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    price: z.number(),
    image: z.string().optional(),
    category: z.string(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    published: z.boolean().optional().default(true),
    order: z.number().optional(),
    variants: z.array(z.object({
      name: z.string().optional(),
      retail_price: z.number().optional(),
      id: z.string().or(z.number()).optional(),
      options: z.record(z.string()).optional(),
      files: z.array(z.object({
        preview_url: z.string().optional(),
        type: z.string().optional()
      })).optional()
    })).optional(),
    charity: z.object({
      name: z.string(),
      description: z.string().optional(),
      website_url: z.string().optional(),
      logo_url: z.string().optional()
    }).optional(),
    donation_amount: z.number().optional(),
  }),
});

// Export collections
export const collections = {
  'about': aboutCollection,
  'products': productsCollection,
}; 