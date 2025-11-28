---
id: 3102e8cf-c037-40e8-9859-995b921ce905
title: STORY-4 Segment Integration Usage Examples
tags:
  - story-4
  - status/active
  - topic/examples
  - issue-4
category: DOC
created_at: '2025-11-28T10:36:11.495Z'
updated_at: '2025-11-28T10:36:11.495Z'
last_reviewed: '2025-11-28T10:36:11.495Z'
links: []
sources: []
abstract: >-
  Practical usage examples for Segment Integration Service: basic usage, error
  handling, testing, and integration patterns
---

# STORY-4 Segment Integration Usage Examples

**Component:** Segment Integration Service  
**Story:** #4

## Basic Usage

### Send Customer to Segment

```typescript
import { sendCustomerToSegment } from './integration/service.js';
import type { SegmentIdentifyPayload } from './transformation/types.js';

// Create payload
const payload: SegmentIdentifyPayload = {
  userId: 'user@example.com',
  traits: {
    email: 'user@example.com',
    name: 'John Doe',
  },
};

// Send to Segment
const result = await sendCustomerToSegment(payload);

if (result.success) {
  console.log('Customer sent successfully');
} else {
  console.error('Failed:', result.error.message);
}
```

---

### Send Customer with Address

```typescript
import { sendCustomerToSegment } from './integration/service.js';
import type { SegmentIdentifyPayload } from './transformation/types.js';

const payload: SegmentIdentifyPayload = {
  userId: 'user@example.com',
  traits: {
    email: 'user@example.com',
    name: 'Jane Smith',
    address: {
      street: '123 Main St',
      city: 'New York',
      postalCode: '10001',
      country: 'US',
    },
  },
};

const result = await sendCustomerToSegment(payload);
```

---

### Send Customer with Minimal Data

```typescript
import { sendCustomerToSegment } from './integration/service.js';
import type { SegmentIdentifyPayload } from './transformation/types.js';

// Only email required
const payload: SegmentIdentifyPayload = {
  userId: 'user@example.com',
  traits: {
    email: 'user@example.com',
  },
};

const result = await sendCustomerToSegment(payload);
```

---

## Error Handling

### Handle Errors Explicitly

```typescript
import { sendCustomerToSegment } from './integration/service.js';
import { logError } from './logger.js';

const result = await sendCustomerToSegment(payload);

if (!result.success) {
  // Log error for monitoring
  logError('Segment integration failed', {
    error: result.error.message,
    userId: payload.userId,
  });
  
  // Return appropriate response
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Internal server error' }),
  };
}

// Success path
return { statusCode: 200, body: 'OK' };
```

---

### Retry on Failure

```typescript
import { sendCustomerToSegment } from './integration/service.js';

async function sendWithRetry(
  payload: SegmentIdentifyPayload,
  maxRetries = 3
): Promise<SegmentIntegrationResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendCustomerToSegment(payload);
    
    if (result.success) {
      return result;
    }
    
    // Log retry attempt
    console.warn(`Attempt ${attempt} failed:`, result.error.message);
    
    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  // All retries failed
  return {
    success: false,
    error: { message: 'Max retries exceeded' },
  };
}
```

---

### Error Handling in Webhook Handler

```typescript
import { sendCustomerToSegment } from './integration/service.js';
import { transformCustomerToSegment } from './transformation/transformer.js';
import type { CommercetoolsCustomer } from './transformation/types.js';

export async function handleWebhook(customer: CommercetoolsCustomer) {
  // Transform customer data
  const payload = transformCustomerToSegment(customer);
  
  // Send to Segment
  const result = await sendCustomerToSegment(payload);
  
  if (!result.success) {
    // Log error but don't expose details to caller
    console.error('Segment integration error:', result.error.message);
    
    // Return 500 to indicate server error
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
  
  // Success
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
}
```

---

## Testing

### Unit Test with Mock Client

```typescript
import { describe, it, expect, vi } from 'vitest';
import { sendCustomerToSegmentWithClient } from './integration/service.js';
import type { SegmentClient } from './segment/types.js';
import type { SegmentIdentifyPayload } from './transformation/types.js';

describe('sendCustomerToSegmentWithClient', () => {
  it('should send customer data successfully', async () => {
    // Create mock client
    const mockClient: SegmentClient = {
      identify: vi.fn().mockResolvedValue(undefined),
      flush: vi.fn().mockResolvedValue(undefined),
      closeAndFlush: vi.fn().mockResolvedValue(undefined),
    };
    
    // Create payload
    const payload: SegmentIdentifyPayload = {
      userId: 'user@example.com',
      traits: {
        email: 'user@example.com',
        name: 'John Doe',
      },
    };
    
    // Send to Segment
    const result = await sendCustomerToSegmentWithClient(mockClient, payload);
    
    // Assertions
    expect(result.success).toBe(true);
    expect(mockClient.identify).toHaveBeenCalledWith({
      userId: 'user@example.com',
      traits: {
        email: 'user@example.com',
        name: 'John Doe',
      },
    });
    expect(mockClient.flush).toHaveBeenCalledTimes(1);
  });
  
  it('should handle errors gracefully', async () => {
    const mockClient: SegmentClient = {
      identify: vi.fn().mockRejectedValue(new Error('Network error')),
      flush: vi.fn().mockResolvedValue(undefined),
      closeAndFlush: vi.fn().mockResolvedValue(undefined),
    };
    
    const payload: SegmentIdentifyPayload = {
      userId: 'user@example.com',
      traits: { email: 'user@example.com' },
    };
    
    const result = await sendCustomerToSegmentWithClient(mockClient, payload);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Network error');
    }
  });
});
```

---

### Integration Test with Real Client

```typescript
import { describe, it, expect } from 'vitest';
import { sendCustomerToSegmentWithClient } from './integration/service.js';
import { createSegmentClient } from './segment/client.js';
import type { SegmentIdentifyPayload } from './transformation/types.js';

describe('Integration: Segment API', () => {
  it('should send customer to Segment API', async () => {
    // Use test write key from environment
    const testWriteKey = process.env.SEGMENT_TEST_WRITE_KEY;
    if (!testWriteKey) {
      throw new Error('SEGMENT_TEST_WRITE_KEY not set');
    }
    
    // Create real client
    const client = createSegmentClient(testWriteKey);
    
    // Create payload
    const payload: SegmentIdentifyPayload = {
      userId: 'test@example.com',
      traits: {
        email: 'test@example.com',
        name: 'Test User',
      },
    };
    
    // Send to Segment
    const result = await sendCustomerToSegmentWithClient(client, payload);
    
    // Assert success
    expect(result.success).toBe(true);
    
    // Cleanup
    await client.closeAndFlush();
  });
});
```

---

## Integration Patterns

### Webhook Handler Integration

```typescript
import { sendCustomerToSegment } from './integration/service.js';
import { transformCustomerToSegment } from './transformation/transformer.js';
import { validatePayload } from './webhook/validator.js';
import type { CommercetoolsWebhookPayload } from './webhook/types.js';

export async function handleWebhookRequest(
  body: unknown
): Promise<{ statusCode: number; body: string }> {
  // Validate webhook payload
  const validation = validatePayload(body);
  if (!validation.isValid) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: validation.error }),
    };
  }
  
  // Extract customer data based on event type
  let customer;
  if (validation.eventType === 'customer.created' || validation.eventType === 'customer.updated') {
    customer = extractCustomerFromPayload(body as CommercetoolsWebhookPayload);
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Unsupported event type' }),
    };
  }
  
  // Transform customer data
  const payload = transformCustomerToSegment(customer);
  
  // Send to Segment
  const result = await sendCustomerToSegment(payload);
  
  // Handle result
  if (!result.success) {
    console.error('Segment integration failed:', result.error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
}
```

---

### Batch Processing

```typescript
import { sendCustomerToSegment } from './integration/service.js';
import type { SegmentIdentifyPayload } from './transformation/types.js';

async function sendBatchToSegment(
  payloads: ReadonlyArray<SegmentIdentifyPayload>
): Promise<ReadonlyArray<SegmentIntegrationResult>> {
  const results = await Promise.all(
    payloads.map((payload) => sendCustomerToSegment(payload))
  );
  
  // Count successes and failures
  const successes = results.filter((r) => r.success).length;
  const failures = results.filter((r) => !r.success).length;
  
  console.log(`Batch complete: ${successes} succeeded, ${failures} failed`);
  
  return results;
}
```

---

### Conditional Sending

```typescript
import { sendCustomerToSegment } from './integration/service.js';
import type { SegmentIdentifyPayload } from './transformation/types.js';

async function sendIfValid(
  payload: SegmentIdentifyPayload
): Promise<SegmentIntegrationResult> {
  // Validate payload before sending
  if (!payload.userId || !payload.traits.email) {
    return {
      success: false,
      error: { message: 'Invalid payload: missing userId or email' },
    };
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.traits.email)) {
    return {
      success: false,
      error: { message: 'Invalid email format' },
    };
  }
  
  // Send if valid
  return await sendCustomerToSegment(payload);
}
```

---

## Common Patterns

### Success/Error Pattern

```typescript
const result = await sendCustomerToSegment(payload);

if (result.success) {
  // Success handling
  console.log('Success');
  return { status: 'ok' };
} else {
  // Error handling
  console.error('Error:', result.error.message);
  return { status: 'error', message: result.error.message };
}
```

---

### Type Guard Pattern

```typescript
function isSuccess(
  result: SegmentIntegrationResult
): result is { success: true } {
  return result.success === true;
}

function isError(
  result: SegmentIntegrationResult
): result is { success: false; error: SegmentError } {
  return result.success === false;
}

// Usage
const result = await sendCustomerToSegment(payload);

if (isSuccess(result)) {
  // TypeScript knows result is { success: true }
  console.log('Success');
} else if (isError(result)) {
  // TypeScript knows result is { success: false; error: SegmentError }
  console.error('Error:', result.error.message);
}
```

---

### Async/Await Pattern

```typescript
async function processCustomer(customer: CommercetoolsCustomer) {
  try {
    // Transform
    const payload = transformCustomerToSegment(customer);
    
    // Send to Segment
    const result = await sendCustomerToSegment(payload);
    
    // Handle result
    if (!result.success) {
      throw new Error(`Segment integration failed: ${result.error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
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

2. **Log Errors for Monitoring**
   ```typescript
   if (!result.success) {
     logError('Segment integration failed', {
       error: result.error.message,
       userId: payload.userId,
     });
   }
   ```

3. **Use Dependency Injection for Testing**
   ```typescript
   // In tests, use sendCustomerToSegmentWithClient
   await sendCustomerToSegmentWithClient(mockClient, payload);
   ```

4. **Validate Payload Before Sending**
   ```typescript
   if (!payload.userId || !payload.traits.email) {
     // Handle invalid payload
   }
   ```

5. **Handle Errors Gracefully**
   ```typescript
   // Don't throw exceptions, return appropriate HTTP status
   if (!result.success) {
     return { statusCode: 500, body: 'Internal server error' };
   }
   ```
