# Atroci-Tee MVP
## A Platform for Politically-Charged Merchandise with Charitable Impact

### Core Concept
Atroci-Tee is a merchandise platform that turns political outrage and current events awareness into positive action through charitable giving. The name cleverly combines "atrocity" with "tee" to highlight the platform's mission: transforming attention on troubling events into tangible support for affected communities.

### MVP Features

> **Note**: Features are labeled as **[MVP Required]** for essential functionality needed at launch or **[Post-MVP]** for features that can be implemented after initial launch.

#### 1. Atroci-Tee Product Line
- **[MVP Required]** Primary focus on t-shirts only for the MVP
- **[MVP Required]** T-shirts featuring bold designs addressing political controversies and current events
- **[MVP Required]** 3-5 style options with standardized sizing
- **[Post-MVP]** Architecture to support additional product types (hats, mugs, etc.)

#### 2. Cause-Driven Collections
- **[MVP Required]** Curated t-shirt collections tied to specific political issues or events
- **[MVP Required]** Clear labeling of which charity the collection supports
- **[Post-MVP]** Limited-time "Rapid Response" collections for breaking news
- **[Post-MVP]** Support for multiple causes and charities

#### 3. Charitable Giving Integration
- **[MVP Required]** Integration with one vetted charity partner at launch
- **[MVP Required]** Fixed donation amount per product (10%-20%)
- **[MVP Required]** Transparent display of donation amount at checkout
- **[Post-MVP]** Expanded charity partner options
- **[Post-MVP]** More sophisticated donation calculation system

#### 4. Transparency Dashboard
- **[MVP Required]** Basic "Impact Tracker" showing total donations
- **[MVP Required]** Simple visualization of giving history
- **[Post-MVP]** Stories and updates from the supported organization
- **[Post-MVP]** Detailed verification documentation for donations
- **[Post-MVP]** Enhanced data visualization and reporting

#### 5. Payment Processing
- **[MVP Required]** Stripe as the exclusive payment processor
- **[MVP Required]** Credit/debit card support
- **[MVP Required]** Secure checkout process
- **[Post-MVP]** Apple Pay and Google Pay integration
- **[Post-MVP]** Support for multiple currencies

#### 6. E-commerce Fundamentals
- **[MVP Required]** Built on Astro framework
  - Static generation for content pages
  - Server endpoints for API functionality
  - Islands architecture for interactive components
  - HTTP-only cookies for secure client identification
- **[MVP Required]** Hosted on Cloudflare Pages with Git repository integration
  - Automatic deployments through CI/CD pipeline
  - Enhanced security through Cloudflare
  - Environment variables for secure configuration
- **[MVP Required]** Supabase as the database solution
  - Basic Row Level Security for data protection
  - Server-side data access with protected credentials
- **[MVP Required]** Nanostores for client-side UI state management (cart, UI preferences)
- **[MVP Required]** TailwindCSS for UI development
- **[MVP Required]** Sentry.io (free tier) for error tracking of critical issues
- **[MVP Required]** Mobile-responsive storefront 
- **[MVP Required]** Simple account creation/management
- **[MVP Required]** Basic order tracking

#### 7. Production & Fulfillment (Printful Integration)
- **[MVP Required]** Core Printful API integration
  - Product catalog synchronization from Printful to Atrocitee
  - Order submission to Printful for fulfillment
  - Shipping calculations
  - Order status tracking
  
  > **Note**: For MVP, products will be created by administrators on the Printful platform first, then imported/synced to the Atrocitee site. A simplified webhook handling approach will be implemented for basic order status updates, while more complex webhook processing will be addressed post-MVP.
  >
  > **Product Versioning Strategy**:
  > - **Synchronization**: Regular automated checks to identify changes in Printful products
  > - **Version Handling**: Flag & Review approach - changes are identified and presented to admin for approval
  >   - Critical changes (price, availability) are flagged as high priority
  >   - Content changes (images, descriptions) are flagged as standard priority
  >   - Admin interface will show side-by-side comparison of current vs. updated product data
  >   - Admins can selectively apply specific changes or update everything at once
  > - **Data Integrity**: Each product includes a version number and last_updated timestamp
  > - **Order Consistency**: Product data is captured at order time to ensure fulfillment accuracy
  >
  > **Order Snapshot Approach**:
  > - Complete product data is captured at the moment of purchase
  > - Printful fulfillment uses this snapshot rather than current product data
  > - Ensures customers receive exactly what they ordered regardless of product updates

- **[MVP Required]** Print-on-demand workflow for t-shirts
- **[Post-MVP]** Advanced Printful features
  - Return/exchange processing
  - Quality control process
  - Complex product variants

#### 8. Local Category Management
- **[MVP Required]** Basic category management for t-shirts
- **[MVP Required]** Simple filtering and display by category
- **[MVP Required]** Printful category mapping to Atrocitee categories
  - Synchronization of Printful categories to internal system
  - Admin interface for mapping Printful categories to Atrocitee categories
  - Automatic category assignment for newly imported products
- **[MVP Required]** Tag-based product organization for more granular filtering
  - Tags to complement the broader category system
  - Ability to filter products by multiple tags
  - Admin interface for tag management
- **[Post-MVP]** Advanced taxonomy and categorization features
- **[Post-MVP]** Enhanced product filtering and search

#### 9. Authentication & User Management
- **[MVP Required]** Supabase Auth integration with Astro
  - Email/password authentication
  - JWT token validation on server endpoints
  - Secure cookie settings
- **[MVP Required]** Server-side route protection
  - Implementation using `@supabase/ssr` for SSR pages
  - Server-side JWT verification
  
  > **Note**: All pages requiring authentication will be implemented as SSR pages, not static pages. This ensures server-side verification of authentication state which cannot be bypassed by clients.

- **[MVP Required]** Simple role system (admin/user)
- **[MVP Required]** Basic password reset functionality
- **[Post-MVP]** Social login options (Google, etc.)
- **[Post-MVP]** Multi-factor authentication for admin accounts
- **[Post-MVP]** Enhanced role-based permissions
- **[Post-MVP]** Advanced session management features

#### 10. Database Architecture
- **[MVP Required]** Streamlined Supabase PostgreSQL database with essential tables:
  - `users` - User accounts (managed by Supabase Auth)
  - `profiles` - Basic profile information
  - `products` - Products with core variant data included and Printful reference IDs
    - Will include Atrocitee-specific fields (donation amount, tags, published status)
    - Will include versioning fields (version number, last_synced_at)
    - Will track modification status (unmodified, pending_review, admin_modified)
  - `product_changes` - Tracks identified changes from Printful for admin review
  - `categories` - Simple product categories
  - `orders` - Order information
    - Will include calculated donation amounts per order item
    - Will store complete product snapshot data at time of purchase:
      - Full Printful product specifications for fulfillment
      - All Atrocitee-specific metadata (donation amount, etc.)
      - Pricing and discount information as applied
      - Product details as shown to customer at purchase time
    - Will use structured JSON format for flexible data storage
    - Will retain this data permanently for order history integrity
  - `charity` - Single charity information
  - `processed_webhooks` - Basic webhook tracking
- **[MVP Required]** Simple RLS policies for data protection
- **[MVP Required]** Basic relationships between tables

  > **Note**: The initial database schema will be designed with future separation in mind (particularly for products and variants), using JSON fields where appropriate to minimize migration complexity when tables are split in post-MVP phases.

- **[Post-MVP]** Expanded schema with specialized tables:
  - `product_variants` as separate table
  - `product_images` as separate table
  - `admin_users` with advanced permissions
  - `audit_logs` for detailed tracking

#### 11. Frontend Implementation with Astro + TailwindCSS
- **[MVP Required]** Focused Astro Architecture
  - File-based routing in `/src/pages` directory
  - Server endpoints for API functionality
  - Static generation with targeted React islands for interactivity
  - Content collections for structured content
- **[MVP Required]** Content Architecture & Page Types
  - Clear separation between static and dynamic pages
  - SSR used only for pages requiring authentication
  - API endpoints for authenticated Supabase operations
- **[MVP Required]** Essential Custom Components
  - `ProductCard` - For merchandise display
  - `QuickCart` - For checkout
  - Basic charitable impact visualization
- **[MVP Required]** Simple State Management
  - Static data: Handled at build time
  - Dynamic data: Fetched via server endpoints with authentication
  - UI state: Managed with Nanostores
  - Form state: Standard HTML forms
- **[Post-MVP]** Enhanced user interface components
- **[Post-MVP]** Advanced data visualization components
- **[Post-MVP]** More sophisticated state management patterns

#### 12. Security Architecture
- **[MVP Required]** Authentication Security
  - Supabase Auth with JWT-based authentication
  - Secure cookie settings
  - Basic rate limiting
  
  > **Note**: Standard error responses will be implemented for rate-limited requests, with clear user feedback and appropriate HTTP status codes (429 Too Many Requests). This will ensure a consistent error handling approach across the application.

- **[MVP Required]** API Security
  - Server-side only API keys
  - Authentication for sensitive endpoints
  - Basic request validation
  - Retry policies for critical external API calls
    - Exponential backoff for failed Printful API calls
    - Idempotent operations for payment processing
    - Fallback mechanisms for temporary outages
- **[MVP Required]** Payment Security
  - PCI compliance through Stripe Elements
  - No storage of card details
- **[MVP Required]** Error Tracking
  - Sentry.io integration for critical errors:
    - Client-side JavaScript errors
    - Server-side endpoint errors
    - SSR failures
  - Basic error components for common error states
- **[Post-MVP]** Advanced security features:
  - Comprehensive audit logging
  - Field-level encryption for sensitive data
  - Advanced CSRF protection
  - Webhook signature verification
  - IP allowlisting

### Authentication Routes

**[MVP Required]** The application implements these core authentication routes:
- `/login` - User authentication with email/password
- `/register` - New user registration
- `/reset-password` - Basic password recovery
- `/account` - Protected user profile management
- `/logout` - Session termination

### Charitable Partner Option

**[MVP Required]** The Giving Block
- Single charity integration for MVP with architecture supporting more in the future

### Administrative Requirements

**[MVP Required]** Basic Admin Functionality:
- Simple product/category management
  - Import products from Printful
  - Add Atrocitee-specific metadata (donation amount, tags, etc.)
  - Control published/unpublished status
  - Review and apply product changes from Printful
    - Side-by-side comparison of changed fields
    - Selective application of specific updates
    - Bulk update options for multiple products
- Order management dashboard
- Basic user management
- Printful product synchronization
- **Real-time sales and charity tracking**
  - Dashboard showing current sales metrics
  - Calculated donation amounts per charity based on sales
  - Monthly donation tracking with pending and completed donations
  - Simple visualizations for sales and donation metrics

**[Post-MVP]** Advanced Admin Features:
- Content moderation system
- Sophisticated reporting and analytics
- Advanced user permissions management
- Campaign performance tracking

### Implementation Phases

To ensure successful delivery of the MVP, development will proceed in three focused phases:

#### Phase 1: Core Platform (Weeks 1-4)
- Setup Astro project with basic structure
- Implement TailwindCSS
- Configure Cloudflare Pages with Git integration
- Implement Supabase database with essential tables
- Implement Supabase Auth with email/password authentication
- Create basic RLS policies
- Develop standardized auth pattern using `@supabase/ssr`
- Create route structure (static pages and server endpoints)
- Build essential UI components and storefront
- Implement shopping cart functionality with Nanostores

  > **Note**: The initial shopping cart implementation will focus on state management and user interface without payment processing integration. This cart will store items and quantities but checkout functionality will be completed in Phase 2 when Stripe is integrated.

#### Phase 2: E-commerce & Integration (Weeks 5-8)
- Implement core Printful API integration
- Create product catalog synchronization
  - Initial import from Printful
  - Regular sync checks for product changes
  - Admin interface for change management
- Develop t-shirt templates and categories
- Integrate Stripe for payment processing
- Build checkout process
- Implement order management
- Connect order fulfillment with Printful
- Build basic admin interface
- **Implement basic order reporting for testing and validation**
- Implement simple donation tracking
- Build checkout process
  - Implement product data snapshot mechanism at order creation
  - Ensure donation amounts are captured at time of purchase
  - Store complete product details needed for Printful fulfillment
- Implement order management
  - Use snapshot data for order display and fulfillment
  - Maintain data consistency between orders and Printful

#### Phase 3: Launch Preparation (Weeks 9-12)
- Integrate with charity partner
- Build transparency dashboard
- **Implement admin sales and donation tracking dashboard**
- Implement security hardening:
  - Content Security Policy
  - Additional rate limiting
  - Security scanning
- Conduct comprehensive testing
- Fix critical issues
- Finalize documentation
- Launch MVP with initial collections

This streamlined approach focuses on delivering essential functionality for the MVP launch while establishing a foundation that can be expanded upon post-launch.

#
