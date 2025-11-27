---
id: 3088f606-a3c6-4af6-9ecd-8b0aca4ef1dc
title: 'STORY-1 API Documentation: Segment Client'
tags:
  - status/implemented
  - issue-1
  - topic/api
  - documentation
  - segment-client
category: DOC
created_at: '2025-11-27T12:51:18.991Z'
updated_at: '2025-11-27T12:55:23.490Z'
last_reviewed: '2025-11-27T12:51:18.991Z'
links: []
sources: []
abstract: >-
  API documentation for Segment Analytics client: factory functions, client
  interface, methods, and usage patterns
---

# Segment Analytics Client API Documentation

## Overview

The Segment client module (`src/segment/client.ts`) provides a factory function to create Segment Analytics client instances. It wraps the `@segment/analytics-node` SDK with a simplified interface and proper error handling.

## Public API

### Types

See `src/segment/types.ts` for complete type definitions.

#### `SegmentClient`
```typescript
interface SegmentClient {
  identify(params: {
    readonly userId: string;
    readonly traits: UserTraits;
  }): Promise<void>;
  flush(): Promise<void>;
  closeAndFlush(): Promise<void>;
}
```

Client interface for Segment Analytics operations.

**Methods:**
- `identify(params)`: Identify a user with traits
- `flush()`: Flush pending events to Segment
- `closeAndFlush()`: Close client and flush all pending events

#### `UserTraits`
```typescript
interface UserTraits {
  readonly email: string;
  readonly name?: string;
  readonly address?: Address;
}
```

User traits for identification.

**Properties:**
- `email` (required): User's email address
- `name` (optional): User's name
- `address` (optional): User's address (see `Address` interface)

#### `Address`
```typescript
interface Address {
  readonly street?: string;
  readonly city?: string;
  readonly country?: string;
  readonly postalCode?: string;
}
```

User address information (all fields optional).

### Functions

#### `createSegmentClient(writeKey: string)`

Creates a Segment Analytics client instance with the provided write key.

**Signature:**
```typescript
function createSegmentClient(writeKey: string): SegmentClient
```

**Parameters:**
- `writeKey` (string): Segment write key for API authentication

**Returns:** `SegmentClient` - Configured Segment client instance

**Throws:**
- `Error` - If write key is empty or whitespace-only
  - Message: `"Write key cannot be empty or whitespace only"`

**Behavior:**
- Trims whitespace from write key
- Validates write key is not empty after trimming
- Creates underlying `@segment/analytics-node` Analytics instance
- Returns client wrapper with simplified interface

**Example:**
```typescript
const client = createSegmentClient('your-write-key-here');
await client.identify({
  userId: 'user-123',
  traits: { email: 'user@example.com' }
});
```

#### `getSegmentClientFromEnvironment()`

Creates a Segment client using the write key from environment configuration.

**Signature:**
```typescript
function getSegmentClientFromEnvironment(): SegmentClient
```

**Returns:** `SegmentClient` - Configured Segment client instance

**Throws:**
- `Error` - If `SEGMENT_WRITE_KEY` environment variable is missing or invalid
  - Propagates errors from `getEnvironmentConfig()`

**Behavior:**
- Calls `getEnvironmentConfig()` to retrieve validated configuration
- Creates client using `SEGMENT_WRITE_KEY` from environment
- Convenience function for serverless function usage

**Example:**
```typescript
// Requires SEGMENT_WRITE_KEY environment variable
const client = getSegmentClientFromEnvironment();
await client.identify({
  userId: 'user-456',
  traits: { email: 'user@example.com', name: 'John Doe' }
});
await client.flush();
```

## Client Methods

### `identify(params)`

Identifies a user with traits in Segment Analytics.

**Signature:**
```typescript
identify(params: {
  readonly userId: string;
  readonly traits: UserTraits;
}): Promise<void>
```

**Parameters:**
- `params.userId` (string): Unique identifier for the user
- `params.traits` (UserTraits): User traits including email and optional name/address

**Returns:** `Promise<void>` - Resolves when identify call is queued

**Behavior:**
- Queues identify event with Segment SDK
- Returns immediately (events are batched and sent asynchronously)
- Use `flush()` or `closeAndFlush()` to ensure events are sent

**Example:**
```typescript
await client.identify({
  userId: 'user-789',
  traits: {
    email: 'user@example.com',
    name: 'Jane Doe',
    address: {
      street: '123 Main St',
      city: 'San Francisco',
      country: 'USA',
      postalCode: '94102'
    }
  }
});
```

### `flush()`

Flushes all pending events to Segment Analytics.

**Signature:**
```typescript
flush(): Promise<void>
```

**Returns:** `Promise<void>` - Resolves when all events are flushed

**Behavior:**
- Sends all queued events to Segment
- Waits for completion before resolving
- Client remains open for further operations

**Example:**
```typescript
await client.identify({ userId: 'user-1', traits: { email: 'user@example.com' } });
await client.flush(); // Ensures event is sent before continuing
```

### `closeAndFlush()`

Closes the client and flushes all pending events.

**Signature:**
```typescript
closeAndFlush(): Promise<void>
```

**Returns:** `Promise<void>` - Resolves when client is closed and events are flushed

**Behavior:**
- Flushes all pending events
- Closes the underlying SDK client
- Client cannot be used after this call

**Example:**
```typescript
await client.identify({ userId: 'user-2', traits: { email: 'user@example.com' } });
await client.closeAndFlush(); // Final flush and cleanup
// Client is now closed
```

## Error Handling

- **Write Key Validation**: Throws error if write key is empty or whitespace-only
- **Environment Configuration**: Propagates errors from environment validation
- **SDK Errors**: Errors from `@segment/analytics-node` SDK propagate to caller
- **Serverless Context**: In serverless functions, errors should be caught and handled appropriately

## Usage Patterns

### Pattern 1: Single Event with Flush
```typescript
const client = getSegmentClientFromEnvironment();
await client.identify({
  userId: 'user-123',
  traits: { email: 'user@example.com' }
});
await client.flush();
```

### Pattern 2: Multiple Events with Final Flush
```typescript
const client = getSegmentClientFromEnvironment();
await client.identify({ userId: 'user-1', traits: { email: 'user1@example.com' } });
await client.identify({ userId: 'user-2', traits: { email: 'user2@example.com' } });
await client.closeAndFlush(); // Flush and close
```

### Pattern 3: Error Handling
```typescript
try {
  const client = getSegmentClientFromEnvironment();
  await client.identify({
    userId: 'user-123',
    traits: { email: 'user@example.com' }
  });
  await client.flush();
} catch (error) {
  console.error('Segment error:', error);
  // Handle error appropriately
}
```

## Implementation Notes

- Wraps `@segment/analytics-node` SDK with simplified interface
- Uses singleton pattern per function invocation (per ADR)
- Write key validation prevents empty/invalid keys
- All methods return Promises for async operations
- Client interface is immutable (readonly properties)