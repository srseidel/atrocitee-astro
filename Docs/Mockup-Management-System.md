# Mockup Management System

## Overview

The Mockup Management System is a custom-built solution for handling product mockup images in the Atrocitee e-commerce platform. It provides a streamlined workflow for generating, assigning, processing, and displaying product mockups.

## Key Components

1. **MockupModal.astro**: Client-side component for managing mockups
2. **mockup.ts**: Unified API endpoint for all mockup operations
3. **optimize-images.js**: Script for optimizing and converting mockup images
4. **Directory Structure**: Organized file system for mockup storage and serving

## Workflow

### 1. Mockup Generation

Mockups are generated manually using the Printful platform:

1. Create product on Printful
2. Generate mockups for each variant and view
3. Download mockups to local machine
4. Place mockups in `src/assets/mockups-new` directory

### 2. Mockup Assignment

Mockups are assigned to product variants using the admin interface:

1. Navigate to product admin page
2. Open mockup modal for a specific variant
3. View available mockups from `mockups-new` directory
4. Select mockups to assign to the variant
5. System automatically suggests appropriate views based on filenames
6. Assign mockups to specific views (front, back, left, right, etc.)

### 3. Mockup Processing

Once mockups are assigned, they are processed for optimization:

1. Click "Save & Process" in the mockup modal
2. System copies mockups from `mockups-new` to `src/assets/mockups/{productSlug}/`
3. Original files in `mockups-new` are deleted after successful copy
4. Optimization script processes images:
   - Resizes images if necessary
   - Optimizes PNG/JPG files
   - Creates WebP versions for better performance
   - Saves optimized files to `public/images/mockups/{productSlug}/`
5. Database is updated with mockup settings and file paths

## Technical Implementation

### Directory Structure

```
src/
  assets/
    mockups-new/           # Temporary storage for newly downloaded mockups
    mockups/               # Source mockups organized by product slug
      product-slug-1/
      product-slug-2/
public/
  images/
    mockups/              # Optimized mockups served to users
      product-slug-1/
      product-slug-2/
```

### File Naming Convention

Mockup files follow a standardized naming convention:

```
{product-slug}-{color}-{size}-{view}.{extension}
```

Example: `atrocitee-classic-tee-black-xl-front.png`

### Database Schema

Mockup settings are stored in the `product_variants` table:

```json
{
  "mockup_settings": {
    "views": [
      {
        "view": "front",
        "filename": "product-slug-color-size-front",
        "url": "/images/mockups/product-slug/product-slug-color-size-front.png",
        "webpUrl": "/images/mockups/product-slug/product-slug-color-size-front.webp"
      },
      {
        "view": "back",
        "filename": "product-slug-color-size-back",
        "url": "/images/mockups/product-slug/product-slug-color-size-back.png",
        "webpUrl": "/images/mockups/product-slug/product-slug-color-size-back.webp"
      }
    ]
  }
}
```

### API Endpoints

The unified mockup.ts API endpoint supports the following actions:

1. **info**: Get mockup information for a variant
   - `GET /api/v1/admin/products/mockup?action=info&variantId={id}`

2. **available**: Get available mockups for a product
   - `GET /api/v1/admin/products/mockup?action=available&product={slug}`

3. **assign**: Assign a mockup to a variant
   - `POST /api/v1/admin/products/mockup?action=assign`
   - Body: `{ mockupFile, variantId, productSlug, view }`

4. **remove**: Remove a mockup from a variant
   - `POST /api/v1/admin/products/mockup?action=remove`
   - Body: `{ variantId, view, mockupFilename }` or `{ variantId, removeAll: true }`

5. **process**: Process mockups for optimization
   - `POST /api/v1/admin/products/mockup?action=process`
   - Body: `{ productSlug, variantId, mockupFiles }`

## Important Notes

1. **Git Commit Reference**: The working mockup assignment code is in commit `10dfd4e`
 (main -> main). Reference this commit if future chan87e8706..ges break functionality.

2. **File Cleanup**: Original mockup files are automatically removed from `mockups-new` after successful processing to prevent duplication.

3. **Error Handling**: The system includes comprehensive error handling and logging to diagnose and recover from issues.

4. **WebP Support**: All mockups are automatically converted to WebP format for better performance, with PNG/JPG fallbacks for older browsers.

## Future Improvements

1. Bulk mockup assignment capabilities
2. Mockup preview functionality
3. Drag-and-drop interface for mockup assignment
4. Automated mockup generation integration
5. Mockup analytics and tracking

## Troubleshooting

### Common Issues

1. **Mockups not showing in "Available Mockups"**:
   - Ensure files are in the correct directory (`src/assets/mockups-new`)
   - Check file naming conventions
   - Verify file formats (PNG, JPG, WEBP)

2. **"Save & Process" fails**:
   - Check console for error messages
   - Verify file permissions
   - Ensure directories are writable

3. **Mockups not visible on frontend**:
   - Check URL paths in mockup_settings
   - Verify files exist in public directory
   - Clear browser cache

### Debugging

The system includes extensive logging:
- Client-side logs in browser console
- Server-side logs in terminal output
- File operation logs for tracking file movement and processing 