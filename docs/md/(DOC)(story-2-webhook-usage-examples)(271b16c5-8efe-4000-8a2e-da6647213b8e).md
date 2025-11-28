---
id: 271b16c5-8efe-4000-8a2e-da6647213b8e
title: STORY-2 Webhook Usage Examples
tags:
  - status/implemented
  - issue-2
  - topic/examples
  - story-2
category: DOC
created_at: '2025-11-28T07:48:37.314Z'
updated_at: '2025-11-28T07:55:13.972Z'
last_reviewed: '2025-11-28T07:48:37.314Z'
links: []
sources: []
abstract: >-
  Usage examples for STORY-2 webhook endpoint: valid/invalid requests, curl
  examples, validator usage, testing patterns, Commercetools integration.
---

**Story:** #2 - Webhook Endpoint Usage Examples

**Example 1: Valid customer.created Event**

Request:
```bash
curl -X POST https://your-domain.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "notificationType": "Message",
    "type": "CustomerCreated",
    "resource": {
      "typeId": "customer",
      "id": "customer-123"
    },
    "projectKey": "my-project",
    "id": "notification-456",
    "version": 1,
    "sequenceNumber": 1,
    "resourceVersion": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastModifiedAt": "2024-01-01T00:00:00.000Z"
  }'
```

Response (200 OK):
```json
{
  "eventType": "customer.created"
}
```

**Example 2: Valid customer.updated Event**

Request:
```bash
curl -X POST https://your-domain.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "notificationType": "Message",
    "type": "CustomerUpdated",
    "resource": {
      "typeId": "customer",
      "id": "customer-789"
    },
    "projectKey": "my-project",
    "id": "notification-789",
    "version": 2,
    "sequenceNumber": 5,
    "resourceVersion": 2,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastModifiedAt": "2024-01-02T12:00:00.000Z"
  }'
```

Response (200 OK):
```json
{
  "eventType": "customer.updated"
}
```

**Example 3: Invalid Method (GET)**

Request:
```bash
curl -X GET https://your-domain.vercel.app/api/webhook
```

Response (400 Bad Request):
```json
{
  "error": "Method not allowed. Only POST is supported."
}
```

**Example 4: Invalid JSON**

Request:
```bash
curl -X POST https://your-domain.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{ invalid json }'
```

Response (400 Bad Request):
```json
{
  "error": "Unexpected token i in JSON at position 2"
}
```

**Example 5: Missing Required Field**

Request:
```bash
curl -X POST https://your-domain.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CustomerCreated",
    "resource": {
      "typeId": "customer",
      "id": "customer-123"
    }
  }'
```

Response (400 Bad Request):
```json
{
  "error": "Invalid notificationType: must be 'Message'"
}
```

**Example 6: Unrecognized Event Type**

Request:
```bash
curl -X POST https://your-domain.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "notificationType": "Message",
    "type": "ProductCreated",
    "resource": {
      "typeId": "product",
      "id": "product-123"
    },
    "projectKey": "my-project",
    "id": "notification-123",
    "version": 1,
    "sequenceNumber": 1,
    "resourceVersion": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastModifiedAt": "2024-01-01T00:00:00.000Z"
  }'
```

Response (400 Bad Request):
```json
{
  "error": "Unrecognized event type: ProductCreated"
}
```

**Example 7: Using Validator Functions Directly**

```typescript
import { validateMethod, parseJSON, validatePayload } from './src/webhook/validator.js';

// Validate HTTP method
const isValid = validateMethod('POST'); // true
const isInvalid = validateMethod('GET'); // false

// Parse JSON
const parseResult = parseJSON('{"key":"value"}');
if (parseResult.success) {
  console.log(parseResult.data); // { key: 'value' }
} else {
  console.error(parseResult.error);
}

// Validate payload
const validationResult = validatePayload(parsedData);
if (validationResult.isValid) {
  console.log(validationResult.eventType); // 'customer.created' | 'customer.updated'
} else {
  console.error(validationResult.error);
}
```

**Example 8: Testing with Vitest**

```typescript
import { describe, it, expect } from 'vitest';
import { validatePayload } from '../../src/webhook/validator.js';

describe('validatePayload', () => {
  it('should validate customer.created payload', () => {
    const payload = {
      notificationType: 'Message',
      type: 'CustomerCreated',
      resource: { typeId: 'customer', id: 'customer-123' },
      projectKey: 'test-project',
      id: 'notification-123',
      version: 1,
      sequenceNumber: 1,
      resourceVersion: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModifiedAt: '2024-01-01T00:00:00.000Z',
    };

    const result = validatePayload(payload);
    expect(result.isValid).toBe(true);
    expect(result.eventType).toBe('customer.created');
  });
});
```

**Integration with Commercetools:**

1. Configure Commercetools subscription to POST to `/api/webhook`
2. Subscription should send customer.created and customer.updated events
3. Webhook validates and identifies event types
4. Returns 200 OK for valid events, 400 for invalid
5. Future: Process events and send to Segment (out of scope for STORY-2)