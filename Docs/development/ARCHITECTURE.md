# Atrocitee Development Architecture

## Core Architecture Rules

### File Organization
```
/admin/products/
├── dashboard.astro (main product management & sync)
├── configure/[id].astro (product configuration)
├── tags.astro (tag management)
└── archive/ (old revisions)
    └── index.astro (previous product listing)

/api/admin/products/
├── [id].ts (product CRUD)
├── sync.ts (Printful sync)
├── tags.ts (tag management)
├── changes.ts (pending changes)
└── archive/ (old revisions)
    └── old_sync.ts (previous sync implementation)

/lib/
├── printful/ (Printful integration)
├── db/ (database utilities)
└── archive/ (old utilities)
    └── old_printful/ (previous Printful implementation)

/types/
├── database.ts (database types)
├── printful.ts (Printful types)
└── archive/ (old type definitions)
    └── old_types.ts (previous type definitions)
```

### Key Principles
1. **Single Source of Truth**
   - Each feature should have one primary implementation
   - Avoid duplicate functionality across different files
   - Keep related functionality in the same directory

2. **Clear Separation of Concerns**
   - Admin UI components under `/admin/`
   - API endpoints under `/api/admin/`
   - Shared utilities under `/lib/`
   - Types and interfaces under `/types/`

3. **Consistent Naming Conventions**
   - Use kebab-case for file names
   - Use PascalCase for component names
   - Use camelCase for function and variable names

4. **Archive Management**
   - Each main directory should have an `archive/` subdirectory
   - Move deprecated files to archive instead of deleting
   - Prefix archived files with `old_` for clarity
   - Document archived files in phase2.log
   - Keep archive structure mirroring the main directory structure

## Pre-Change Checklist

Before making any changes to the codebase, follow these steps:

1. Review existing code:
   - Check for similar functionality in the codebase
   - Look for existing patterns and conventions
   - Identify potential conflicts or dependencies

2. Review style guide:
   - Check `/docs/Atrocitee-MVP-Style_Guide.md` for UI/UX patterns
   - Ensure new components follow established design patterns
   - Verify color usage and typography matches guidelines
   - Confirm layout structure follows dashboard organization rules

3. Verify MVP alignment:
   - Ensure changes support core MVP requirements
   - Check against feature list in MVP documentation
   - Validate against user stories and requirements

4. Check for breaking changes:
   - Review database schema impacts
   - Check API endpoint compatibility
   - Verify frontend component dependencies
   - Test authentication and authorization flows

5. Update documentation:
   - Document changes in phase2.log
   - Update relevant API documentation
   - Add or update component documentation
   - Update architecture documentation if needed

## MVP Requirements

### Product Management
- [ ] Products sync from Printful without modifications
- [ ] Admin can manage basic categories (T-Shirts, Hats)
- [ ] Admin can manage tags
- [ ] Products can be published/unpublished
- [ ] Products can be featured
- [ ] Products have base price and donation amount

### User Management
- [ ] Admin authentication
- [ ] Role-based access control
- [ ] Secure API endpoints

### Data Management
- [ ] Proper database schema
- [ ] Efficient queries
- [ ] Data validation
- [ ] Error handling

## Change Documentation Template

```markdown
## Change: [Description]

### Files Modified
- [file1]: [purpose]
- [file2]: [purpose]

### Related Files
- [file3]: [relationship]
- [file4]: [relationship]

### Impact
- [What this changes]
- [What this affects]
- [What to test]

### Testing Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

## Best Practices

1. **Code Organization**
   - Keep files focused and single-purpose
   - Use clear, descriptive names
   - Maintain consistent structure

2. **Error Handling**
   - Implement proper error boundaries
   - Use try-catch blocks
   - Provide meaningful error messages

3. **Performance**
   - Optimize database queries
   - Minimize API calls
   - Use proper caching

4. **Security**
   - Validate all inputs
   - Sanitize data
   - Implement proper authentication
   - Use environment variables for secrets

## Common Pitfalls to Avoid

1. **Duplication**
   - Don't create multiple implementations of the same feature
   - Don't copy-paste code without proper abstraction
   - Don't create unnecessary new files

2. **Complexity**
   - Don't over-engineer solutions
   - Don't add features not required for MVP
   - Don't create unnecessary abstractions

3. **Documentation**
   - Don't skip documentation updates
   - Don't leave TODO comments without context
   - Don't ignore error cases

## Getting Help

If you're unsure about any changes:
1. Review this document
2. Check phase2.log for recent changes
3. Consult the MVP requirements
4. Ask for clarification before proceeding 

## Current Technical Debt and Cleanup Tasks

### 1. File Organization and Duplication
- [X] Consolidate product management pages
  - Create and archive directory to store old files instead of deleting them now. 
  - Move `/admin/products/index.astro` to the archive directory and make the primary `/admin/products-dashboard.astro`
  - Create clear separation between sync and management features
  - Remove duplicate "Manage Tags" buttons

- [X] Implement archive directories
  - Create `archive/` directories in all main directories:
    - `/api/admin/products/archive/`
    - `/lib/archive/`
    - `/types/archive/`
  - Move deprecated files to appropriate archive directories
  - Update documentation to reflect new structure
  - Document all archived files in phase2.log

### 2. Database Schema Management
- [X] Clean up schema files
  - Archive old schema files in `/archive`
  - Keep only `/lib/db/product_schema.sql` as source of truth
  - Keep only `/lib/db/inital.sql` as source of truth
  - Document schema evolution in migration history

### 3. Category System
- [ ] Consolidate category management
  - Choose between `printful_category_mapping` and `CORE_CATEGORIES`
  - Standardize category-related API endpoints
  - Create single source of truth for category data

### 4. Field Naming Standards
- [ ] Standardize field naming conventions
  - Use `atrocitee_` prefix for all custom fields
  - Update database schema to reflect new naming
  - Update all TypeScript interfaces and queries

### 5. Tag Management
- [ ] Standardize tag storage
  - Choose between `tags` table and `atrocitee_tags` array
  - Update all tag-related queries and UI components
  - Document tag management strategy

### 6. API Structure
- [ ] Consolidate API endpoints
  - Merge duplicate product endpoints
  - Standardize API response formats
  - Implement consistent error handling

### 7. Type Definitions
- [ ] Centralize type definitions
  - Move all interfaces to `/types` directory
  - Remove duplicate type definitions
  - Update all components to use centralized types

### 8. Sync Logic
- [ ] Centralize sync functionality
  - Consolidate sync logic in `PrintfulProductSync` class
  - Remove duplicate sync code from API endpoints
  - Create clear sync workflow documentation

### 9. Error Handling
- [ ] Standardize error handling
  - Implement consistent error types
  - Standardize Sentry integration
  - Create error handling documentation

### 10. UI Components
- [ ] Create reusable components
  - Extract common UI elements
  - Create component library
  - Update all pages to use shared components

## Implementation Rules
1. Each task must be completed following the Pre-Change Checklist
2. Changes must be documented in phase2.log
3. No breaking changes without proper migration plan
4. All changes must maintain MVP functionality
5. Each task must be tested before marking as complete 