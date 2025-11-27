---
id: 37e9d0ed-274a-4963-9bb4-21aecaf7216a
title: 'STORY-1 API Documentation: Logger Module'
tags:
  - status/implemented
  - issue-1
  - topic/api
  - documentation
  - logger
category: DOC
created_at: '2025-11-27T12:51:34.677Z'
updated_at: '2025-11-27T12:55:22.601Z'
last_reviewed: '2025-11-27T12:51:34.677Z'
links: []
sources: []
abstract: >-
  API documentation for logger module: log functions, configuration, log levels,
  and usage patterns
---

# Logger Module API Documentation

## Overview

The logger module (`src/logger.ts`) provides a Winston-based logging utility with structured logging capabilities. It exports convenience functions for different log levels and provides access to the underlying Winston logger instance.

## Public API

### Functions

#### `logInfo(message, meta?)`

Logs an informational message.

**Signature:**
```typescript
function logInfo(message: string, meta?: Record<string, unknown>): void
```

**Parameters:**
- `message` (string): Log message text
- `meta` (optional Record<string, unknown>): Additional metadata to include in log

**Returns:** `void`

**Example:**
```typescript
logInfo('User logged in', { userId: 'user-123', timestamp: Date.now() });
```

#### `logError(message, error?, meta?)`

Logs an error message with optional error object and metadata.

**Signature:**
```typescript
function logError(
  message: string,
  error?: Error,
  meta?: Record<string, unknown>
): void
```

**Parameters:**
- `message` (string): Error message text
- `error` (optional Error): Error object to log (message and stack trace included)
- `meta` (optional Record<string, unknown>): Additional metadata

**Returns:** `void`

**Behavior:**
- Includes error message and stack trace in log output
- Merges error information with metadata

**Example:**
```typescript
try {
  // Some operation
} catch (error) {
  logError('Operation failed', error as Error, { operationId: 'op-123' });
}
```

#### `logWarn(message, meta?)`

Logs a warning message.

**Signature:**
```typescript
function logWarn(message: string, meta?: Record<string, unknown>): void
```

**Parameters:**
- `message` (string): Warning message text
- `meta` (optional Record<string, unknown>): Additional metadata

**Returns:** `void`

**Example:**
```typescript
logWarn('Rate limit approaching', { currentRate: 90, limit: 100 });
```

#### `logDebug(message, meta?)`

Logs a debug message.

**Signature:**
```typescript
function logDebug(message: string, meta?: Record<string, unknown>): void
```

**Parameters:**
- `message` (string): Debug message text
- `meta` (optional Record<string, unknown>): Additional metadata

**Returns:** `void`

**Example:**
```typescript
logDebug('Processing request', { requestId: 'req-456', method: 'POST' });
```

### Exports

#### `logger`

The underlying Winston logger instance.

**Type:** `winston.Logger`

**Usage:**
```typescript
import { logger } from './logger.js';
logger.info('Direct logger access');
```

## Logger Configuration

The logger is configured with:
- **Level**: `info` (logs info, warn, and error; debug requires level change)
- **Format**: JSON format with timestamp and error stack traces
- **Transports**: Console output with colorized simple format
- **Default Meta**: `{ service: 'node-basic' }`

## Log Levels

1. **Error**: Critical errors that require attention
2. **Warn**: Warning conditions that may need attention
3. **Info**: Informational messages (default level)
4. **Debug**: Detailed debugging information (requires level change)

## Usage Patterns

### Pattern 1: Simple Logging
```typescript
logInfo('Application started');
logError('Failed to connect to database');
```

### Pattern 2: Logging with Metadata
```typescript
logInfo('User action', {
  userId: 'user-123',
  action: 'purchase',
  amount: 99.99
});
```

### Pattern 3: Error Logging
```typescript
try {
  await riskyOperation();
} catch (error) {
  logError('Operation failed', error as Error, {
    operationId: 'op-789',
    context: 'payment-processing'
  });
}
```

### Pattern 4: Conditional Debug Logging
```typescript
if (process.env.DEBUG === 'true') {
  logDebug('Detailed operation info', { step: 'validation', data: inputData });
}
```

## Implementation Notes

- Uses Winston for structured logging
- JSON format for production log aggregation
- Colorized console output for development
- Error stack traces automatically included
- Service name included in all logs
- All log functions are synchronous (non-blocking)