---
id: e77f089a-ce14-462a-858e-871eff174ef5
title: STORY-1 Architectural Documentation
tags:
  - status/implemented
  - issue-1
  - topic/architecture
  - documentation
category: DOC
created_at: '2025-11-27T12:53:14.316Z'
updated_at: '2025-11-27T12:55:24.291Z'
last_reviewed: '2025-11-27T12:53:14.316Z'
links: []
sources: []
abstract: >-
  Architectural documentation for STORY-1: component relationships, data flow,
  type system, error handling, serverless architecture, and future
  considerations
---

# STORY-1 Architectural Documentation

## Overview

STORY-1 establishes the foundational infrastructure for the commercetools-to-segment integration project. This story focuses on infrastructure setup without business logic, providing the building blocks for future webhook handlers and event processing.

## Architecture Components

### 1. Environment Configuration Module

**Location:** `src/config/environment.ts`

**Purpose:** Validates and provides access to required environment variables.

**Key Design Decisions:**
- **Immutable Configuration**: All configuration objects use `readonly` properties
- **Validation Before Use**: Separate validation function allows checking without throwing
- **Type Safety**: TypeScript discriminated unions ensure type safety
- **Whitespace Handling**: Automatic trimming of environment variable values

**Dependencies:**
- Node.js `process.env`
- No external dependencies

**Interface:**
- `validateEnvironment()`: Non-throwing validation
- `getEnvironmentConfig()`: Throwing validation with direct config access

### 2. Segment Client Module

**Location:** `src/segment/client.ts` and `src/segment/types.ts`

**Purpose:** Factory functions and type definitions for Segment Analytics client.

**Key Design Decisions:**
- **Factory Pattern**: `createSegmentClient()` creates client instances
- **Environment Integration**: `getSegmentClientFromEnvironment()` uses validated config
- **Simplified Interface**: Wraps `@segment/analytics-node` SDK with cleaner API
- **Singleton Per Invocation**: Each serverless function invocation gets its own client (per ADR)

**Dependencies:**
- `@segment/analytics-node` SDK
- Environment configuration module

**Interface:**
- `createSegmentClient(writeKey)`: Factory function
- `getSegmentClientFromEnvironment()`: Convenience factory
- `SegmentClient`: Interface with `identify()`, `flush()`, `closeAndFlush()`

### 3. Logger Module

**Location:** `src/logger.ts`

**Purpose:** Structured logging using Winston.

**Key Design Decisions:**
- **Winston Integration**: Uses Winston for production-grade logging
- **Structured Logging**: JSON format for log aggregation
- **Development-Friendly**: Colorized console output for local development
- **Error Stack Traces**: Automatic inclusion of error stack traces

**Dependencies:**
- `winston` package

**Interface:**
- `logInfo()`, `logError()`, `logWarn()`, `logDebug()`: Convenience functions
- `logger`: Direct access to Winston logger instance

## Component Relationships

```
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│  (Future: Webhook Handlers, API Endpoints)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Segment Client Module                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  createSegmentClient()                           │   │
│  │  getSegmentClientFromEnvironment()               │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Environment Configuration Module                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  validateEnvironment()                          │   │
│  │  getEnvironmentConfig()                         │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js process.env                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Logger Module                          │
│  (Used by all components for logging)                    │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Environment Configuration Flow

1. Application starts
2. `validateEnvironment()` or `getEnvironmentConfig()` called
3. Reads `process.env.SEGMENT_WRITE_KEY`
4. Trims whitespace and validates
5. Returns validated configuration or error

### Segment Client Creation Flow

1. `getSegmentClientFromEnvironment()` called
2. Calls `getEnvironmentConfig()` to get validated write key
3. Calls `createSegmentClient()` with write key
4. Validates write key (trim and check)
5. Creates `@segment/analytics-node` Analytics instance
6. Returns `SegmentClient` wrapper interface

### User Identification Flow

1. Application calls `client.identify({ userId, traits })`
2. Client queues identify event with Segment SDK
3. Application calls `client.flush()` or `client.closeAndFlush()`
4. Events are sent to Segment Analytics API
5. Promise resolves when events are sent

## Type System Architecture

### Immutable Types

All public interfaces use `readonly` properties:

```typescript
interface EnvironmentConfig {
  readonly SEGMENT_WRITE_KEY: string;
}

interface SegmentClient {
  identify(params: {
    readonly userId: string;
    readonly traits: UserTraits;
  }): Promise<void>;
  // ...
}
```

### Discriminated Unions

Validation results use discriminated unions for type safety:

```typescript
interface EnvironmentValidationResult {
  readonly isValid: boolean;
  readonly missingVars: ReadonlyArray<EnvVar>;
  readonly config?: EnvironmentConfig; // Only present when isValid is true
}
```

## Error Handling Architecture

### Validation Errors

- **Environment Validation**: Returns result object, never throws
- **Environment Config Access**: Throws descriptive errors for missing/invalid vars
- **Write Key Validation**: Throws error for empty/whitespace keys

### SDK Errors

- **Segment SDK Errors**: Propagate to caller (intentional for serverless)
- **Network Errors**: Handled by caller or serverless platform
- **Error Logging**: Use logger module for error tracking

## Serverless Architecture

### Vercel Configuration

**File:** `vercel.json`

**Configuration:**
- Builds from `dist/api/**/*.js`
- Uses `@vercel/node` runtime
- Routes `/api/(.*)` to `/api/$1`
- Runtime: Node.js 24.x

### Serverless Function Pattern

```typescript
// api/webhook.ts (future implementation)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSegmentClientFromEnvironment } from '../segment/client.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Each invocation gets its own client instance
  const client = getSegmentClientFromEnvironment();
  // ... process request
  await client.closeAndFlush(); // Cleanup
}
```

## Testing Architecture

### Unit Tests

- **Location:** `tests/` directory
- **Framework:** Vitest
- **Pattern:** Isolated tests with beforeEach/afterEach for environment setup
- **Coverage:** All public functions and edge cases

### BDD Tests

- **Location:** `features/` directory
- **Framework:** Cucumber
- **Pattern:** Given-When-Then scenarios
- **Focus:** Business behavior, not implementation details

## Security Architecture

### Input Validation

- Environment variables validated before use
- Write keys validated for empty/whitespace
- Type safety prevents invalid data structures

### Error Messages

- Error messages don't expose sensitive data
- Validation errors are descriptive but safe
- No secrets in error messages or logs

## Deployment Architecture

### Build Process

1. TypeScript compilation: `src/` → `dist/`
2. Vercel builds from `dist/api/**/*.js`
3. Environment variables injected at runtime

### Environment Variables

- **Required:** `SEGMENT_WRITE_KEY`
- **Set in:** Vercel project settings
- **Validated:** At application startup

## Future Architecture Considerations

### Planned Components (Out of Scope for STORY-1)

1. **Webhook Handler**: Process commercetools webhooks
2. **Event Mapper**: Transform commercetools events to Segment format
3. **Error Handling**: Comprehensive error handling and retry logic
4. **Rate Limiting**: Handle Segment API rate limits
5. **Batch Processing**: Batch multiple events for efficiency

### Extension Points

- Environment configuration can be extended with additional variables
- Segment client can be extended with additional methods (track, page, etc.)
- Logger can be extended with additional transports (file, remote, etc.)

## Architectural Principles

1. **Separation of Concerns**: Each module has a single, clear responsibility
2. **Immutable Data**: All public interfaces use readonly properties
3. **Type Safety**: TypeScript strict mode with explicit types
4. **Error Handling**: Explicit error handling, no silent failures
5. **Testability**: All components are easily testable in isolation
6. **Serverless-First**: Designed for serverless function execution model