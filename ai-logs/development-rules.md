# Development Rules

## Core Purpose
Atrocitee is an e-commerce platform focused on charitable donations and SEO. The platform uses Printful for product creation and sales, with a portion of proceeds going to charity.

## Tech Stack
- **Astro**: Main framework
- **React**: For interactive components
- **Supabase**: Database and authentication
- **Printful**: Product creation and fulfillment
- **Stripe**: Payment processing
- **Cloudflare Pages**: Hosting
- **Sentry**: Error tracking

## Key Rules

### File Structure
- All source code goes in `src/`
- Static content in `src/content/`
- Components in `src/components/`
- Pages in `src/pages/`
- Layouts in `src/layouts/`
- Libraries in `src/lib/`
- Types in `src/types/`
- Utils in `src/utils/`

### Directory Organization
- `src/lib/` contains core business logic and reusable functionality
  - Example: `src/lib/printful/` contains core Printful integration logic, API clients, and business logic
  - These files are used by both API endpoints and other parts of the application
  - Should contain reusable code that can be imported anywhere in the application

- `src/pages/api/` contains HTTP endpoints and route handlers
  - Example: `src/pages/api/v1/printful/` contains API endpoints that expose Printful functionality
  - These files handle HTTP requests/responses and use the core logic from `src/lib/`
  - Should be thin wrappers around the business logic in `src/lib/`

### Development Standards
- Use TypeScript for all new code
- Follow Astro's file-based routing
- Use server-side rendering for admin pages
- Implement proper error handling
- Write tests for critical functionality

### TypeScript Configuration
- Use path aliases for all imports
- Path aliases are defined in `tsconfig.json`
- Never use relative paths for imports
- Use `@types/*` for external type definitions (from DefinitelyTyped)
- Use `@local-types/*` for our own type definitions
- Use `@lib/*` for library imports
- Use `@components/*` for component imports
- Use `@layouts/*` for layout imports
- Use `@utils/*` for utility imports
- Use `@config/*` for configuration imports
- Use `@content/*` for content imports
- Use `@scripts/*` for script imports

### Product Management
- All products must be synced with Printful
- Maintain proper category mapping
- Track all product changes
- Implement proper error handling for sync operations
- Use product_tags table for tag relationships (no direct tag storage in products table)
- Follow database normalization principles
- Implement proper RLS policies for product-related tables
- Use appropriate indexes for performance optimization

### Code Organization
- Keep components small and focused
- Use proper type definitions
- Follow consistent naming conventions
- Document complex logic
- Use path aliases for imports

### File Management
- **IMPORTANT**: Update existing files instead of creating new ones
  - If a file exists for a specific purpose, modify it rather than creating a new one
  - Example: Use `auth.ts` for all auth functions, not `fix-auth.ts` or `auth-fixed.ts`
  - Only create new files when adding completely new functionality
  - When in doubt, check if a similar file exists first
- Keep related functionality in the same file
- Use clear, descriptive file names
- Follow the established directory structure

### Documentation
- Document all major changes
- Keep README up to date
- Document API endpoints
- Maintain clear commit messages

## Quick Reference

### Directory Structure
```
atrocitee-astro/
├── ai-logs/              # AI-assisted development logs
│   ├── architecture.md   # Project architecture documentation
│   └── migration-plan.md # Migration progress and planning
│
├── docs/                 # Project documentation
│   ├── api/             # API documentation
│   ├── development/     # Development guidelines
│   ├── deployment/      # Deployment guides
│   └── user-guides/     # User documentation
│
├── public/                  # Static assets
│   ├── images/             # Image assets
│   ├── fonts/              # Font files
│   └── icons/              # Icon assets
│
├── scripts/                # Utility scripts
│   ├── check-db.js        # Database check utility
│   ├── check-env.js       # Environment check utility
│   ├── setup-printful-env.sh  # Printful environment setup
│   └── deploy.sh          # Deployment script
│
├── src/
│   ├── components/        # React components
│   │   ├── common/       # Shared UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   ├── features/     # Feature-specific components
│   │   │   ├── auth/     # Authentication components
│   │   │   ├── products/ # Product-related components
│   │   │   └── admin/    # Admin components
│   │   └── layouts/      # Layout components
│   │
│   ├── content/          # Static content
│   │   ├── about/        # About page content
│   │   └── products/     # Product content
│   │
│   ├── layouts/          # Astro layouts
│   │   ├── MainLayout.astro
│   │   └── AdminLayout.astro
│   │
│   ├── lib/             # Core libraries and utilities
│   │   ├── auth/        # Authentication
│   │   │   └── middleware.ts
│   │   ├── config/      # Configuration
│   │   │   └── env.ts
│   │   ├── database/    # Database utilities and schemas
│   │   │   ├── queries.ts
│   │   │   └── product_schema.sql
│   │   ├── monitoring/  # Monitoring and logging
│   │   │   ├── sentry.client.config.js
│   │   │   └── sentry.server.config.js
│   │   └── supabase/    # Supabase client
│   │       └── client.ts
│   │
│   ├── pages/           # Astro pages
│   │   ├── api/         # API endpoints
│   │   │   └── v1/      # Versioned API
│   │   │       ├── admin/    # Admin endpoints
│   │   │       ├── products/ # Product endpoints
│   │   │       └── tags/     # Tag endpoints
│   │   ├── admin/       # Admin pages
│   │   │   └── products/     # Product management
│   │   └── account/     # User account pages
│   │
│   ├── types/           # TypeScript type definitions
│   │   ├── database/    # Database types
│   │   │   ├── schema.ts
│   │   │   └── models.ts
│   │   ├── printful/    # Printful API types
│   │   │   └── api.ts
│   │   ├── common/      # Shared types
│   │   │   └── index.ts
│   │   ├── env.d.ts     # Environment type definitions
│   │   └── index.ts     # Type exports
│   │
│   └── utils/           # Utility functions
│       └── helpers/     # Helper functions
│           └── format.ts # Formatting utilities
│
├── tests/               # Test files
│   ├── e2e/            # End-to-end tests
│   ├── integration/    # Integration tests
│   └── unit/           # Unit tests
│
├── astro.config.mjs    # Astro configuration
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md          # Project documentation
```

### Path Aliases
- `@/*` -> `src/*`
- `@components/*` -> `src/components/*`
- `@layouts/*` -> `src/layouts/*`
- `@lib/*` -> `src/lib/*`
- `@types/*` -> `node_modules/@types/*` (for external type definitions)
- `@local-types/*` -> `src/types/*` (for our own type definitions)
- `@utils/*` -> `src/utils/*`
- `@content/*` -> `src/content/*`
- `@config/*` -> `src/config/*`
- `@scripts/*` -> `scripts/*`
- `@local-types/printful/*` -> `src/types/printful/*`
- `@local-types/database/*` -> `src/types/database/*`
- `@local-types/api/*` -> `src/types/api/*`
- `@local-types/common/*` -> `src/types/common/*`

### Path Alias Usage and Enforcement
- **IMPORTANT**: Never use relative paths for imports
  - ❌ `import { something } from '../../lib/printful/service'`
  - ✅ `import { something } from '@lib/printful/service'`

- **Path Alias Rules**:
  1. Always use path aliases for imports
  2. Use the most specific alias available
  3. Group related imports by alias type
  4. Order imports by alias type (e.g., types first, then lib, then components)

- **Import Order**:
  ```typescript
  // 1. External dependencies
  import type { APIRoute } from 'astro';
  import * as Sentry from '@sentry/astro';

  // 2. Type imports
  import type { Database } from '@local-types/database/supabase';
  import type { PrintfulProduct } from '@local-types/printful/api';

  // 3. Configuration
  import ENV from '@config/env';

  // 4. Library imports
  import { createServerSupabaseClient } from '@lib/supabase/client';
  import { PrintfulService } from '@lib/printful/service';

  // 5. Component imports
  import MainLayout from '@layouts/MainLayout.astro';
  import { Button } from '@components/ui/Button';

  // 6. Utility imports
  import { formatPrice } from '@utils/format';
  ```

- **Linting Rules**:
  - ESLint rule: `import/no-relative-parent-imports`
  - ESLint rule: `import/no-relative-packages`