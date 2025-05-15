# Product Synchronization Implementation

This document outlines the implementation of the Printful product synchronization system, which is part of Phase 2 of the Atrocitee MVP.

## Overview

The product synchronization system enables automatic importing and updating of products from Printful to the Atrocitee database. It includes:

1. Database tables for storing products, variants, and tracking changes
2. TypeScript types for type-safe interactions with these tables
3. A service layer for synchronizing products
4. API endpoints for manual and scheduled synchronization
5. An admin interface for reviewing and managing product changes

## Database Schema

The system uses the following database tables:

1. `products` - Stores core product information
2. `product_variants` - Stores variant information (e.g., sizes, colors)
3. `printful_sync_history` - Tracks synchronization operations
4. `printful_product_changes` - Records changes detected during synchronization
5. `tags` - Stores product tags for categorization
6. `product_tags` - Maps products to tags (many-to-many)
7. `product_categories` - Maps products to categories (many-to-many)

The schema SQL is available in `Docs/Printful-Product-Schema-SQL.md`.

## Implementation Components

### Data Types

Types are defined in `src/types/database.ts` for database entities and in `src/types/printful/index.ts` for Printful API responses.

### Service Layer

The core functionality is implemented in:

1. `src/lib/printful/product-sync.ts` - Main service for product synchronization
2. `src/lib/printful/scheduled-sync.ts` - Helpers for scheduled synchronization

### API Endpoints

1. **Manual Sync**: `src/pages/api/printful/sync-products.ts`
   - Triggers immediate synchronization
   - Requires admin authentication

2. **Product Changes**: `src/pages/api/printful/product-changes.ts`
   - Retrieves and manages product changes
   - Provides endpoints for approving/rejecting changes

3. **Scheduled Sync**: `src/pages/api/cron/sync-printful-products.ts`
   - Endpoint for cron jobs to trigger synchronization
   - Includes throttling to prevent too-frequent syncs

### Admin Interface

The admin interface for product synchronization is available at `/admin/products/sync`. It provides:

1. Manual synchronization controls
2. Sync history display
3. Review interface for pending product changes

## Change Management System

The product synchronization implements a "Flag & Review" versioning system:

1. **Change Detection**: All changes to products are detected during synchronization
2. **Change Classification**: Changes are classified by type (price, inventory, metadata, etc.) and severity (critical, standard, minor)
3. **Review Queue**: Changes are placed in a review queue for admin approval
4. **Approval/Rejection**: Admins can approve or reject changes through the admin interface

## Setting Up Scheduled Synchronization

### Environment Variables

Add a secret token for the cron job API endpoint:

```
CRON_SECRET=your-secure-random-token
```

### Cron Job Configuration

Set up a cron job on your server to call the synchronization endpoint:

```bash
# Run the job every 12 hours (at 3 AM and 3 PM)
0 3,15 * * * curl -X POST -H "Authorization: Bearer your-secure-random-token" https://yourdomain.com/api/cron/sync-printful-products
```

For Cloudflare Pages, set up a scheduled function in your `functions/_middleware.js` file.

## Usage Examples

### Manual Synchronization

1. Navigate to `/admin/products/sync` in the admin interface
2. Click "Start Synchronization"
3. The system will fetch products from Printful and import/update them in the database
4. Review the changes on the same page

### Reviewing Changes

1. Changes are listed in the "Pending Product Changes" section
2. Review each change and click "Approve" or "Reject"
3. Approved changes will be applied, rejected changes will be ignored

### Programmatic Access

To trigger synchronization programmatically:

```typescript
import PrintfulProductSync from '../lib/printful/product-sync';

// With cookies from a request context
const productSync = new PrintfulProductSync(cookies);

// Start the sync
const { success, failed, syncId } = await productSync.syncAllProducts('manual');
```

## Troubleshooting

### Common Issues

1. **Synchronization Fails**
   - Check Printful API credentials
   - Verify database connection
   - Check Sentry for error reports

2. **No Products Imported**
   - Ensure your Printful store has products
   - Check API permissions

3. **Change Review Not Working**
   - Verify admin permissions
   - Check browser console for errors

### Logs and Monitoring

- Check server logs for detailed information
- Error tracking is integrated with Sentry
- Synchronization history is stored in the `printful_sync_history` table 