# Atrocitee-Astro File Mapping

This document provides a comprehensive mapping of all files in the atrocitee-astro workspace, their purposes, and whether they are still needed.

## Root Directory

### Configuration Files
- `astro.config.mjs` - Main Astro configuration file
- `package.json` - Node.js project configuration and dependencies
- `package-lock.json` - Locked dependencies
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `wrangler.toml` - Cloudflare Workers configuration
- `sentry.client.config.js` - Sentry client-side configuration
- `sentry.server.config.js` - Sentry server-side configuration

### Scripts and Tools
- `check-db.js` - Database validation script
- `check-env.js` - Environment variable validation
- `setup-printful-env.sh` - Printful environment setup script
- `deploy.sh` - Deployment script

### Documentation
- `README.md` - Project documentation
- `phase1.log` - Phase 1 development log
- `phase2.log` - Phase 2 development log

### IDE and Version Control
- `.git/` - Git repository
- `.gitignore` - Git ignore rules
- `.vscode/` - VS Code configuration
- `atrocitee-astro.code-workspace` - VS Code workspace file

### Build and Distribution
- `.astro/` - Astro build cache
- `dist/` - Build output directory
- `node_modules/` - Node.js dependencies

### Source Code
- `src/` - Main source code directory
- `public/` - Static assets
- `scripts/` - Utility scripts

## Source Directory (`src/`)

### Core Application
- `middleware.ts` - Application middleware
- `env.d.ts` - Environment type definitions

### Application Structure
- `layouts/` - Page layouts
- `pages/` - Application pages
- `components/` - Reusable components
- `api/` - API endpoints
- `lib/` - Shared libraries
- `types/` - TypeScript type definitions
- `utils/` - Utility functions
- `styles/` - Global styles
- `config/` - Application configuration
- `assets/` - Application assets

## Pages Directory (`src/pages/`)

### Public Pages
- `index.astro` - Home page
- `about.astro` - About page
- `products.astro` - Products listing
- `contact.astro` - Contact page
- `404.astro` - Not found page

### Authentication
- `auth/` - Authentication pages
- `account/` - User account pages
  - `index.astro` - Account dashboard
  - `setting.astro` - Account settings
  - `order.astro` - Order management
  - Status: ACTIVE
  - Purpose: User account management
  - Note: Consolidated from old accounts/ directory

### Shop
- `shop/` - Shop pages
- `checkout/` - Checkout process

### Admin
- `admin/` - Admin interface
  - `dashboard.astro` - Main admin dashboard
  - `products-dashboard.astro` - Products management
  - `index.astro` - Admin landing page
  - `setup-database.astro` - Database setup
  - `backups.astro` - Backup management
  - `printful-test.astro` - Printful integration testing
  - `old_revisions/` - Archived admin pages
  - `backups/` - Backup management pages
  - `products/` - Product management
    - `[id].astro` - Individual product management
    - `configure/` - Product configuration
    - `tags.astro` - Tag management
    - `archive/` - Archived product pages

### Testing
- `test-sentry.astro` - Sentry error tracking test
- `test-sentry-basic.astro` - Basic Sentry test
- `test-sentry-direct.astro` - Direct Sentry test
- `env-test.astro` - Environment testing
- `hugoplate-example.astro` - Example template

## Detailed Analysis

### Admin Section (`src/pages/admin/`)

#### Current Active Files
- `dashboard.astro` - Main admin dashboard
  - Status: ACTIVE
  - Purpose: Main admin interface
  - Dependencies: AdminLayout, Supabase client

- `products-dashboard.astro` - Products management
  - Status: ACTIVE
  - Purpose: Product management interface
  - Dependencies: AdminLayout, Supabase client
  - Note: This should be the main product management interface

- `index.astro` - Admin landing page
  - Status: ACTIVE
  - Purpose: Redirects to dashboard
  - Dependencies: None

- `setup-database.astro` - Database setup
  - Status: ACTIVE
  - Purpose: Database initialization and setup
  - Dependencies: Supabase client

- `backups.astro` - Backup management
  - Status: ACTIVE
  - Purpose: Database backup interface
  - Dependencies: AdminLayout, Supabase client

#### Archived Files
- `old_revisions/sync.astro`
  - Status: ARCHIVED
  - Purpose: Old product synchronization interface
  - Note: Functionality moved to products-dashboard.astro

- `products/archive/`
  - `manage.astro` - Old product management interface
  - `index.astro` - Old product listing
  - `all.astro` - Duplicate product listing
  - `categories.astro` - Old category management
  - Status: ALL ARCHIVED
  - Note: Functionality consolidated into products-dashboard.astro

#### Testing Files
- `printful-test.astro`
  - Status: TEST
  - Purpose: Printful integration testing
  - Note: Should be moved to a dedicated test directory

#### Duplicate Functionality
1. Product Management:
   - `products-dashboard.astro` (current)
   - `products/archive/manage.astro` (archived)
   - `products/archive/index.astro` (archived)
   - `products/archive/all.astro` (archived)

2. Category Management:
   - Currently in `products-dashboard.astro`
   - Previously in `products/archive/categories.astro` (archived)

3. Sync Functionality:
   - Currently in `products-dashboard.astro`
   - Previously in `old_revisions/sync.astro` (archived)

#### Recommended Actions
1. Consolidate all product management into `products-dashboard.astro`
2. Move test files to a dedicated test directory
3. Clean up archived files that are no longer needed
4. Update architecture documentation to reflect current structure

### API Directory (`src/pages/api/`)

#### Admin API (`/admin/`)
- `categories/` - Category management endpoints
  - Status: ACTIVE
  - Purpose: Handle category CRUD operations
  - Note: Recently moved from `/api/categories/`

- `products/` - Product management endpoints
  - Status: ACTIVE
  - Purpose: Handle product CRUD operations
  - Note: Main product API endpoints

#### Printful Integration (`/printful/`)
- `sync-products.ts` - Product synchronization
  - Status: ACTIVE
  - Purpose: Sync products from Printful
  - Dependencies: Printful API client

- `sync.ts` - Main sync functionality
  - Status: ACTIVE
  - Purpose: Core sync operations
  - Dependencies: Printful API client

- `catalog.ts` - Catalog operations
  - Status: ACTIVE
  - Purpose: Handle Printful catalog operations
  - Dependencies: Printful API client

- `product-changes.ts` - Change tracking
  - Status: ACTIVE
  - Purpose: Track product changes
  - Dependencies: Database client

#### Testing and Debug Files
- `test-db.ts`, `test-database.ts` - Database testing
- `debug-api.ts` - API debugging
- `test-config.ts` - Configuration testing
- `test.ts` - General testing
- Status: ALL TEST
- Note: Should be moved to a dedicated test directory

#### Archived Files
- `archive/` - General archived endpoints
- `printful/archive/` - Archived Printful endpoints
- `printful/old_revisions/` - Old Printful implementations
- Status: ALL ARCHIVED
- Note: Should be cleaned up if no longer needed

#### Duplicate Functionality
1. Database Testing:
   - `test-db.ts`
   - `test-database.ts`
   - `db-tables-check.ts`

2. Printful Testing:
   - `test.ts`
   - `debug-api.ts`
   - `test-config.ts`

### Library Directory (`src/lib/`)

#### Core Libraries
- `supabase.ts` - Supabase client
  - Status: ACTIVE
  - Purpose: Database client configuration
  - Dependencies: Supabase client

#### Database (`/db/`)
- Status: ACTIVE
- Purpose: Database utilities and migrations
- Note: Contains schema and migration files

#### Constants (`/constants/`)
- Status: ACTIVE
- Purpose: Application constants
- Note: Contains category and other constant definitions

#### Printful Integration (`/printful/`)
- Status: ACTIVE
- Purpose: Printful API utilities
- Note: Contains API client and helper functions

#### Archived Files
- `archive/` - Archived utilities
- Status: ARCHIVED
- Note: Should be cleaned up if no longer needed

#### Recommended Actions for API and Lib
1. Consolidate Testing:
   - Move all test files to a dedicated test directory
   - Create standardized test utilities
   - Remove duplicate test implementations

2. Clean Up Archives:
   - Review archived files for any needed functionality
   - Remove truly obsolete files
   - Document any important archived code

3. Standardize API Structure:
   - Move all admin endpoints under `/api/admin/`
   - Consolidate Printful endpoints
   - Create clear API documentation

4. Library Organization:
   - Review and consolidate database utilities
   - Standardize constant definitions
   - Clean up Printful integration code

## Next Steps

This mapping will be used to:
1. Identify duplicate functionality
2. Mark files for archival
3. Clean up unused code
4. Reorganize the codebase
5. Update the architecture documentation

Would you like me to:
1. Start analyzing specific directories in detail?
2. Create a list of files that can be safely archived?
3. Propose a new, cleaner structure?

## Reorganization Commands

The following commands will move unused and duplicate files to a `re-org` directory for review. Each command is paired with its reverse command to undo the changes if needed.

```bash
# Create re-org directory structure
mkdir -p re-org/{admin,api,components,layouts,types,utils,styles,config,lib}

# Move duplicate/unused files to re-org directory
# Admin Section
mv src/pages/admin/old_revisions re-org/admin/
mv src/pages/admin/products/archive re-org/admin/products/
mv src/pages/admin/backups re-org/admin/
mv src/pages/admin/printful-test.astro re-org/admin/

# API Section
mv src/pages/api/archive re-org/api/
mv src/pages/api/printful/archive re-org/api/printful/
mv src/pages/api/printful/old_revisions re-org/api/printful/
mv src/pages/api/test-db.ts re-org/api/
mv src/pages/api/test-database.ts re-org/api/
mv src/pages/api/debug-api.ts re-org/api/
mv src/pages/api/test-config.ts re-org/api/
mv src/pages/api/test.ts re-org/api/

# Components Section
mv src/components/archive re-org/components/
mv src/components/admin re-org/components/
mv src/components/product re-org/components/
mv src/components/checkout re-org/components/
mv src/components/cart re-org/components/

# Layouts Section
mv src/layouts/archive re-org/layouts/
mv src/layouts/auth re-org/layouts/
mv src/layouts/shop re-org/layouts/

# Types Section
mv src/types/archive re-org/types/

# Utils Section
mv src/utils/auth.ts.orig re-org/utils/
mv src/utils/auth-fixed.ts re-org/utils/
mv src/utils/archive re-org/utils/

# Styles Section
mv src/styles/design-system.css.bak re-org/styles/

# Lib Section
mv src/lib/db/migrations re-org/lib/db/

# Pages Section
mv src/pages/shop re-org/pages/
mv src/pages/about re-org/pages/
mv src/pages/checkout re-org/pages/

# Reverse Commands (to undo the reorganization)
# Admin Section
mv re-org/admin/old_revisions src/pages/admin/
mv re-org/admin/products/archive src/pages/admin/products/
mv re-org/admin/backups src/pages/admin/
mv re-org/admin/printful-test.astro src/pages/admin/

# API Section
mv re-org/api/archive src/pages/api/
mv re-org/api/printful/archive src/pages/api/printful/
mv re-org/api/printful/old_revisions src/pages/api/printful/
mv re-org/api/test-db.ts src/pages/api/
mv re-org/api/test-database.ts src/pages/api/
mv re-org/api/debug-api.ts src/pages/api/
mv re-org/api/test-config.ts src/pages/api/
mv re-org/api/test.ts src/pages/api/

# Components Section
mv re-org/components/archive src/components/
mv re-org/components/admin src/components/
mv re-org/components/product src/components/
mv re-org/components/checkout src/components/
mv re-org/components/cart src/components/

# Layouts Section
mv re-org/layouts/archive src/layouts/
mv re-org/layouts/auth src/layouts/
mv re-org/layouts/shop src/layouts/

# Types Section
mv re-org/types/archive src/types/

# Utils Section
mv re-org/utils/auth.ts.orig src/utils/
mv re-org/utils/auth-fixed.ts src/utils/
mv re-org/utils/archive src/utils/

# Styles Section
mv re-org/styles/design-system.css.bak src/styles/

# Lib Section
mv re-org/lib/db/migrations src/lib/db/

# Pages Section
mv re-org/pages/shop src/pages/
mv re-org/pages/about src/pages/
mv re-org/pages/checkout src/pages/
```

### Files and Directories Moved to Re-org

1. **Admin Section**
   - Old revisions of admin pages
   - Archived product pages
   - Backup management pages
   - Printful test page

2. **API Section**
   - Archived API endpoints
   - Test and debug files
   - Old Printful implementations

3. **Components Section**
   - Archived components
   - Empty component directories (admin, product, checkout, cart)

4. **Layouts Section**
   - Archived layouts
   - Empty layout directories (auth, shop)

5. **Types Section**
   - Archived type definitions

6. **Utils Section**
   - Old auth implementations
   - Archived utilities

7. **Styles Section**
   - Design system backup

8. **Lib Section**
   - Empty migrations directory

9. **Pages Section**
   - Empty page directories (shop, about, checkout)

### Next Steps After Reorganization

1. Review files in the re-org directory
2. Document any important functionality
3. Create a timeline for final cleanup
4. Update architecture documentation
5. Test the application after reorganization

Would you like to:
1. Execute these reorganization commands?
2. Review specific sections in more detail?
3. Modify the reorganization plan?

### Components Directory (`src/components/`)

#### UI Components (`/ui/`)
- Status: ACTIVE
- Purpose: Reusable UI components
- Note: Should contain all basic UI elements

#### Layout Components (`/layout/`)
- Status: ACTIVE
- Purpose: Layout-specific components
- Note: Components used across different layouts

#### Feature Components
- `auth/` - Authentication components
- `admin/` - Admin interface components
- `cart/` - Shopping cart components
- `checkout/` - Checkout process components
- `product/` - Product-related components
- Status: ALL ACTIVE
- Note: Each feature has its own component directory

#### Standalone Components
- `ProductCard.astro` - Product display card
  - Status: ACTIVE
  - Purpose: Display product information
  - Dependencies: Product types

- `Welcome.astro` - Welcome page component
  - Status: ACTIVE
  - Purpose: Home page welcome section
  - Dependencies: None

#### Potential Issues
1. Component Organization:
   - Some components might be better placed in feature directories
   - Need to review component dependencies
   - Consider creating a component library

### Layouts Directory (`src/layouts/`)

#### Main Layouts
- `MainLayout.astro` - Primary site layout
  - Status: ACTIVE
  - Purpose: Main site structure
  - Dependencies: UI components

- `AdminLayout.astro` - Admin interface layout
  - Status: ACTIVE
  - Purpose: Admin section structure
  - Dependencies: Admin components

- `Layout.astro` - Base layout
  - Status: ACTIVE
  - Purpose: Common layout elements
  - Dependencies: None

#### Feature Layouts
- `admin/` - Admin-specific layouts
- `auth/` - Authentication layouts
- `shop/` - Shop-specific layouts
- Status: ALL ACTIVE
- Note: Each feature has its own layout directory

#### Potential Issues
1. Layout Hierarchy:
   - Need to clarify relationship between base and feature layouts
   - Consider consolidating common layout elements
   - Review layout component dependencies

### Recommended Actions for Components and Layouts
1. Component Organization:
   - Create clear component hierarchy
   - Move standalone components to appropriate feature directories
   - Document component dependencies

2. Layout Structure:
   - Define clear layout inheritance
   - Consolidate common layout elements
   - Create layout documentation

3. Feature Organization:
   - Review feature-specific components and layouts
   - Ensure consistent organization across features
   - Document feature architecture

### Types Directory (`src/types/`)

#### Core Type Definitions
- `database.ts` - Database types
  - Status: ACTIVE
  - Purpose: Define database schema types
  - Dependencies: None
  - Note: Main source of database type definitions

- `printful.ts` - Printful types
  - Status: ACTIVE
  - Purpose: Define Printful API types
  - Dependencies: None
  - Note: Main Printful type definitions

#### Feature Types
- `printful/` - Printful-specific types
  - Status: ACTIVE
  - Purpose: Additional Printful type definitions
  - Note: Should be consolidated with main printful.ts

#### Archived Types
- `archive/` - Archived type definitions
  - Status: ARCHIVED
  - Note: Should be reviewed and cleaned up

#### Potential Issues
1. Type Organization:
   - Duplicate Printful type definitions
   - Need to consolidate type definitions
   - Consider creating type documentation

### Utils Directory (`src/utils/`)

#### Authentication Utilities
- `auth.ts` - Current authentication utilities
  - Status: ACTIVE
  - Purpose: Authentication helper functions
  - Dependencies: Supabase client

- `auth.ts.orig` - Original authentication file
  - Status: ARCHIVED
  - Purpose: Backup of original auth implementation
  - Note: Should be removed if no longer needed

- `auth-fixed.ts` - Fixed authentication implementation
  - Status: ARCHIVED
  - Purpose: Alternative auth implementation
  - Note: Should be removed if no longer needed

#### Error Tracking
- `sentry.ts` - Sentry integration
  - Status: ACTIVE
  - Purpose: Error tracking utilities
  - Dependencies: Sentry client

#### Potential Issues
1. Authentication Files:
   - Multiple auth implementations
   - Need to consolidate into single file
   - Remove unused implementations

2. Utility Organization:
   - Consider organizing by feature
   - Create clear utility documentation
   - Review utility dependencies

### Recommended Actions for Types and Utils
1. Type Definitions:
   - Consolidate Printful types
   - Create type documentation
   - Review and clean up archived types

2. Authentication:
   - Consolidate auth implementations
   - Remove unused auth files
   - Document auth utilities

3. Utility Organization:
   - Organize utilities by feature
   - Create utility documentation
   - Review utility dependencies

### Styles Directory (`src/styles/`)

#### Core Styles
- `base.css` - Base styles
  - Status: ACTIVE
  - Purpose: Basic style definitions
  - Dependencies: None

- `global.css` - Global styles
  - Status: ACTIVE
  - Purpose: Site-wide styles
  - Dependencies: base.css

#### Design System
- `design-system.css` - Current design system
  - Status: ACTIVE
  - Purpose: Design system implementation
  - Dependencies: base.css, global.css

- `design-system.css.bak` - Design system backup
  - Status: ARCHIVED
  - Purpose: Backup of design system
  - Note: Should be removed if no longer needed

#### Custom Styles
- `custom.css` - Custom styles
  - Status: ACTIVE
  - Purpose: Custom style overrides
  - Dependencies: design-system.css

#### Potential Issues
1. Style Organization:
   - Multiple style files with overlapping purposes
   - Need to clarify style hierarchy
   - Consider consolidating styles

2. Design System:
   - Backup file should be removed
   - Need to document design system
   - Review style dependencies

### Config Directory (`src/config/`)

#### Environment Configuration
- `env.ts` - Environment configuration
  - Status: ACTIVE
  - Purpose: Environment variable handling
  - Dependencies: None
  - Note: Main configuration file

#### Potential Issues
1. Configuration Organization:
   - Consider adding more configuration files
   - Need to document configuration
   - Review configuration dependencies

### Recommended Actions for Styles and Config
1. Style Organization:
   - Consolidate style files
   - Remove backup files
   - Create style documentation

2. Design System:
   - Document design system
   - Review style dependencies
   - Create style guide

3. Configuration:
   - Add configuration documentation
   - Review configuration structure
   - Consider adding more configuration files

[Rest of the file remains unchanged...] 