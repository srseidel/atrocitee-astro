# Atrocitee Development Architecture

## Core Architecture Rules

### File Organization
```
/admin/products/
├── index.astro (main product listing)
├── configure/[id].astro (product configuration)
├── tags.astro (tag management)
└── dashboard.astro (Printful sync & changes)

/api/admin/products/
├── [id].ts (product CRUD)
├── sync.ts (Printful sync)
├── tags.ts (tag management)
└── changes.ts (pending changes)
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

## Pre-Change Checklist

Before making any changes, developers should:

1. **Review Existing Code**
   - Check for similar functionality
   - Understand current implementation
   - Identify affected components

2. **Verify MVP Alignment**
   - Does the change support MVP requirements?
   - Is it necessary for the current phase?
   - Does it maintain simplicity?

3. **Check for Breaking Changes**
   - Will it affect existing features?
   - Are there dependencies to consider?
   - Is backward compatibility maintained?

4. **Documentation**
   - Update relevant documentation
   - Add comments for complex logic
   - Update phase2.log with changes

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