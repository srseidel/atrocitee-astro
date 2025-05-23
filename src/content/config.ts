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
    order: z.number().optional(),
  }),
});

// Export collections
export const collections = {
  'about': aboutCollection,
  'products': productsCollection,
}; 