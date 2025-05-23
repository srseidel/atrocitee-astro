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

## Phase 5: Testing Migration

### 1. Setup Test Structure
```bash
# Create test directories
mkdir -p tests/{e2e,integration,unit}

# Move test files
mv src/pages/test-* tests/integration/
mv src/pages/api/debug/* tests/integration/
```

### 2. Update Test Configuration
- Setup test runners
- Configure test environment
- Add test utilities

## Phase 6: Asset Migration

### 1. Reorganize Assets
```bash
# Create asset directories
mkdir -p public/{images,fonts,icons}

# Move existing assets
mv public/*.{png,jpg,svg} public/images/
mv public/*.{woff,woff2,ttf} public/fonts/
mv public/*.ico public/icons/
```

### 2. Update Asset References
- Update image paths
- Update font references
- Update icon imports

## Phase 7: Type Migration

### 1. Reorganize Types
```bash
# Create type structure
mkdir -p src/types/{database,api,common}

# Move type definitions
mv src/types/database.ts src/types/database/
mv src/types/api.ts src/types/api/
mv src/types/common.ts src/types/common/
```

### 2. Update Type References
- Update type imports
- Fix type definitions
- Add missing types

## Phase 8: Documentation Update

### 1. Update Architecture Documentation
- Add new structure rules
- Update component guidelines
- Add content collection documentation

### 2. Update Development Guidelines
- Add migration notes
- Update coding standards
- Add new best practices

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