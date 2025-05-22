# Product Synchronization Implementation

This document outlines the implementation of the Printful product synchronization system, which is part of Phase 2 of the Atrocitee MVP.

## Overview

The product synchronization system enables automatic importing and updating of products from Printful to the Atrocitee database. Since products are created directly on the Printful website, this system focuses on syncing those products back to our database.

The system includes:
1. Database tables for storing products, variants, and tracking changes
2. TypeScript types for type-safe interactions with these tables
3. A service layer for synchronizing products
4. API endpoints for manual and scheduled synchronization
5. An admin interface for reviewing and managing product changes

## Database Schema

The system uses the following database tables:

1. `products` - Stores core product information
   - Printful fields: `printful_id`, `printful_external_id`, `printful_synced`
   - Atrocitee fields: `atrocitee_active`, `atrocitee_featured`, `atrocitee_tags`, `atrocitee_metadata`, `atrocitee_base_price`, `atrocitee_donation_amount`
   - Shared fields: `name`, `description`, `slug`, `thumbnail_url`

2. `product_variants` - Stores variant information
   - Printful fields: `printful_id`, `printful_external_id`, `printful_product_id`, `printful_synced`
   - Variant details: `name`, `sku`, `retail_price`, `currency`, `options`, `files`
   - Inventory: `in_stock`, `stock_level`

3. `printful_sync_history` - Tracks synchronization operations
   - Sync metadata: `sync_type`, `status`, `message`
   - Statistics: `products_synced`, `products_failed`
   - Timing: `started_at`, `completed_at`

4. `printful_product_changes` - Records changes detected during synchronization
   - Change details: `change_type`, `change_severity`, `field_name`, `old_value`, `new_value`
   - Review info: `status`, `reviewed_by`, `reviewed_at`

5. `categories` - Stores product categories
   - Basic info: `name`, `slug`, `description`
   - Status: `active`
   - Hierarchy: `parent_id`

6. `printful_category_mapping` - Maps Printful categories to Atrocitee categories
   - Printful info: `printful_category_id`, `printful_category_name`
   - Mapping: `atrocitee_category_id`
   - Status: `is_active`

The schema SQL is available in `src/lib/db/migrations/printful_sync_schema.sql`.

## Implementation Components

### Data Types

Types are defined in:
- `src/types/printful/index.ts` - Printful API response types
- `src/types/database.ts` - Database entity types

### Service Layer

The core functionality is implemented in:

1. `src/lib/printful/service.ts` - Printful API client
   - Handles API authentication
   - Provides methods for fetching products and variants
   - Uses the following Printful API endpoints:
     - `GET /sync/products` - Get all products
     - `GET /sync/products/{id}` - Get specific product
     - `GET /sync/variants/{id}` - Get specific variant

2. `src/lib/printful/product-sync.ts` - Main synchronization service
   - Handles product import and updates
   - Manages variant synchronization
   - Tracks changes and sync history
   - Provides category mapping functionality

### API Endpoints

1. **Manual Sync**: `src/pages/api/printful/sync-products.ts`
   - Triggers immediate synchronization
   - Requires admin authentication
   - Returns sync results and statistics

2. **Product Changes**: `src/pages/api/printful/product-changes.ts`
   - Retrieves and manages product changes
   - Provides endpoints for approving/rejecting changes
   - Includes filtering by status and severity

3. **Scheduled Sync**: `src/pages/api/cron/sync-printful-products.ts`
   - Endpoint for cron jobs to trigger synchronization
   - Includes throttling to prevent too-frequent syncs
   - Supports webhook notifications

### Admin Interface

The admin interface for product synchronization is available at `/admin/products/sync`. It provides:

1. Manual synchronization controls
2. Sync history display with filtering
3. Review interface for pending product changes
4. Category mapping management
5. Change approval/rejection workflow

## Change Management System

The product synchronization implements a "Flag & Review" versioning system:

1. **Change Detection**
   - Critical changes: name, thumbnail, price
   - Standard changes: external ID, category
   - Minor changes: tags, metadata, ignored status

2. **Change Classification**
   - Type: price, inventory, metadata, image, variant, other
   - Severity: critical, standard, minor
   - Field-specific tracking

3. **Review Queue**
   - Changes are placed in a review queue for admin approval
   - Filtering by type and severity
   - Batch approval/rejection support

4. **Approval/Rejection**
   - Admins can approve or reject changes
   - Changes are tracked with reviewer information
   - Rejected changes can be re-reviewed

## Setting Up Scheduled Synchronization

### Environment Variables

Required environment variables:
```
PRINTFUL_API_KEY=your-printful-api-key
PRINTFUL_STORE_ID=your-store-id
CRON_SECRET=your-secure-random-token
```

### Cron Job Configuration

For Cloudflare Pages, set up a scheduled function in your `functions/_middleware.js` file:

```javascript
export async function onSchedule(event) {
  // Your sync logic here
}
```

## Usage Examples

### Manual Synchronization

```typescript
import PrintfulService from '../lib/printful/service';
import PrintfulProductSync from '../lib/printful/product-sync';

const printfulService = PrintfulService.getInstance();
const productSync = new PrintfulProductSync(supabase, printfulService);

// Start the sync
const result = await productSync.syncAllProducts();
console.log(`Synced ${result.syncedCount} products, ${result.failedCount} failed`);
```

### Reviewing Changes

```typescript
// Get pending changes
const changes = await productSync.getProductChanges('pending_review');

// Review a change
await productSync.reviewProductChange(
  changeId,
  'approved',
  userId
);
```

### Category Mapping

```typescript
// Get category mapping
const mapping = await productSync.getCategoryMapping();

// Update a mapping
await productSync.updateCategoryMapping(
  printfulCategoryId,
  atrociteeCategoryId,
  true
);
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
   - Verify product IDs

3. **Change Review Not Working**
   - Verify admin permissions
   - Check browser console for errors
   - Verify change status in database

### Logs and Monitoring

- Check server logs for detailed information
- Error tracking is integrated with Sentry
- Synchronization history is stored in the `printful_sync_history` table
- Change tracking is available in the `printful_product_changes` table

### Performance Considerations

1. **API Rate Limits**
   - Printful API has a general rate limit of 120 API calls per minute
   - Implement proper throttling
   - Use batch operations when possible

2. **Database Optimization**
   - Use appropriate indexes
   - Implement pagination for large datasets
   - Cache frequently accessed data

3. **Error Recovery**
   - Implement retry logic for failed operations
   - Maintain sync state for recovery
   - Log detailed error information 