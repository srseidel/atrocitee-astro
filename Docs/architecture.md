# Project Architecture

## Directory Structure

```
atrocitee-astro/
├── .astro/                 # Astro build files
│   ├── collections/        # Content collections
│   └── integrations/       # Astro integrations
│       └── _astrojs_cloudflare/
│
├── .github/                # GitHub configuration
│   └── workflows/          # GitHub Actions workflows
│
├── Docs/                   # Project documentation
│   ├── api/               # API documentation
│   ├── backup-scripts/    # Backup utilities
│   ├── development/       # Development guides
│   └── mvp-planning/      # MVP planning docs
│
├── public/                 # Static assets
│   ├── images/            # Image assets
│   ├── fonts/             # Font files
│   └── icons/             # Icon assets
│
├── scripts/               # Utility scripts
│
├── src/
│   ├── assets/           # Source assets
│   │
│   ├── components/       # Components
│   │   ├── common/       # Shared UI components
│   │   ├── features/     # Feature-specific components
│   │   │   ├── auth/     # Authentication components
│   │   │   └── products/ # Product-related components
│   │   └── layouts/      # Layout components
│   │
│   ├── config/          # Configuration files
│   │
│   ├── content/         # Content collections
│   │   ├── about/       # About page content
│   │   ├── products/    # Product content
│   │   └── rules/       # Business rules
│   │
│   ├── layouts/         # Astro layouts
│   │
│   ├── lib/            # Core libraries
│   │   ├── auth/       # Authentication
│   │   ├── config/     # Configuration
│   │   ├── constants/  # Constants
│   │   ├── database/   # Database utilities
│   │   │   └── migrations/ # Database migrations
│   │   ├── monitoring/ # Monitoring utilities
│   │   ├── printful/   # Printful integration
│   │   └── supabase/   # Supabase utilities
│   │
│   ├── pages/          # Astro pages
│   │   ├── account/    # Account pages
│   │   ├── admin/      # Admin pages
│   │   │   └── products/ # Product management
│   │   ├── api/        # API endpoints
│   │   │   └── v1/     # API version 1
│   │   │       ├── admin/   # Admin endpoints
│   │   │       ├── cron/    # Cron jobs
│   │   │       ├── debug/   # Debug endpoints
│   │   │       ├── printful/ # Printful endpoints
│   │   │       └── tags/    # Tag endpoints
│   │   ├── auth/      # Authentication pages
│   │   └── shop/      # Shop pages
│   │       └── product/ # Product pages
│   │
│   ├── scripts/       # Frontend scripts
│   │
│   ├── styles/        # Global styles
│   │
│   ├── types/         # TypeScript types
│   │   ├── api/       # API types
│   │   ├── common/    # Shared types
│   │   ├── database/  # Database types
│   │   └── printful/  # Printful types
│   │
│   └── utils/         # Utility functions
│       └── helpers/   # Helper functions
│
├── tests/             # Test files
│   ├── e2e/          # End-to-end tests
│   ├── integration/  # Integration tests
│   └── unit/         # Unit tests
│
├── astro.config.mjs  # Astro configuration
├── package.json      # Project dependencies
├── tailwind.config.js # Tailwind configuration
├── tsconfig.json     # TypeScript configuration
└── wrangler.toml     # Cloudflare configuration
```

## Key Directories Explained

### `.astro/`
- `collections/`: Astro content collections configuration
- `integrations/`: Astro framework integrations
  - `_astrojs_cloudflare/`: Cloudflare Pages integration

### `Docs/`
- `api/`: API documentation and specifications
- `backup-scripts/`: Database and content backup utilities
- `development/`: Development guides and standards
- `mvp-planning/`: MVP feature planning and roadmap

### `src/components/`
- `common/`: Reusable UI components used across the application
- `features/`: Domain-specific components
  - `auth/`: Authentication components
  - `products/`: Product-related components
- `layouts/`: Layout components for page structure

### `src/content/`
- `about/`: About page content in Markdown
- `products/`: Product content and metadata
- `rules/`: Business rules and policies

### `src/lib/`
- `auth/`: Authentication middleware and utilities
- `config/`: Application configuration
- `constants/`: Shared constants
- `database/`: Database utilities and migrations
- `monitoring/`: Application monitoring
- `printful/`: Printful integration services
- `supabase/`: Supabase client and utilities

### `src/pages/`
- `account/`: User account management
- `admin/`: Admin interface and tools
- `api/v1/`: API endpoints
  - `admin/`: Admin operations
  - `cron/`: Scheduled tasks
  - `debug/`: Development endpoints
  - `printful/`: Printful webhooks
  - `tags/`: Tag management
- `auth/`: Authentication flows
- `shop/`: E-commerce pages
  - `product/`: Product details and listings

### `src/types/`
- `api/`: API request/response types
- `common/`: Shared type definitions
- `database/`: Database schema types
- `printful/`: Printful API types

## Tech Stack

- **Framework**: Astro
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **E-commerce**: Printful integration
- **Hosting**: Cloudflare Pages
- **Type Safety**: TypeScript
- **Testing**: Jest (unit), Playwright (e2e)

## Development Patterns

### 1. Content Management
- Use Astro content collections for static content
- Markdown files for content with frontmatter
- Type-safe content schemas
- SEO-optimized content structure

### 2. Component Architecture
- Astro components for static pages
- React components for interactive features
- Tailwind CSS for styling
- Proper hydration strategies:
  - `client:load` for critical interactivity
  - `client:visible` for deferred loading
  - `client:idle` for non-critical features

### 3. Data Flow
- Server-side rendering for SEO
- Static generation where possible
- Dynamic imports for large components
- Proper error boundaries
- Type-safe database queries

### 4. API Design
- RESTful endpoints under `/api/v1`
- Proper error handling
- Rate limiting
- Authentication middleware
- Type-safe request/response

### 5. Security
- Supabase RLS policies
- Protected admin routes
- Environment variable management
- CORS configuration
- API key management

### 6. Performance
- Static generation
- Image optimization
- Code splitting
- Lazy loading
- Cache strategies

## Deployment

- Cloudflare Pages for hosting
- GitHub Actions for CI/CD
- Environment-specific configurations
- Database migrations
- Backup strategies

## Monitoring

- Error tracking
- Performance monitoring
- Usage analytics
- Logging
- Alerting

## Best Practices

1. **Code Organization**
   - Follow directory structure
   - Use appropriate abstractions
   - Maintain clear boundaries
   - Document complex logic

2. **Type Safety**
   - Use TypeScript strictly
   - Define proper interfaces
   - Avoid `any` types
   - Validate API responses

3. **Performance**
   - Optimize images
   - Minimize JavaScript
   - Use proper caching
   - Monitor metrics

4. **Security**
   - Validate inputs
   - Sanitize outputs
   - Use proper authentication
   - Follow security best practices

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