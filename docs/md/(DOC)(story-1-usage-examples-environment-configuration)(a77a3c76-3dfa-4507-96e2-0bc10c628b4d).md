---
id: a77a3c76-3dfa-4507-96e2-0bc10c628b4d
title: 'STORY-1 Usage Examples: Environment Configuration'
tags:
  - status/implemented
  - issue-1
  - topic/examples
  - documentation
  - environment-config
category: DOC
created_at: '2025-11-27T12:52:01.234Z'
updated_at: '2025-11-27T12:55:27.124Z'
last_reviewed: '2025-11-27T12:52:01.234Z'
links: []
sources: []
abstract: >-
  Usage examples for environment configuration: basic usage, serverless
  functions, integration patterns, error handling, and common use cases
---

# Environment Configuration Usage Examples

## Basic Usage

### Example 1: Validate Environment Before Starting

```typescript
import { validateEnvironment } from './config/environment.js';

// Check if environment is properly configured
const validation = validateEnvironment();

if (!validation.isValid) {
  console.error('Missing environment variables:', validation.missingVars);
  process.exit(1);
}

// Environment is valid, proceed with application startup
console.log('Environment configured:', validation.config);
```

### Example 2: Get Configuration with Error Handling

```typescript
import { getEnvironmentConfig } from './config/environment.js';

try {
  const config = getEnvironmentConfig();
  console.log('Segment write key configured');
  // Use config.SEGMENT_WRITE_KEY
} catch (error) {
  console.error('Configuration error:', error.message);
  process.exit(1);
}
```

## Serverless Function Usage

### Example 3: Vercel Serverless Function

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEnvironmentConfig } from '../config/environment.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const config = getEnvironmentConfig();
    // Use config.SEGMENT_WRITE_KEY
    res.status(200).json({ message: 'OK' });
  } catch (error) {
    res.status(500).json({ error: 'Configuration error' });
  }
}
```

## Integration Examples

### Example 4: With Segment Client

```typescript
import { getEnvironmentConfig } from './config/environment.js';
import { createSegmentClient } from './segment/client.js';

// Get validated configuration
const config = getEnvironmentConfig();

// Create Segment client with validated write key
const client = createSegmentClient(config.SEGMENT_WRITE_KEY);

// Use client
await client.identify({
  userId: 'user-123',
  traits: { email: 'user@example.com' }
});
```

### Example 5: Conditional Logic Based on Validation

```typescript
import { validateEnvironment } from './config/environment.js';

const validation = validateEnvironment();

if (validation.isValid && validation.config) {
  // Production mode: use validated config
  const config = validation.config;
  // Initialize services with config
} else {
  // Development mode: use defaults or mock
  console.warn('Using development defaults');
  // Initialize with mock/test configuration
}
```

## Error Handling Patterns

### Example 6: Graceful Degradation

```typescript
import { validateEnvironment } from './config/environment.js';
import { logError } from '../logger.js';

const validation = validateEnvironment();

if (!validation.isValid) {
  logError('Environment validation failed', undefined, {
    missingVars: validation.missingVars
  });
  
  // Fallback to default behavior or exit
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    // Development: continue with warnings
    console.warn('Running with incomplete configuration');
  }
}
```

### Example 7: Detailed Error Reporting

```typescript
import { getEnvironmentConfig } from './config/environment.js';
import { logError } from '../logger.js';

function initializeApplication() {
  try {
    const config = getEnvironmentConfig();
    return { success: true, config };
  } catch (error) {
    logError('Failed to initialize application', error as Error, {
      step: 'environment-configuration',
      timestamp: new Date().toISOString()
    });
    return { success: false, error: error.message };
  }
}
```

## Testing Examples

### Example 8: Unit Test Setup

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnvironment } from './config/environment.js';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate environment', () => {
    process.env.SEGMENT_WRITE_KEY = 'test-key';
    const result = validateEnvironment();
    expect(result.isValid).toBe(true);
  });
});
```

## Common Use Cases

### Use Case 1: Application Startup Validation

Validate environment at application startup before initializing services:

```typescript
import { getEnvironmentConfig } from './config/environment.js';

async function startApplication() {
  // Validate environment first
  const config = getEnvironmentConfig();
  
  // Initialize services with validated config
  await initializeServices(config);
  
  // Start application
  console.log('Application started successfully');
}
```

### Use Case 2: Health Check Endpoint

Use environment validation in health check endpoints:

```typescript
import { validateEnvironment } from './config/environment.js';

export function healthCheck() {
  const validation = validateEnvironment();
  return {
    status: validation.isValid ? 'healthy' : 'unhealthy',
    environment: validation.isValid ? 'configured' : 'misconfigured',
    missingVars: validation.missingVars
  };
}
```

### Use Case 3: Configuration Export

Export validated configuration for use across modules:

```typescript
import { getEnvironmentConfig } from './config/environment.js';

// Validate once at module load
let appConfig: EnvironmentConfig | null = null;

try {
  appConfig = getEnvironmentConfig();
} catch (error) {
  // Handle error or set defaults
}

export function getConfig(): EnvironmentConfig {
  if (!appConfig) {
    throw new Error('Configuration not initialized');
  }
  return appConfig;
}
```