# Atrocitee MVP - Phase 1: Foundation Setup

## Overview
Phase 1 focuses on establishing the core technical architecture and development environment for the Atrocitee platform. This foundation phase will set up all the essential infrastructure, tools, and base components needed for subsequent development phases.

## Focus Areas

### 1. Development Environment

**Objective**: Create a consistent, efficient development environment for the team.

**Implementation Tasks**:
- [x] Set up version control repository (GitHub)
- [x] Create development environment documentation
- [x] Configure linting and code formatting tools
- [x] Establish branch strategy and pull request process
- [x] Set up development, staging, and production environments

### 2. Astro Project Setup

**Objective**: Establish the base Astro project with proper configuration.

**Implementation Tasks**:
- [x] Initialize Astro project with TypeScript
- [x] Configure TailwindCSS integration
- [x] Set up project structure (pages, layouts, components)
- [x] Configure static assets handling
- [x] Implement base layouts and UI components
- [x] Create site navigation structure
- [x] Set up error handling components

### 3. Cloudflare Pages Integration

**Objective**: Configure deployment pipeline to Cloudflare Pages.

**Implementation Tasks**:
- [x] Set up Cloudflare Pages project
- [x] Configure build settings and environment variables
- [x] Establish CI/CD pipeline from repository
- [x] Set up custom domain and DNS settings (purchaded and ready but not added to cloudflare yet.)
- [x] Configure preview deployments for pull requests
- [x] Implement environment-specific builds (dev/staging/prod)

**Technical Notes**:
- **React DOM MessageChannel Fix**: Resolved "MessageChannel is not defined" error in Cloudflare's edge environment by configuring Vite to use React DOM's edge-compatible server module:
  ```js
  // In astro.config.mjs
  vite: {
    resolve: {
      alias: {
        'react-dom/server': 'react-dom/server.edge'
      }
    }
  }
  ```
  This approach uses React's official edge-compatible version rather than patching node_modules. The error occurs because Cloudflare Workers/Pages (edge environment) doesn't support the MessageChannel API used by React's default server-side rendering module.
- **Authentication in Staging**: Authentication successfully works in staging and dev environments as of commit 4078327d0e76a07ec6a1ea023d018dd4df830594. This was achieved by properly configuring environment variables in wrangler.toml and implementing the MessageChannel fix.

### 4. Supabase Database Setup

**Objective**: Create database structure and configure Supabase.

**Implementation Tasks**:
- [x] Set up Supabase project
- [x] Design and implement initial database schema
- [x] Create essential tables:
  - [x] users (managed by Supabase Auth)
  - [x] profiles
  - [x] products (with version fields)
  - [x] categories
  - [x] orders
  - [x] charity
- [x] Configure Row Level Security policies
- [x] Set up database backup strategy
- [x] Create database documentation

**Technical Notes**:
- Database schema implemented with proper relationships between tables
- Row Level Security (RLS) policies implemented for all tables
- Admin role permissions configured at the database level using RLS policies
- Security definer function (`is_admin`) implemented to bypass RLS for role checking
- Documentation created to support easy setup and maintenance
- Supabase offers automatic backups depending on the plan. Additionally, a custom backup strategy has been implemented with SQL scripts that handle backup status tracking and proper row-level security policies. The implementation is documented in the backup-scripts directory.

### 5. Authentication Implementation

**Objective**: Implement secure authentication with Supabase Auth.

**Implementation Tasks**:
- [x] Configure Supabase Auth settings
- [x] Implement server-side authentication with `@supabase/ssr`
- [x] Create authentication components:
  - [x] Login form
  - [x] Registration form
  - [x] Password reset flow
- [x] Implement route protection for authenticated pages
- [x] Set up authentication middleware/utility functions
- [x] Configure secure cookie settings
- [x] Implement basic user profile management
- [x] Create admin role and permissions

**Technical Notes**:
- Two-layered approach to role-based access control:
  1. **Database-level**: Supabase RLS policies control data access based on user role
  2. **Application-level**: Middleware controls route access and UI rendering
- Admin middleware checks the user's role using a security definer function
- This avoids the circular dependency of needing admin access to check if a user is admin
- Unauthorized access redirects to a dedicated page with feedback

### 6. Basic Site Structure

**Objective**: Build essential pages and navigation structure.

**Implementation Tasks**:
- [x] Create homepage design and implementation
- [x] Build about/mission page
- [x] Implement static content pages (privacy policy, terms of service)
- [x] Set up contact form/page
- [x] Create basic product listing page structure (without actual products)
- [x] Implement 404 and error pages
- [x] Build header and footer components
- [x] Create responsive menu system

### 7. Monitoring and Error Tracking

**Objective**: Set up systems for monitoring application health and errors.

**Implementation Tasks**:
- [x] Configure Sentry.io integration
- [x] Set up error boundary components
- [x] Implement server-side error logging
- [x] Configure client-side error capturing
- [x] Set up performance monitoring
- [x] Create error reporting documentation

**Technical Notes**:
- Error boundary components created to catch and display React component errors
- Sentry.io SDK has been installed via npm and configured to handle both client and server-side error tracking
- Implementation includes updating the ErrorBoundary component to send exceptions to Sentry
- Performance monitoring configured as part of the Sentry integration
- Sentry authentication token has been added to Cloudflare environment for secure source maps upload
- Comprehensive documentation created in Docs/Sentry-Integration.md
- Verified error capture functionality using test pages and deliberate errors
- Implemented appropriate environment detection for error segmentation
- **Completed**: May 17, 2025

**Implementation Progress**:
- [x] Install Sentry packages (`@sentry/astro`, `@sentry/browser`, and related dependencies)
- [x] Create Sentry configuration in astro.config.mjs
- [x] Set up environment variables for Sentry DSN and environment
- [x] Update ErrorBoundary component to use Sentry for error reporting
- [x] Configure performance monitoring
- [x] Create separate client/server configurations with best practices
- [x] Test error reporting in development environment
- [x] Add Sentry auth token to Cloudflare secrets for production environment
- [x] Verify error capturing in staging environment

### 8. Design System Implementation

**Objective**: Establish a comprehensive design system for the application.

**Implementation Tasks**:
- [x] Create design token definitions (colors, typography, spacing)
- [x] Implement core UI components with Tailwind
- [x] Build component documentation
- [x] Create style guide documentation
- [x] Ensure responsive design across all components
- [x] Implement accessibility features
- [x] Create branded button and form components
- [x] Develop product card components
- [x] Implement charity badge and impact counter components

## Completion Checklist

### Technical Infrastructure
- [x] GitHub repository configured with branch protection
- [x] Development environment documentation completed
- [x] Astro project structure established
- [x] Cloudflare Pages deployment working for all environments
- [x] Supabase database schema implemented
- [x] Row Level Security policies applied to all tables

### Authentication & Security
- [x] User registration working correctly
- [x] Login functionality implemented and tested
- [x] Password reset flow functional
- [x] Protected routes correctly restrict access
- [x] Admin role defined and functional
- [x] Secure authentication cookies configured

### User Interface
- [x] Homepage renders correctly on mobile and desktop
- [x] Static pages implemented with content
- [x] Navigation menu works on all screen sizes
- [x] Site-wide header and footer implemented
- [x] Error pages display correctly
- [x] Design system components implemented and documented
- [x] Product listing page with filterable interface 
- [x] Consistent styling across all pages using style guide

### Monitoring
- [x] Sentry.io capturing client-side errors
- [x] Server errors properly logged
- [x] Basic application health monitoring functioning
- [x] Error notifications properly configured

## Dependencies and Considerations

- **Authentication Strategy**: Early consideration must be given to the authentication approach with Astro's SSR and Supabase Auth
- **Database Schema**: Initial schema design should anticipate future needs while keeping initial implementation simple
- **Cloudflare Configuration**: Environment variables and settings must be properly configured for security
  - Environment variables must be defined in wrangler.toml, not in the Cloudflare dashboard
  - Secret keys should be stored using wrangler secret commands
  - KV namespace must be properly configured for SESSION storage
- **Mobile Responsiveness**: All base UI components must be designed with mobile-first approach
- **Reference Materials**: Astroship theme was used as design reference. The reference repository should not be tracked in Git to avoid Cloudflare deployment issues with submodules. Clone reference locally when needed.
- **Role-Based Access Control**: The application implements a dual-layer approach to access control:
  1. **Database Layer**: Supabase RLS policies control what data users can access based on their role
  2. **Application Layer**: Server-side middleware controls which routes/pages users can access
  This combined approach provides comprehensive security by protecting both data and UI components
  - A `SECURITY DEFINER` function is used to bypass RLS when checking admin roles, avoiding circular permission dependencies

## Success Criteria

Phase 1 will be considered complete when:
1. A developer can clone the repository and start development with clear documentation
2. The application can be successfully deployed to the staging environment
3. Users can register, log in, and access protected pages
4. The database schema supports the basic application needs
5. All completion checklist items are verified as complete 