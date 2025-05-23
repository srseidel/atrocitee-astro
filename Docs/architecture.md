# Atrocitee-Astro Architecture

## Directory Structure

### Core Directories

```
src/
├── content/           # Content collections
├── components/        # UI components
├── pages/            # Routes and API endpoints
├── layouts/          # Layout templates
├── lib/              # Third-party integrations
├── utils/            # Utility functions
└── types/            # TypeScript definitions
```

### Content Organization
- Use content collections for static content
- Store content in markdown files
- Define content types in `src/content/config.ts`
- Follow Astro's content collection patterns

### Component Organization
```
src/components/
├── common/           # Reusable components
│   ├── Button.astro
│   ├── Card.astro
│   └── Input.astro
├── features/         # Feature-specific components
│   ├── auth/
│   ├── products/
│   └── admin/
└── layouts/          # Layout components
    ├── Header.astro
    └── Footer.astro
```

### API Organization
```
src/pages/api/
├── v1/              # Versioned API
│   ├── admin/
│   ├── products/
│   └── tags/
└── debug/           # Debug endpoints
```

### Layout Structure
```
src/layouts/
├── BaseLayout.astro    # Base layout
├── MainLayout.astro    # Main site layout
└── AdminLayout.astro   # Admin layout
```

### Utils and Lib Organization
```
src/
├── utils/           # Pure utilities
│   ├── auth.ts
│   └── format.ts
├── lib/             # Integrations
│   ├── supabase/
│   └── printful/
└── config/          # Configuration
    └── constants.ts
```

### Testing Structure
```
tests/
├── e2e/            # End-to-end tests
├── integration/    # Integration tests
└── unit/           # Unit tests
```

### Public Assets
```
public/
├── images/
├── fonts/
└── icons/
```

### Types Organization
```
src/types/
├── database.ts     # Database types
├── api.ts          # API types
└── common.ts       # Common types
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
- Version all API endpoints
- Group by feature
- Use TypeScript for types
- Follow REST conventions
- Document endpoints

### 4. Layout Development
- Use base layout for common structure
- Extend for specific layouts
- Keep layouts simple
- Use slots for content

### 5. Utility Development
- Keep utilities pure
- Document functions
- Add type definitions
- Write tests

### 6. Testing
- Write tests for all features
- Use appropriate test types
- Maintain coverage
- Document test cases

### 7. Asset Management
- Organize by type
- Optimize assets
- Use appropriate formats
- Document usage

### 8. Type Management
- Define types in appropriate files
- Use TypeScript features
- Document types
- Keep types DRY

## Best Practices

### 1. Code Organization
- Follow directory structure
- Keep files focused
- Use appropriate locations
- Document organization

### 2. Development Workflow
- Create feature branches
- Write tests first
- Document changes
- Review code

### 3. Performance
- Optimize assets
- Use appropriate caching
- Monitor performance
- Document optimizations

### 4. Security
- Follow security best practices
- Validate input
- Handle errors
- Document security

### 5. Documentation
- Keep docs updated
- Document changes
- Use examples
- Follow conventions

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