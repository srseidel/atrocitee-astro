# Atrocitee-Astro Migration Plan

## Phase 1: Setup and Preparation

### 1. Create New Directory Structure
```bash
# Create new directories
mkdir -p src/content/{about,products}
mkdir -p src/components/{common,features,layouts}
mkdir -p src/pages/api/v1/{admin,products,tags}
mkdir -p src/lib/{supabase,printful}
mkdir -p tests/{e2e,integration,unit}
mkdir -p public/{images,fonts,icons}
```

### 2. Update Configuration
- Create content collection configuration
- Update tsconfig.json paths
- Update import aliases in astro.config.mjs

## Phase 2: Content Migration

### 1. Move Static Content
- Convert about.astro to content collection
- Move product descriptions to content
- Create content type definitions

### 2. Update Content References
- Update imports in pages
- Add content collection utilities
- Update type definitions

## Phase 3: Component Migration

### 1. Reorganize Components
```bash
# Move UI components
mv src/components/ui/* src/components/common/

# Create feature directories
mkdir -p src/components/features/{auth,products,admin}

# Move feature components
mv src/components/auth/* src/components/features/auth/
mv src/components/product/* src/components/features/products/
mv src/components/admin/* src/components/features/admin/

# Move layout components
mv src/components/layout/* src/components/layouts/
```

### 2. Update Component Imports
- Update all component imports
- Fix any broken references
- Update type definitions

## Phase 4: API Migration

### 1. Reorganize API Endpoints
```bash
# Create versioned API structure
mkdir -p src/pages/api/v1/{admin,products,tags}

# Move existing endpoints
mv src/pages/api/admin/* src/pages/api/v1/admin/
mv src/pages/api/products/* src/pages/api/v1/products/
mv src/pages/api/tags/* src/pages/api/v1/tags/
```

### 2. Update API References
- Update API client imports
- Update endpoint references
- Add API versioning

## Phase 5: Layout Structure (Completed)
- Analyzed and optimized layout structure:
  - Removed unused `Layout.astro`
  - Enhanced `MainLayout.astro` with:
    - Improved SEO meta tags
    - Better accessibility attributes
    - Extracted navigation configuration
    - Optimized authentication check
    - Moved mobile menu JavaScript to separate file
  - Maintained `AdminLayout.astro` as is
- Created new files:
  - `src/scripts/mobile-menu.ts`: Mobile menu functionality
  - `src/config/navigation.ts`: Navigation configuration
- Layout organization:
  ```
  src/layouts/
  ├── MainLayout.astro (Primary layout)
  └── AdminLayout.astro (Admin layout)
  ```

## Phase 6: Utils and Lib Organization (Completed)
- Reorganized lib directory:
  - Moved Supabase client to `src/lib/supabase/client.ts`
  - Created `src/lib/config/env.ts` for environment configuration
  - Created `src/lib/database/queries.ts` for database utilities
  - Moved auth middleware to `src/lib/auth/middleware.ts`
  - Moved Sentry to `src/lib/monitoring/sentry.ts`
- Reorganized utils directory:
  - Created `src/utils/helpers/format.ts` for formatting utilities
- New structure:
  ```
  src/
  ├── lib/
  │   ├── auth/
  │   │   └── middleware.ts
  │   ├── config/
  │   │   └── env.ts
  │   ├── database/
  │   │   └── queries.ts
  │   ├── monitoring/
  │   │   └── sentry.ts
  │   └── supabase/
  │       └── client.ts
  └── utils/
      └── helpers/
          └── format.ts
  ```
- Improvements:
  - Centralized environment configuration
  - Type-safe database queries
  - Reusable formatting utilities
  - Better organization of auth and monitoring code

## Phase 7: Type Migration (Completed)
- Reorganized type definitions:
  - Created `src/types/database/` for database types:
    - `schema.ts`: Database schema types
    - `models.ts`: Database entity types
  - Created `src/types/printful/` for Printful types:
    - `api.ts`: Printful API types
  - Created `src/types/common/` for shared types:
    - `index.ts`: Common types for forms, auth, etc.
  - Created `src/types/index.ts` as central export
- New structure:
  ```
  src/types/
  ├── database/
  │   ├── schema.ts
  │   └── models.ts
  ├── printful/
  │   └── api.ts
  ├── common/
  │   └── index.ts
  └── index.ts
  ```
- Improvements:
  - Better organization by domain
  - Clearer separation of concerns
  - Centralized type exports
  - Added common types for shared functionality
  - Removed duplicate type definitions

## Phase 8: Documentation Update (Completed)
- Updated architecture documentation:
  - Added new directory structure
  - Updated API organization
  - Updated layout structure
  - Updated utils and lib organization
  - Updated types organization
- Created development guidelines:
  - Code style guidelines
  - File organization rules
  - Development workflow
  - Best practices
  - Migration notes
- Documentation improvements:
  - Better organization
  - Clearer guidelines
  - More detailed examples
  - Updated conventions
  - Added migration notes

### Phase 9: Import Path Fixes (Completed)
- Fixed auth middleware imports:
  - Updated `src/lib/auth/middleware.ts` to use correct Supabase client path
  - Updated imports in key files to use TypeScript path aliases:
    - `src/pages/api/v1/tags/index.ts`
    - `src/layouts/AdminLayout.astro`
    - `src/pages/admin/products/configure/[id].astro`
    - `src/pages/account/index.astro`
- Improved import consistency:
  - Switched to using `@lib` path alias for library imports
  - Updated Supabase client imports to use correct path
  - Fixed relative path imports to use absolute paths with aliases
- Benefits:
  - More consistent import paths
  - Better TypeScript support
  - Easier maintenance
  - Reduced path complexity

### Phase 10: File Cleanup (Completed)
- Reorganized utility scripts:
  - Moved `check-db.js` to `scripts/check-db.js`
  - Moved `check-env.js` to `scripts/check-env.js`
  - Moved `setup-printful-env.sh` to `scripts/setup-printful-env.sh`
  - Moved `deploy.sh` to `scripts/deploy.sh`
- Reorganized configuration files:
  - Moved `sentry.server.config.js` and `sentry.client.config.js` to `src/lib/monitoring/`
  - Moved `env.d.ts` to `src/types/env.d.ts`
- Removed duplicate files:
  - Removed duplicate middleware file
  - Cleaned up old auth files
- Benefits:
  - Better organization of utility scripts
  - Centralized configuration management
  - Reduced duplication
  - Clearer project structure

## Next Steps
- Review and test all changes
- Update any remaining references
- Verify documentation accuracy
- Plan next phase of development

## Implementation Order

1. **Week 1: Setup and Content**
   - Create new directory structure
   - Move static content
   - Update configurations

2. **Week 2: Components and API**
   - Reorganize components
   - Migrate API endpoints
   - Update imports

3. **Week 3: Testing and Assets**
   - Setup test structure
   - Reorganize assets
   - Update references

4. **Week 4: Types and Documentation**
   - Reorganize types
   - Update documentation
   - Final cleanup

## Rollback Plan

1. **Backup Current Structure**
```bash
# Create backup
tar -czf backup-$(date +%Y%m%d).tar.gz src/
```

2. **Version Control**
- Create migration branch
- Commit each phase separately
- Keep main branch stable

3. **Testing Strategy**
- Test each phase before proceeding
- Maintain test coverage
- Document any issues

## Success Criteria

1. **Structure**
- All files in correct locations
- No broken imports
- Proper type definitions

2. **Functionality**
- All features working
- No regression issues
- Proper error handling

3. **Documentation**
- Updated architecture docs
- New guidelines in place
- Migration documented

Would you like me to:
1. Start with any specific phase?
2. Create more detailed steps for any phase?
3. Generate the specific commands for any section? 