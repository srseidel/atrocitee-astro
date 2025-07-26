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
- **Payments**: Stripe (integrated with test & production modes)
- **Order Fulfillment**: Printful API (sandbox & production environments)
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
│   ├── printful/       # Printful API integration & order fulfillment
│   ├── stripe/         # Stripe payment processing
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

### Security Considerations for Logging
- **NEVER log sensitive data** in any environment:
  - Passwords, API keys, tokens, secrets
  - Credit card numbers, SSNs, personal data
  - Internal system paths or database schemas
- **Use debug utility** instead of console.log to ensure production safety
- **Sanitization**: Debug utility automatically strips sensitive patterns
- **Sentry Integration**: Critical errors sent to Sentry with sanitized data
- **Environment separation**: Debug logs only in `ENABLE_TEST_MODE=true`

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

## Printful Integration & Order Fulfillment

Located in `src/lib/printful/`:
- `api-client.ts` - Main API client with sandbox/production support
- `product-sync.ts` - Product synchronization
- `service.ts` - Business logic layer
- `mockup-queue.ts` - Mockup generation queue
- `order-service.ts` - Complete order fulfillment system

### Order Fulfillment Flow
1. **Cart → Stripe Payment**: Customer completes purchase via Stripe
2. **Order Creation**: Local order record created in Supabase
3. **Printful Submission**: Order automatically submitted to Printful for fulfillment
4. **Status Updates**: Real-time status updates via Printful webhooks
5. **Customer Tracking**: Order status visible in customer's "My Orders" page

### Environment Configuration
- **Development**: Automatically uses Printful sandbox mode
- **Production**: Uses production Printful environment
- **Testing**: `/test-checkout` page for end-to-end testing with real products

## Stripe Payment Integration

Located in `src/lib/stripe/` and `src/pages/api/v1/checkout/`:
- Complete payment processing with test/production modes
- Integration with Printful order fulfillment
- Automatic order creation after successful payment
- Support for authenticated and guest checkout

## Order Management System

### Database Schema
Key order-related tables:
- `orders` - Main order records with Stripe/Printful integration
- `order_items` - Individual items with product snapshots
- `webhook_logs` - Tracking webhook events from external services

### Order Status Flow
```
paid → processing → shipped → delivered
  ↓        ↓          ↓         ↓
Stripe   Printful   Tracking  Complete
```

### My Orders Page (`/account/orders`)
- **Server-rendered** with `prerender = false`
- Real-time order status from Printful webhooks
- Order history with detailed item information
- Development testing buttons for order creation

### Admin Order Management
- `/admin/orders` - All orders overview
- `/admin/orders/[id]` - Individual order details
- Integration with Printful status tracking
- Webhook event logging and monitoring

## Testing & Development

### Test Order Creation
Two approaches for development testing:

1. **Simple Test Orders** (Blue button):
   - Creates local database records only
   - Fast for UI testing
   - No external API calls

2. **Complete Printful Orders** (Green button):
   - Full end-to-end flow with Printful sandbox
   - Real webhook integration
   - Actual fulfillment pipeline testing

### End-to-End Testing (`/test-checkout`)
- **Development only** - redirects in production
- Displays real products with Printful integration status
- Step-by-step testing guide
- Integration with existing cart/checkout system

## Debug Utility & Logging

### Environment-Aware Logging
The codebase uses a centralized debug utility that respects the `ENABLE_TEST_MODE` environment variable:

```typescript
import { debug } from '@lib/utils/debug';

// Development logging (only when ENABLE_TEST_MODE=true or DEV=true)
debug.log('Debug information');
debug.info('Informational message');
debug.warn('Warning message');
debug.error('Development error');

// Specialized logging
debug.api('POST', '/api/orders', 200, { orderId: '123' });
debug.db('INSERT', 'orders', orderData);
debug.auth('LOGIN', 'user@example.com');
debug.performance('Order creation', 156.2, { items: 3 });

// Critical errors (always handled)
debug.criticalError('Payment failed', error, { orderId: '123' });
debug.userError('Order not found', technicalError, context);
```

### Debug Modes
- **Development** (`ENABLE_TEST_MODE=true` or `DEV=true`):
  - All debug output to console
  - Full error details with stack traces
  - Performance timing information
  - API request/response logging

- **Production** (`ENABLE_TEST_MODE=false` and `PROD=true`):
  - No debug console output
  - Critical errors sent to Sentry with sanitized data
  - Clean user-facing error messages
  - Sensitive data automatically stripped from logs

### Environment Variables
```bash
# Development/Testing
ENABLE_TEST_MODE=true          # Enable all debug output
NODE_ENV=development           # Development mode

# Production  
ENABLE_TEST_MODE=false         # Disable debug output, enable Sentry
NODE_ENV=production            # Production mode
```

### Performance Timing
```typescript
import { perfTimer } from '@lib/utils/debug';

const timer = perfTimer('Database operation');
await performDatabaseOperation();
const duration = timer.end({ recordsProcessed: 150 });
```

## Common Patterns

### Error Handling
```typescript
// Always use debug utility instead of console.log
import { debug } from '@lib/utils/debug';

try {
  const result = await operation();
  if (!isValidType(result)) {
    throw new Error('Invalid data received');
  }
  debug.log('Operation succeeded:', result);
  return result;
} catch (error) {
  debug.criticalError('Operation failed', error, { context: 'user-action' });
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