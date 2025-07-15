# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Atrocitee is an e-commerce platform selling politically-themed merchandise where products are created on Printful, imported into the Astro website, and sold to the public. A portion of each purchase contributes to charitable causes. The name combines "atrocity" with "tee" to highlight transforming attention on troubling events into tangible support for affected communities.

**Slogan**: "Threads of Change"

## Technology Stack

- **Framework**: Astro (hybrid rendering - static & server-side)
- **Database**: Supabase (PostgreSQL with auth and RLS)
- **Styling**: Tailwind CSS with custom design system
- **Components**: React (for interactive components)
- **Product Management**: Printful API (print-on-demand)
- **Payments**: Stripe (planned)
- **Hosting**: Cloudflare Pages
- **Monitoring**: Sentry error tracking

## Common Development Commands

```bash
# Development
npm run dev                    # Start development server (localhost:4321)
npm run start                  # Alias for dev

# Building
npm run build                  # Production build with image optimization
npm run build-dev              # Development build
npm run build-quick            # Development build without prerendering
npm run build-no-prerender     # Production build without prerendering
npm run cloudflare-build       # Special build for Cloudflare with placeholders

# Code Quality
npm run lint                   # Run ESLint
npm run lint:fix              # Auto-fix ESLint issues

# Testing and Scripts
npm run preview               # Preview production build
npm run check-printful        # Check Printful mockup status
npm run get-printful-ids      # Get Printful product IDs
npm run optimize-images       # Optimize images for web
npm run setup-env             # Setup environment variables
npm run move-mockups          # Move mockup files to correct locations
```

## Architecture and Routing Strategy

### Prerendering Rules (Critical)

**Shop Pages** (`/shop/*`):
- **ALWAYS use `export const prerender = true`**
- Static generation for SEO and performance
- Client-side interactivity for variants/cart still works
- Use `getStaticPaths()` for product pages

**Admin Pages** (`/admin/*`):
- **ALWAYS use `export const prerender = false`**
- Server-side rendering for authentication and dynamic data
- Never statically generate admin content

**API Routes** (`/api/*`):
- **ALWAYS use `export const prerender = false`**
- Must be dynamic to handle requests

**Account Pages** (`/account/*`):
- **ALWAYS use `export const prerender = false`**
- User-specific content requires server-side rendering

### Path Aliases

Always use path aliases (defined in `tsconfig.json`):
```typescript
@/*                    // src/*
@components/*          // src/components/*
@layouts/*            // src/layouts/*
@lib/*                // src/lib/*
@local-types/*        // src/types/*
@utils/*              // src/utils/*
@config/*             // src/config/*
@assets/*             // src/assets/*
```

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── features/        # Feature-specific components
│   │   ├── auth/        # Authentication forms
│   │   └── products/    # Product-related components
│   └── layouts/         # Layout components
├── lib/
│   ├── auth/           # Authentication logic and middleware
│   ├── database/       # Database schemas and migrations
│   ├── printful/       # Printful API integration
│   ├── supabase/       # Supabase client configurations
│   └── monitoring/     # Sentry configuration
├── pages/
│   ├── admin/          # Admin dashboard pages
│   ├── api/            # API endpoints
│   ├── auth/           # Authentication pages
│   ├── shop/           # Product catalog and pages
│   └── account/        # User account pages
├── types/              # TypeScript type definitions
├── styles/             # CSS files
└── content/            # Content collections
```

## Key Development Principles

### Security Requirements
- All `/admin` and `/api` routes must implement proper authentication
- Use middleware for auth checks on protected routes
- Never expose admin logic in client-side code
- Always verify admin status server-side before serving admin content

### Client-Side Interactivity
- **Product Pages**: Use React components with `client:*` directives for variants, cart preview
- **Admin/API/Account Pages**: Avoid client-side state management (security requirement)
- Never use direct DOM manipulation - use React components instead
- Use `client:load`, `client:idle`, or `client:visible` appropriately

### Data Management
- Categories are managed through `CORE_CATEGORIES` constants in `src/types/database/models.ts`
- Product variants use `Record<string, string>` for options (e.g., `{"color": "Black", "size": "M"}`)
- Always implement type guards for external API data
- Transform Printful API data to match client expectations

### Image and Asset Handling
- Use WebP format for optimized images
- Mockups are stored in `public/images/mockups/[product-slug]/`
- Run `npm run optimize-images` before production builds
- Implement proper fallback images for missing variants

## Supabase Integration

### Client Types
- `createServerSupabaseClient()` - For server-side operations with cookies
- `createBrowserSupabaseClient()` - For client-side operations
- `createClient()` - For static generation (no session persistence)

### Database Models
Key types are defined in `src/types/database/models.ts`:
- `Profile` - User profiles with role-based access
- `Product` - Products with Printful integration
- `ProductVariant` - Product variants with options
- `Category` - Product categories with core constants

## Printful Integration

Located in `src/lib/printful/`:
- `api-client.ts` - Main API client
- `product-sync.ts` - Product synchronization
- `service.ts` - Business logic layer
- `mockup-queue.ts` - Mockup generation queue

## Common Patterns

### Error Handling
```typescript
// Always implement comprehensive error handling
try {
  const result = await operation();
  if (!isValidType(result)) {
    throw new Error('Invalid data received');
  }
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  return fallbackValue;
}
```

### Type Guards
```typescript
// Always use type guards for external data
function isProductVariant(value: unknown): value is ProductVariant {
  return typeof value === 'object' && 
         value !== null && 
         'id' in value && 
         'options' in value;
}
```

### Component Hydration
```astro
<!-- Product page interactivity -->
<VariantSelector 
  client:load 
  variants={variants} 
  initialSelection={selectedVariant} 
/>

<!-- Admin components (avoid client-side) -->
<AdminTable data={serverData} />
```

## Development Guidelines

1. **Update First**: Look for existing files to update before creating new ones
2. **Type Safety**: Use TypeScript throughout with proper type guards
3. **Security**: Server-side auth checks for all protected routes
4. **Performance**: Leverage static generation for public pages
5. **SEO**: Use prerendering for product pages and public content
6. **Testing**: Verify functionality across different page types
7. **Documentation**: Document complex logic and architectural decisions

## Common Pitfalls to Avoid

- Never mix server-side and client-side code without clear boundaries
- Never assume external API data matches internal expectations
- Never use client-side state management for admin/API/account pages
- Never implement client-side functionality without proper error handling
- Never use direct DOM manipulation - use React components instead