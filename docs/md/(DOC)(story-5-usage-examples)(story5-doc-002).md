---
id: story5-doc-002
title: STORY-5 Usage Examples
tags:
  - status/implemented
  - story-5
  - topic/examples
  - component/webhook-handler
  - component/transformer
  - component/integration-service
category: DOC
created_at: '2025-01-27T12:00:00.000Z'
updated_at: '2025-01-27T12:00:00.000Z'
last_reviewed: '2025-01-27T12:00:00.000Z'
links: []
sources: []
---

# Usage Examples for Story 5: End-to-End Integration

## Basic Webhook Integration

### Example 1: Complete Customer Created Flow

**Scenario:** Commercetools sends a `customer.created` webhook when a new customer is created.

**Webhook Payload:**
```json
{
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
  "createdAt": "2025-01-27T12:00:00.000Z",
  "lastModifiedAt": "2025-01-27T12:00:00.000Z",
  "customer": {
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "addresses": [{
      "streetName": "Main St",
      "streetNumber": "123",
      "city": "New York",
      "postalCode": "10001",
      "country": "US"
    }]
  }
}
```

**Result:**
- Customer is created in Segment with userId `"john.doe@example.com"`
- Traits include email, name (`"John Doe"`), and address
- Webhook returns `200 OK` with `{ eventType: "customer.created", success: true }`

---

### Example 2: Customer Updated Flow

**Scenario:** Commercetools sends a `customer.updated` webhook when customer data changes.

**Webhook Payload:**
```json
{
  "notificationType": "Message",
  "type": "CustomerUpdated",
  "resource": {
    "typeId": "customer",
    "id": "customer-123"
  },
  "projectKey": "my-project",
  "id": "notification-789",
  "version": 2,
  "sequenceNumber": 2,
  "resourceVersion": 2,
  "createdAt": "2025-01-27T12:00:00.000Z",
  "lastModifiedAt": "2025-01-27T13:00:00.000Z",
  "customer": {
    "email": "john.doe@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "addresses": [{
      "streetName": "Oak Ave",
      "streetNumber": "456",
      "city": "Los Angeles",
      "postalCode": "90001",
      "country": "US"
    }]
  }
}
```

**Result:**
- Customer is updated in Segment with userId `"john.doe@example.com"`
- Traits are updated with new name (`"Jane Smith"`) and address
- Webhook returns `200 OK` with `{ eventType: "customer.updated", success: true }`

---

## Programmatic Usage

### Example 3: Transform Customer Data

**Use Case:** Transform Commercetools customer data to Segment format before sending.

```typescript
import { transformCustomerToSegment } from './src/transformation/transformer.js';
import type { CommercetoolsCustomer } from './src/transformation/types.js';

const customer: CommercetoolsCustomer = {
  email: 'user@example.com',
  firstName: 'Alice',
  lastName: 'Johnson',
  addresses: [{
    streetName: 'Pine Rd',
    streetNumber: '789',
    city: 'Chicago',
    postalCode: '60601',
    country: 'US'
  }]
};

const segmentPayload = transformCustomerToSegment(customer);
// Result:
// {
//   userId: 'user@example.com',
//   traits: {
//     email: 'user@example.com',
//     name: 'Alice Johnson',
//     address: {
//       street: 'Pine Rd 789',
//       city: 'Chicago',
//       postalCode: '60601',
//       country: 'US'
//     }
//   }
// }
```

---

### Example 4: Send Customer to Segment

**Use Case:** Send customer data to Segment Identify API programmatically.

```typescript
import { sendCustomerToSegment } from './src/integration/service.js';
import type { SegmentIdentifyPayload } from './src/transformation/types.js';

// Set environment variable
process.env.SEGMENT_WRITE_KEY = 'your-segment-write-key';

const payload: SegmentIdentifyPayload = {
  userId: 'user@example.com',
  traits: {
    email: 'user@example.com',
    name: 'Bob Williams',
    address: {
      street: 'Elm St 321',
      city: 'Boston',
      postalCode: '02101',
      country: 'US'
    }
  }
};

const result = await sendCustomerToSegment(payload);

if (result.success) {
  console.log('Customer sent to Segment successfully');
} else {
  console.error('Failed to send customer:', result.error.message);
}
```

---

### Example 5: Custom Segment Client

**Use Case:** Use a custom Segment client instance (e.g., for testing).

```typescript
import { sendCustomerToSegmentWithClient } from './src/integration/service.js';
import { createSegmentClient } from './src/segment/client.js';
import type { SegmentIdentifyPayload } from './src/transformation/types.js';

// Create client with custom write key
const client = createSegmentClient('custom-write-key');

const payload: SegmentIdentifyPayload = {
  userId: 'user@example.com',
  traits: {
    email: 'user@example.com',
    name: 'Test User'
  }
};

const result = await sendCustomerToSegmentWithClient(client, payload);
```

---

## Name Extraction Examples

### Example 6: Full Name Priority

```typescript
const customer = {
  email: 'user@example.com',
  fullName: 'John Doe',
  firstName: 'John',
  lastName: 'Doe'
};

const payload = transformCustomerToSegment(customer);
// Result: name = 'John Doe' (fullName takes priority)
```

### Example 7: First Name and Last Name

```typescript
const customer = {
  email: 'user@example.com',
  firstName: 'Jane',
  lastName: 'Smith'
};

const payload = transformCustomerToSegment(customer);
// Result: name = 'Jane Smith'
```

### Example 8: First Name Only

```typescript
const customer = {
  email: 'user@example.com',
  firstName: 'Alice'
};

const payload = transformCustomerToSegment(customer);
// Result: name = 'Alice'
```

### Example 9: Last Name Only

```typescript
const customer = {
  email: 'user@example.com',
  lastName: 'Johnson'
};

const payload = transformCustomerToSegment(customer);
// Result: name = 'Johnson'
```

### Example 10: No Name Fields

```typescript
const customer = {
  email: 'user@example.com'
};

const payload = transformCustomerToSegment(customer);
// Result: name = undefined (not included in traits)
```

---

## Address Extraction Examples

### Example 11: Complete Address

```typescript
const customer = {
  email: 'user@example.com',
  addresses: [{
    streetName: 'Main St',
    streetNumber: '123',
    city: 'New York',
    postalCode: '10001',
    country: 'US'
  }]
};

const payload = transformCustomerToSegment(customer);
// Result: address = {
//   street: 'Main St 123',
//   city: 'New York',
//   postalCode: '10001',
//   country: 'US'
// }
```

### Example 12: Street Name Only

```typescript
const customer = {
  email: 'user@example.com',
  addresses: [{
    streetName: 'Oak Ave',
    city: 'Los Angeles'
  }]
};

const payload = transformCustomerToSegment(customer);
// Result: address = {
//   street: 'Oak Ave',
//   city: 'Los Angeles'
// }
```

### Example 13: Street Number Only

```typescript
const customer = {
  email: 'user@example.com',
  addresses: [{
    streetNumber: '456',
    city: 'Chicago'
  }]
};

const payload = transformCustomerToSegment(customer);
// Result: address = {
//   street: '456',
//   city: 'Chicago'
// }
```

### Example 14: No Addresses

```typescript
const customer = {
  email: 'user@example.com',
  addresses: null
};

const payload = transformCustomerToSegment(customer);
// Result: address = undefined (not included in traits)
```

---

## Error Handling Examples

### Example 15: Invalid HTTP Method

**Request:** `GET /api/webhook`

**Response:** `400 Bad Request`
```json
{
  "error": "Method not allowed. Only POST is supported."
}
```

### Example 16: Invalid JSON

**Request:** `POST /api/webhook` with body `"invalid json"`

**Response:** `400 Bad Request`
```json
{
  "error": "Invalid JSON format"
}
```

### Example 17: Missing Customer Data

**Request:** `POST /api/webhook` with payload missing `customer` field

**Response:** `400 Bad Request`
```json
{
  "error": "Customer data not found in payload"
}
```

### Example 18: Missing Email

**Request:** `POST /api/webhook` with customer missing `email` field

**Response:** `400 Bad Request`
```json
{
  "error": "Customer email is required"
}
```

### Example 19: Segment API Error

**Request:** Valid webhook payload but Segment API fails

**Response:** `500 Internal Server Error`
```json
{
  "error": "Failed to send data to Segment",
  "details": "Error message from Segment API"
}
```

---

## Testing Examples

### Example 20: E2E Test with Cucumber

**Feature File:**
```gherkin
Scenario: Complete flow for customer.created event creates user in Segment
  Given a valid Commercetools customer.created webhook payload with:
    | field      | value           |
    | email      | newuser@example.com|
    | firstName  | John            |
    | lastName   | Doe             |
    | street     | 123 Main St     |
    | city       | New York        |
    | postalCode | 10001           |
    | country    | US              |
  When I send the webhook payload to the webhook endpoint
  Then the webhook endpoint should return HTTP status 200
  And the customer should be created in Segment with userId "newuser@example.com"
  And the customer in Segment should have email "newuser@example.com" in traits
  And the customer in Segment should have name "John Doe" in traits
```

### Example 21: Unit Test for Transformer

```typescript
import { describe, it, expect } from 'vitest';
import { transformCustomerToSegment } from '../src/transformation/transformer.js';

describe('transformCustomerToSegment', () => {
  it('should transform customer with all fields', () => {
    const customer = {
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      addresses: [{
        streetName: 'Main St',
        streetNumber: '123',
        city: 'New York',
        postalCode: '10001',
        country: 'US'
      }]
    };

    const result = transformCustomerToSegment(customer);

    expect(result.userId).toBe('user@example.com');
    expect(result.traits.email).toBe('user@example.com');
    expect(result.traits.name).toBe('John Doe');
    expect(result.traits.address?.street).toBe('Main St 123');
    expect(result.traits.address?.city).toBe('New York');
  });
});
```

---

## Integration Patterns

### Example 22: Local Development

**Setup:**
1. Set `SEGMENT_WRITE_KEY` in `.env` file
2. Run `pnpm dev` to start local server
3. Webhook endpoint available at `http://localhost:3000/api/webhook`

**Test:**
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "notificationType": "Message",
    "type": "CustomerCreated",
    "resource": { "typeId": "customer", "id": "123" },
    "projectKey": "test",
    "id": "456",
    "version": 1,
    "sequenceNumber": 1,
    "resourceVersion": 1,
    "createdAt": "2025-01-27T12:00:00.000Z",
    "lastModifiedAt": "2025-01-27T12:00:00.000Z",
    "customer": {
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User"
    }
  }'
```

### Example 23: Vercel Deployment

**Setup:**
1. Deploy to Vercel
2. Set `SEGMENT_WRITE_KEY` in Vercel environment variables
3. Webhook endpoint available at `https://your-app.vercel.app/api/webhook`

**Test:**
```bash
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

---

## Common Use Cases

### Example 24: Minimal Customer Data

**Scenario:** Customer with only email (no name or address).

```typescript
const customer = {
  email: 'minimal@example.com'
};

const payload = transformCustomerToSegment(customer);
// Result:
// {
//   userId: 'minimal@example.com',
//   traits: {
//     email: 'minimal@example.com'
//   }
// }
```

### Example 25: Customer with Full Name

**Scenario:** Customer with fullName instead of firstName/lastName.

```typescript
const customer = {
  email: 'fullname@example.com',
  fullName: 'John Doe'
};

const payload = transformCustomerToSegment(customer);
// Result: name = 'John Doe' (fullName used)
```

### Example 26: Multiple Addresses

**Scenario:** Customer with multiple addresses (only first is used).

```typescript
const customer = {
  email: 'multiaddr@example.com',
  addresses: [
    { streetName: 'First St', city: 'City1' },
    { streetName: 'Second St', city: 'City2' }
  ]
};

const payload = transformCustomerToSegment(customer);
// Result: address uses first address only
```

**Story:** #5

