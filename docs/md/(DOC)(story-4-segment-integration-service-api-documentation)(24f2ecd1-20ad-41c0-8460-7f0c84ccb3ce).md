---
id: 24f2ecd1-20ad-41c0-8460-7f0c84ccb3ce
title: STORY-4 Segment Integration Service API Documentation
tags:
  - story-4
  - status/active
  - topic/api
  - issue-4
category: DOC
created_at: '2025-11-28T10:35:20.780Z'
updated_at: '2025-11-28T10:35:20.780Z'
last_reviewed: '2025-11-28T10:35:20.780Z'
links: []
sources: []
abstract: >-
  Complete API documentation for Segment Integration Service: functions, types,
  parameters, return values, and usage
---

# STORY-4 Segment Integration Service API Documentation

**Component:** Segment Integration Service  
**Location:** `src/integration/service.ts`  
**Story:** #4

## Overview

The Segment Integration Service provides functions to send customer data to Segment's Identify API. It handles client initialization, API calls, error handling, and result transformation using a Result type pattern.

## Public API

### Functions

#### `sendCustomerToSegment(payload: SegmentIdentifyPayload): Promise<SegmentIntegrationResult>`

Sends customer data to Segment Identify API using client from environment configuration.

**Parameters:**
- `payload: Readonly<SegmentIdentifyPayload>` - Customer data payload with userId and traits
  - `userId: string` - User identifier (typically email address)
  - `traits: UserTraits` - User traits object (email, name, address)

**Returns:** `Promise<SegmentIntegrationResult>`
- Success: `{ success: true }`
- Error: `{ success: false; error: SegmentError }`

**Behavior:**
1. Gets Segment client from environment (`getSegmentClientFromEnvironment()`)
2. Calls `client.identify()` with userId and traits
3. Calls `client.flush()` to ensure delivery
4. Returns Result type (never throws exceptions)

**Errors:**
- Client initialization errors (missing SEGMENT_WRITE_KEY)
- Segment SDK errors (network, API errors)
- All errors wrapped in `SegmentError` and returned as Result

**Example:**
```typescript
import { sendCustomerToSegment } from './integration/service.js';
import type { SegmentIdentifyPayload } from './transformation/types.js';

const payload: SegmentIdentifyPayload = {
  userId: 'user@example.com',
  traits: {
    email: 'user@example.com',
    name: 'John Doe',
  },
};

const result = await sendCustomerToSegment(payload);

if (result.success) {
  console.log('Customer sent to Segment successfully');
} else {
  console.error('Error:', result.error.message);
}
```

---

#### `sendCustomerToSegmentWithClient(client: SegmentClient, payload: SegmentIdentifyPayload): Promise<SegmentIntegrationResult>`

Sends customer data to Segment Identify API using provided client (for testing and dependency injection).

**Parameters:**
- `client: Readonly<SegmentClient>` - Segment client instance
  - Must implement `identify()`, `flush()`, `closeAndFlush()` methods
- `payload: Readonly<SegmentIdentifyPayload>` - Customer data payload

**Returns:** `Promise<SegmentIntegrationResult>`
- Success: `{ success: true }`
- Error: `{ success: false; error: SegmentError }`

**Behavior:**
1. Calls `client.identify()` with userId and traits
2. Calls `client.flush()` to ensure delivery
3. Returns Result type (never throws exceptions)

**Use Cases:**
- Unit testing with mocked clients
- Dependency injection for custom client instances
- Integration testing with test write keys

**Example:**
```typescript
import { sendCustomerToSegmentWithClient } from './integration/service.js';
import { createSegmentClient } from './segment/client.js';
import type { SegmentIdentifyPayload } from './transformation/types.js';

// Use custom client
const client = createSegmentClient('test-write-key');
const payload: SegmentIdentifyPayload = {
  userId: 'user@example.com',
  traits: { email: 'user@example.com' },
};

const result = await sendCustomerToSegmentWithClient(client, payload);
```

---

## Types

### `SegmentIntegrationResult`

Discriminated union type for operation results.

```typescript
type SegmentIntegrationResult =
  | { success: true }
  | { success: false; error: SegmentError };
```

**Success Case:**
- `success: true` - Operation completed successfully

**Error Case:**
- `success: false` - Operation failed
- `error: SegmentError` - Error details

**Usage:**
```typescript
const result = await sendCustomerToSegment(payload);

if (result.success) {
  // Handle success
} else {
  // Handle error: result.error.message
}
```

---

### `SegmentError`

Error type for Segment integration failures.

```typescript
interface SegmentError {
  readonly message: string;
  readonly code?: string;
}
```

**Properties:**
- `message: string` - Human-readable error message
- `code?: string` - Optional error code (currently not populated)

**Error Sources:**
- Segment SDK errors (network, API errors)
- Client initialization errors (missing write key)
- All errors converted to string message

---

### `SegmentIdentifyPayload`

Input payload type for integration service.

```typescript
interface SegmentIdentifyPayload {
  readonly userId: string;
  readonly traits: UserTraits;
}
```

**Properties:**
- `userId: string` - User identifier (typically email)
- `traits: UserTraits` - User traits (email, name, address)

**Source:** Created by transformation service from Commercetools customer data.

---

### `UserTraits`

User traits object for Segment Identify API.

```typescript
interface UserTraits {
  readonly email: string;
  readonly name?: string;
  readonly address?: Address;
}
```

**Properties:**
- `email: string` - User email (required)
- `name?: string` - User full name (optional)
- `address?: Address` - User address (optional)

---

### `Address`

Address object for user traits.

```typescript
interface Address {
  readonly street?: string;
  readonly city?: string;
  readonly country?: string;
  readonly postalCode?: string;
}
```

**Properties:**
- All fields optional
- Used in `UserTraits.address`

---

## Dependencies

### External Dependencies
- `@segment/analytics-node` - Segment Analytics SDK
- `getSegmentClientFromEnvironment()` - Client factory from `src/segment/client.ts`
- `SegmentIdentifyPayload` - Type from `src/transformation/types.ts`

### Internal Dependencies
- `SegmentClient` - Interface from `src/segment/types.ts`
- `SegmentIntegrationResult` - Type from `src/integration/types.ts`

---

## Error Handling

### Error Handling Pattern

All functions use Result type pattern:
- **No exceptions thrown** - All errors returned as Result values
- **Type-safe error handling** - TypeScript enforces error checking
- **Explicit error propagation** - Errors must be handled explicitly

### Error Types

1. **Client Initialization Errors**
   - Missing `SEGMENT_WRITE_KEY` environment variable
   - Invalid write key format

2. **Segment SDK Errors**
   - Network errors (timeout, connection failed)
   - API errors (400, 401, 500, etc.)
   - SDK internal errors

3. **Error Wrapping**
   - All errors wrapped in `SegmentError`
   - Error messages preserved from original errors
   - Non-Error objects converted to strings

### Error Handling Example

```typescript
const result = await sendCustomerToSegment(payload);

if (!result.success) {
  // TypeScript knows result.error exists here
  console.error('Segment integration failed:', result.error.message);
  
  // Log error for monitoring
  logError('Segment integration error', { error: result.error });
  
  // Return appropriate HTTP status
  return { statusCode: 500, body: 'Internal server error' };
}
```

---

## Best Practices

1. **Always Check Result**
   ```typescript
   const result = await sendCustomerToSegment(payload);
   if (!result.success) {
     // Handle error
   }
   ```

2. **Use Dependency Injection for Testing**
   ```typescript
   // In tests, use sendCustomerToSegmentWithClient with mock client
   const mockClient = createMockSegmentClient();
   await sendCustomerToSegmentWithClient(mockClient, payload);
   ```

3. **Handle Errors Explicitly**
   ```typescript
   // Don't ignore errors
   const result = await sendCustomerToSegment(payload);
   if (!result.success) {
     // Log, retry, or fail appropriately
   }
   ```

4. **Validate Payload Before Sending**
   ```typescript
   // Ensure payload is valid before calling
   if (!payload.userId || !payload.traits.email) {
     // Handle invalid payload
   }
   ```

---

## Environment Configuration

### Required Environment Variables

- `SEGMENT_WRITE_KEY` - Segment write key for API authentication

### Configuration Source

- Environment variable read via `getEnvironmentConfig()`
- Client created via `getSegmentClientFromEnvironment()`
- Missing key throws error (caught and returned as Result)

---

## Thread Safety

- Functions are **stateless** and **thread-safe**
- Each call creates new client instance (via `getSegmentClientFromEnvironment()`)
- No shared state between calls
- Safe for concurrent execution

---

## Performance Considerations

1. **Client Creation**
   - Client created per call (not cached)
   - Consider caching for high-throughput scenarios

2. **Flush Behavior**
   - `flush()` called after each `identify()` call
   - Ensures immediate delivery but may impact performance
   - Consider batching for high-volume scenarios

3. **Error Handling**
   - Result type pattern has minimal overhead
   - Error wrapping preserves original error information

---

## Version History

- **v1.0.0** (Story #4) - Initial implementation
  - `sendCustomerToSegment()` - Environment-based client
  - `sendCustomerToSegmentWithClient()` - Dependency injection
  - Result type pattern for error handling
