---
id: 9666d605-77cd-4d71-8a53-cc8014fab411
title: 'STORY-1 Usage Examples: Segment Client'
tags:
  - status/implemented
  - issue-1
  - topic/examples
  - documentation
  - segment-client
category: DOC
created_at: '2025-11-27T12:52:36.807Z'
updated_at: '2025-11-27T12:55:27.948Z'
last_reviewed: '2025-11-27T12:52:36.807Z'
links: []
sources: []
abstract: >-
  Usage examples for Segment client: basic usage, serverless functions, advanced
  patterns, integration patterns, and common use cases
---

# Segment Client Usage Examples

## Basic Usage

### Example 1: Create Client and Identify User

```typescript
import { createSegmentClient } from './segment/client.js';
import type { UserTraits } from './segment/types.js';

// Create client with write key
const client = createSegmentClient('your-segment-write-key');

// Identify a user
await client.identify({
  userId: 'user-123',
  traits: {
    email: 'user@example.com',
    name: 'John Doe'
  }
});

// Flush events to ensure they're sent
await client.flush();
```

### Example 2: Using Environment Configuration

```typescript
import { getSegmentClientFromEnvironment } from './segment/client.js';

// Client automatically uses SEGMENT_WRITE_KEY from environment
const client = getSegmentClientFromEnvironment();

await client.identify({
  userId: 'user-456',
  traits: { email: 'user@example.com' }
});

await client.flush();
```

## Serverless Function Usage

### Example 3: Vercel Serverless Function Handler

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSegmentClientFromEnvironment } from '../segment/client.js';
import { logError, logInfo } from '../logger.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const client = getSegmentClientFromEnvironment();
    
    // Extract user information from request
    const userId = req.body.userId || req.query.userId;
    const email = req.body.email;
    
    if (userId && email) {
      await client.identify({
        userId: String(userId),
        traits: { email: String(email) }
      });
      
      // Flush before responding
      await client.flush();
      
      logInfo('User identified', { userId, email });
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ error: 'Missing userId or email' });
    }
  } catch (error) {
    logError('Segment identification failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Example 4: Webhook Handler with User Identification

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSegmentClientFromEnvironment } from '../segment/client.js';
import { logError } from '../logger.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = getSegmentClientFromEnvironment();
    const { customerId, email, name, address } = req.body;

    await client.identify({
      userId: customerId,
      traits: {
        email,
        name,
        address: address ? {
          street: address.street,
          city: address.city,
          country: address.country,
          postalCode: address.postalCode
        } : undefined
      }
    });

    await client.closeAndFlush(); // Final flush and cleanup

    res.status(200).json({ success: true });
  } catch (error) {
    logError('Webhook processing failed', error as Error);
    res.status(500).json({ error: 'Processing failed' });
  }
}
```

## Advanced Usage

### Example 5: Batch User Identifications

```typescript
import { getSegmentClientFromEnvironment } from './segment/client.js';

async function identifyMultipleUsers(users: Array<{ id: string; email: string }>) {
  const client = getSegmentClientFromEnvironment();
  
  // Identify multiple users
  const promises = users.map(user =>
    client.identify({
      userId: user.id,
      traits: { email: user.email }
    })
  );
  
  await Promise.all(promises);
  
  // Single flush for all events
  await client.flush();
}
```

### Example 6: User Identification with Full Address

```typescript
import { getSegmentClientFromEnvironment } from './segment/client.js';
import type { UserTraits } from './segment/types.js';

const client = getSegmentClientFromEnvironment();

const traits: UserTraits = {
  email: 'customer@example.com',
  name: 'Jane Smith',
  address: {
    street: '123 Main Street',
    city: 'San Francisco',
    country: 'USA',
    postalCode: '94102'
  }
};

await client.identify({
  userId: 'customer-789',
  traits
});

await client.flush();
```

### Example 7: Error Handling and Retry Logic

```typescript
import { getSegmentClientFromEnvironment } from './segment/client.js';
import { logError, logWarn } from '../logger.js';

async function identifyUserWithRetry(
  userId: string,
  traits: UserTraits,
  maxRetries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = getSegmentClientFromEnvironment();
      await client.identify({ userId, traits });
      await client.flush();
      return true;
    } catch (error) {
      logWarn(`Identify attempt ${attempt} failed`, { userId, attempt });
      
      if (attempt === maxRetries) {
        logError('All identify attempts failed', error as Error, { userId });
        return false;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return false;
}
```

## Integration Patterns

### Example 8: Middleware Pattern

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSegmentClientFromEnvironment } from '../segment/client.js';

export async function identifyUserMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  next: () => void
) {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    const email = req.headers['x-user-email'] || req.query.email;
    
    if (userId && email) {
      const client = getSegmentClientFromEnvironment();
      await client.identify({
        userId: String(userId),
        traits: { email: String(email) }
      });
      // Don't flush here - let the handler flush after processing
    }
    
    next();
  } catch (error) {
    // Log but don't block request
    console.error('Middleware identification failed:', error);
    next();
  }
}
```

### Example 9: Service Class Pattern

```typescript
import { getSegmentClientFromEnvironment, type SegmentClient } from './segment/client.js';
import type { UserTraits } from './segment/types.js';

class UserIdentificationService {
  private client: SegmentClient;

  constructor() {
    this.client = getSegmentClientFromEnvironment();
  }

  async identifyUser(userId: string, traits: UserTraits): Promise<void> {
    await this.client.identify({ userId, traits });
  }

  async flush(): Promise<void> {
    await this.client.flush();
  }

  async close(): Promise<void> {
    await this.client.closeAndFlush();
  }
}

// Usage
const service = new UserIdentificationService();
await service.identifyUser('user-123', { email: 'user@example.com' });
await service.flush();
```

## Testing Examples

### Example 10: Unit Test with Mock

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createSegmentClient } from './segment/client.js';

describe('Segment Client', () => {
  it('should identify user', async () => {
    const client = createSegmentClient('test-key');
    
    await expect(
      client.identify({
        userId: 'test-user',
        traits: { email: 'test@example.com' }
      })
    ).resolves.toBeUndefined();
  });
});
```

## Common Use Cases

### Use Case 1: E-commerce Customer Identification

```typescript
import { getSegmentClientFromEnvironment } from './segment/client.js';

async function identifyCustomer(customerData: {
  id: string;
  email: string;
  name?: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
}) {
  const client = getSegmentClientFromEnvironment();
  
  await client.identify({
    userId: customerData.id,
    traits: {
      email: customerData.email,
      name: customerData.name,
      address: customerData.address
    }
  });
  
  await client.flush();
}
```

### Use Case 2: User Registration Flow

```typescript
import { getSegmentClientFromEnvironment } from './segment/client.js';
import { logInfo, logError } from '../logger.js';

async function registerUser(userData: { email: string; name: string }) {
  try {
    // Create user in database
    const userId = await createUserInDatabase(userData);
    
    // Identify user in Segment
    const client = getSegmentClientFromEnvironment();
    await client.identify({
      userId,
      traits: {
        email: userData.email,
        name: userData.name
      }
    });
    await client.flush();
    
    logInfo('User registered and identified', { userId });
    return userId;
  } catch (error) {
    logError('User registration failed', error as Error);
    throw error;
  }
}
```