# Printful Integration

## Overview

This document outlines the integration between Atrocitee and Printful's print-on-demand service. Printful handles product fulfillment, including printing, manufacturing, and shipping. Our integration focuses on product synchronization, inventory management, and order processing.

## Architecture

The integration consists of several key components:

1. **API Client**: A robust TypeScript client for Printful's REST API with error handling and retry logic
2. **Service Layer**: Business logic abstraction for Printful operations
3. **Admin Interface**: Tools for managing Printful products within Atrocitee
4. **Mock Implementation**: Testing utilities that work without a live API key

## Authentication

Authentication with the Printful API uses an API key, which should be stored in environment variables:

```
PRINTFUL_API_KEY=your_api_key_here
```

The client uses bearer token authentication in the request headers.

## Implementation Details

### API Client

The API client (`src/lib/printful/api-client.ts`) handles HTTP requests to the Printful API with the following features:

- Bearer token authentication
- Error handling with custom error types
- Automatic retry for failed requests with exponential backoff
- Comprehensive logging with Sentry error tracking
- Type-safe response handling

```typescript
// Example API client usage:
const client = new PrintfulClient();
const storeProducts = await client.getSyncProducts();
```

### Service Layer

The service layer (`src/lib/printful/service.ts`) provides business logic for common Printful operations:

- Product retrieval and filtering
- Mock client for development and testing without API keys
- Error handling and proper logging
- Singleton instance management

```typescript
// Example service usage:
const printfulService = PrintfulService.getInstance();
const products = await printfulService.getAllProducts();
const tshirts = await printfulService.getTshirtProducts();
```

### Admin Interface

A dedicated admin interface (`/admin/printful-test`) provides:

- API connection testing
- Store product visualization
- Catalog product browsing
- Mock data testing capability
- Error diagnostics

### Error Handling

The integration implements comprehensive error handling:

1. Missing API Key Detection
2. Network Error Handling
3. Authentication Errors
4. Response Validation
5. Rate Limiting
6. Integration with Sentry

### Mock Implementation

For development and testing, a mock implementation is provided:

- Mock client returns realistic sample data
- Simulates actual API response structure
- Works without a valid API key
- Allows frontend testing without API calls

## Usage Examples

### Testing the API Connection

```typescript
// Test API connection with real data
const printfulService = PrintfulService.getInstance();
const products = await printfulService.getAllProducts();

// Test with mock data
const mockService = PrintfulService.getInstance(true); // true = use mock client
const mockProducts = await mockService.getAllProducts();
```

### Displaying Products

Products can be displayed using the dedicated admin interface or by building custom interfaces that consume the service layer.

## Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PRINTFUL_API_KEY | API key for Printful authentication | Yes |

## Implementation Status

- [x] API Client implementation
- [x] Service Layer implementation
- [x] Admin testing interface
- [x] Mock data implementation
- [x] Error handling and logging
- [ ] Product synchronization
- [ ] Order submission
- [ ] Webhook integration
- [ ] Inventory tracking

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure the PRINTFUL_API_KEY is set correctly in your .env file
2. **Missing Products**: Verify your Printful store has synchronized products
3. **API Limits**: Be aware of Printful's rate limits during heavy usage

## Next Steps

1. Implement product synchronization to maintain database with Printful products
2. Build category management for organizing Printful products
3. Develop order submission flow to Printful
4. Create webhook endpoints for Printful notifications