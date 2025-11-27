---
id: 048a1e9d-fb55-4a52-a95a-c52360ddbd4d
title: 'STORY-1 API Documentation: Environment Configuration'
tags:
  - status/implemented
  - issue-1
  - topic/api
  - documentation
  - environment-config
category: DOC
created_at: '2025-11-27T12:50:54.654Z'
updated_at: '2025-11-27T12:55:21.647Z'
last_reviewed: '2025-11-27T12:50:54.654Z'
links: []
sources: []
abstract: >-
  API documentation for environment configuration module: types, functions,
  validation rules, and usage patterns
---

# Environment Configuration API Documentation

## Overview

The environment configuration module (`src/config/environment.ts`) provides validation and access to required environment variables for the application. It ensures that all necessary configuration is present and properly formatted before the application starts.

## Public API

### Types

#### `EnvironmentConfig`
```typescript
interface EnvironmentConfig {
  readonly SEGMENT_WRITE_KEY: string;
}
```

Configuration object containing validated environment variables.

**Properties:**
- `SEGMENT_WRITE_KEY` (required): Segment Analytics write key for API authentication

#### `EnvironmentValidationResult`
```typescript
interface EnvironmentValidationResult {
  readonly isValid: boolean;
  readonly missingVars: ReadonlyArray<EnvVar>;
  readonly config?: EnvironmentConfig;
}
```

Result of environment validation.

**Properties:**
- `isValid` (boolean): Whether all required environment variables are present and valid
- `missingVars` (ReadonlyArray<EnvVar>): Array of missing or invalid environment variable names
- `config` (optional EnvironmentConfig): Validated configuration object (only present when `isValid` is true)

#### `EnvVar`
```typescript
type EnvVar = keyof EnvironmentConfig;
```

Type alias for environment variable names. Currently: `'SEGMENT_WRITE_KEY'`

### Functions

#### `validateEnvironment()`

Validates required environment variables without throwing errors.

**Signature:**
```typescript
function validateEnvironment(): EnvironmentValidationResult
```

**Returns:** `EnvironmentValidationResult` - Validation result with status and missing variables

**Behavior:**
- Checks for `SEGMENT_WRITE_KEY` in `process.env`
- Trims whitespace from the write key value
- Returns `isValid: false` if the key is missing, empty, or whitespace-only
- Returns `isValid: true` with trimmed config if validation passes

**Example:**
```typescript
const result = validateEnvironment();
if (result.isValid) {
  console.log('Config:', result.config);
} else {
  console.log('Missing:', result.missingVars);
}
```

#### `getEnvironmentConfig()`

Gets validated environment configuration, throwing an error if validation fails.

**Signature:**
```typescript
function getEnvironmentConfig(): EnvironmentConfig
```

**Returns:** `EnvironmentConfig` - Validated configuration object

**Throws:**
- `Error` - If required environment variables are missing or invalid
  - Message format: `"Missing required environment variable: SEGMENT_WRITE_KEY"`
  - Or: `"Environment configuration is invalid"` (should not occur in practice)

**Behavior:**
- Calls `validateEnvironment()` internally
- Throws error if validation fails
- Returns trimmed configuration object if validation succeeds

**Example:**
```typescript
try {
  const config = getEnvironmentConfig();
  console.log('Write key:', config.SEGMENT_WRITE_KEY);
} catch (error) {
  console.error('Configuration error:', error.message);
}
```

## Validation Rules

1. **SEGMENT_WRITE_KEY**:
   - Must be present in `process.env`
   - Must not be empty string
   - Must not be whitespace-only
   - Leading and trailing whitespace is automatically trimmed

## Error Handling

- `validateEnvironment()`: Never throws; returns validation result
- `getEnvironmentConfig()`: Throws descriptive errors for missing/invalid variables

## Usage Patterns

### Pattern 1: Validation Before Use
```typescript
const validation = validateEnvironment();
if (!validation.isValid) {
  // Handle missing configuration
  console.error('Missing:', validation.missingVars);
  process.exit(1);
}
const config = validation.config!; // Safe to use after validation
```

### Pattern 2: Direct Access with Error Handling
```typescript
try {
  const config = getEnvironmentConfig();
  // Use config
} catch (error) {
  // Handle error
}
```

## Implementation Notes

- Uses `process.env` for environment variable access
- Trims whitespace from values automatically
- Returns immutable objects (readonly properties)
- Type-safe with TypeScript discriminated unions