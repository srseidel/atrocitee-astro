# Project Architecture

### Core Concept
Atrocitee is a merchandise platform where products are created on Printful, imported into the Astro website atrocitee.com, and sold to the public. No products are created on the Atrocitee site; all products are managed through Printful. This approach leverages Astro's SEO capabilities and static page generation while utilizing Printful's ease of use and potential for future integration with other dropshippers. A unique feature of Atrocitee is that every purchase contributes to a charity of the user's choice from our list of supported organizations.

### The Idea Behind the Site
The name cleverly combines "atrocity" with "tee" to highlight the platform's mission: transforming attention on troubling events into tangible support for affected communities. The slogan of Atrocitee is "Threads of Change."

## Overview
Atrocitee is a modern e-commerce platform built with the following technology stack:

### Core Technologies
- **Astro**: Primary web framework for building the Atrocitee website
  - Provides excellent performance and SEO capabilities
  - Enables component-based development with React integration
  - Handles static and dynamic content efficiently

- **Stripe**: Payment processing and financial infrastructure
  - Secure payment processing and checkout
  - Subscription management capabilities
  - Automated tax calculations and compliance
  - Fraud prevention and security features

### Backend & Infrastructure
- **Supabase**: Backend-as-a-Service platform
  - Handles user authentication and JWT token management
  - Serves as the primary database for product and user data
  - Provides real-time capabilities and secure data storage

### E-commerce & Fulfillment
- **Printful**: Print-on-demand and fulfillment service
  - Manages product creation and inventory
  - Handles order fulfillment and shipping
  - Provides product catalog and pricing that are imported into our Astro site
  - Integrates with Stripe for order processing

### Monitoring & Hosting
- **Cloudflare Pages**: Hosting platform (MVP - Free Plan)
  - Provides global CDN and edge computing
  - Enables fast content delivery
  - Offers automatic HTTPS and security features

- **Sentry**: Error tracking and monitoring (MVP - Free Plan)
  - Real-time error tracking and reporting
  - Performance monitoring
  - User session tracking

## Directory Structure

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
│   │   ├── database/    # Database utilities
│   │   │   └── queries.ts
│   │   ├── monitoring/  # Monitoring and logging
│   │   │   ├── sentry.client.config.js
│   │   │   └── sentry.server.config.js
│   │   ├── printful/    # Printful integration
│   │   │   ├── api-client.ts    # Core API client
│   │   │   ├── service.ts       # Business logic
│   │   │   ├── product-sync.ts  # Sync functionality
│   │   │   └── scheduled-sync.ts # Scheduled tasks
│   │   └── supabase/    # Supabase client
│   │       └── client.ts
│   │
│   ├── pages/           # Astro pages
│   │   ├── api/         # API endpoints
│   │   │   └── v1/      # Versioned API
│   │   │       ├── admin/    # Admin endpoints
│   │   │       ├── products/ # Product endpoints
│   │   │       ├── printful/ # Printful API endpoints
│   │   │       │   ├── create-from-template.ts
│   │   │       │   ├── sync-products.ts
│   │   │       │   ├── sync.ts
│   │   │       │   └── catalog.ts
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

## Key Directories Explained

### `docs/`
- Contains project-wide documentation outside of the Astro application structure
- `api/`: API documentation, endpoints, and integration guides
- `development/`: Development guidelines, coding standards, and best practices
- `deployment/`: Deployment guides, environment setup, and server configuration
- `user-guides/`: User documentation, tutorials, and feature guides
- Purpose: Host comprehensive project documentation that isn't part of the application itself
- Benefits:
  - Clear separation between application code and documentation
  - Easy to maintain and version control
  - Accessible to both developers and users
  - Can be served separately from the application if needed

### `ai-logs/`
- Contains documentation and logs generated during AI-assisted development
- `architecture.md`: Current project architecture and guidelines
- `migration-plan.md`: Migration progress and planning documentation

### `src/components/`
- `common/`: Reusable UI components used across the application
- `features/`: Feature-specific components organized by domain
- `layouts/`: Layout components for page structure

### `src/lib/`
- Contains core business logic and reusable functionality
- Example: `src/lib/printful/` contains:
  - Core Printful integration logic
  - API clients and service layers
  - Business logic and utilities
  - Reusable code used by both API endpoints and other parts of the application
- Purpose: Host reusable code that can be imported anywhere in the application
- Benefits:
  - Clear separation of concerns
  - Code reusability
  - Easier testing
  - Better maintainability

### `src/pages/api/`
- Contains HTTP endpoints and route handlers
- Example: `src/pages/api/v1/printful/` contains:
  - API endpoints that expose Printful functionality
  - Request/response handling
  - Route-specific logic
  - API-specific error handling
- Purpose: Provide HTTP interfaces to the core functionality
- Benefits:
  - Clear API boundaries
  - Consistent error handling
  - Version control
  - Easy to maintain and document

### `src/types/`
- `database/`: Database schema and model types
- `printful/`: Printful API type definitions
- `common/`: Shared type definitions
- `env.d.ts`: Environment variable type definitions

### `scripts/`
- Utility scripts for development, deployment, and maintenance
- Environment setup and database management tools

## File Naming Conventions

1. **Components**
   - React components: PascalCase (e.g., `Button.tsx`)
   - Astro components: PascalCase (e.g., `MainLayout.astro`)

2. **Utilities and Helpers**
   - Utility files: camelCase (e.g., `format.ts`)
   - Helper functions: descriptive camelCase

3. **Configuration**
   - Config files: kebab-case (e.g., `astro.config.mjs`)
   - Environment files: `.env` prefix

4. **Types**
   - Type definition files: camelCase (e.g., `schema.ts`)
   - Environment types: `env.d.ts`

## Import Conventions

1. **Path Aliases**
   - `@components/*`: Components directory
   - `@lib/*`: Library directory
   - `@utils/*`: Utilities directory
   - `@types/*`: Types directory

2. **Import Order**
   ```typescript
   // External dependencies
   import { useState } from 'react';
   import type { FC } from 'react';

   // Internal aliases
   import { Button } from '@components/common/Button';
   import { useAuth } from '@lib/auth/hooks';

   // Relative imports
   import { formatPrice } from '../utils/format';
   ```

## Best Practices

1. **File Organization**
   - Keep related files together
   - Use appropriate directory structure
   - Follow naming conventions
   - Maintain clear separation of concerns

2. **Code Organization**
   - Group related functionality
   - Use appropriate abstractions
   - Follow DRY principles
   - Maintain clear boundaries

3. **Type Safety**
   - Use TypeScript strictly
   - Define proper interfaces
   - Avoid `any` types
   - Use proper type exports

4. **Documentation**
   - Document complex logic
   - Add JSDoc comments
   - Keep README updated
   - Document API changes

## Development Rules

### 1. Content Management
- Use content collections for static content
- Define content types in `config.ts`
- Follow markdown conventions
- Use frontmatter for metadata

### 2. Component Development
- Place reusable components in `common/`
- Group feature components in `features/`
- Keep layouts in `layouts/`
- Follow Astro's component patterns
- Use TypeScript for props

### 3. API Development
- Version all API endpoints (v1)
- Group by feature
- Use TypeScript for types
- Follow REST conventions
- Document endpoints

### 4. Layout Development
- Use MainLayout for common structure
- Use AdminLayout for admin pages
- Keep layouts simple
- Use slots for content

### 5. Utility Development
- Keep utilities pure
- Document functions
- Add type definitions
- Write tests
- Group by functionality

### 6. Type Management
- Organize types by domain
- Use TypeScript features
- Document types
- Keep types DRY
- Export through index.ts

## Migration Guidelines

### 1. Moving Files
- Follow directory structure
- Update imports
- Test changes
- Document moves

### 2. Updating Code
- Follow new patterns
- Update types
- Test changes
- Document updates

### 3. Testing Changes
- Write tests
- Run tests
- Fix issues
- Document tests

### 4. Documentation
- Update docs
- Add examples
- Document changes
- Follow conventions

## Future Considerations

### 1. Scalability
- Plan for growth
- Use appropriate patterns
- Document scaling
- Monitor performance

### 2. Maintenance
- Keep code clean
- Update dependencies
- Document changes
- Follow conventions

### 3. Development
- Follow patterns
- Write tests
- Document code
- Review changes

Would you like me to:
1. Add more detail to any section?
2. Create specific examples?
3. Add more guidelines? 