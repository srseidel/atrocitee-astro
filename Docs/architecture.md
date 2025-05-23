# Project Architecture

## Directory Structure

```
atrocitee-astro/
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

## Key Directories Explained

### `src/components/`
- `common/`: Reusable UI components used across the application
- `features/`: Feature-specific components organized by domain
- `layouts/`: Layout components for page structure

### `src/lib/`
- `auth/`: Authentication middleware and utilities
- `config/`: Application configuration and environment setup
- `database/`: Database utilities and query helpers
- `monitoring/`: Monitoring and logging configuration
- `supabase/`: Supabase client and related utilities

### `src/pages/`
- `api/v1/`: Versioned API endpoints organized by feature
- `admin/`: Admin interface pages
- `account/`: User account management pages

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