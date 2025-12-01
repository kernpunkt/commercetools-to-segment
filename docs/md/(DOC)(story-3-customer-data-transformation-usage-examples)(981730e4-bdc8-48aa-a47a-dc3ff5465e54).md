---
id: 981730e4-bdc8-48aa-a47a-dc3ff5465e54
title: STORY-3 Customer Data Transformation Usage Examples
tags:
  - status/implemented
  - issue-3
  - topic/examples
  - story-3
category: DOC
created_at: '2025-11-28T09:30:54.958Z'
updated_at: '2025-12-01T09:08:57.423Z'
last_reviewed: '2025-11-28T09:30:54.958Z'
links: []
sources: []
abstract: Usage examples and integration patterns for customer data transformation
---

# STORY-3 Customer Data Transformation Usage Examples

## Basic Usage

### Transform Customer with Email

```typescript
import { transformCustomerToSegment } from './transformation/transformer.js';
import type { CommercetoolsCustomer } from './transformation/types.js';

const customer: CommercetoolsCustomer = {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  fullName: null,
  addresses: null,
};

const result = transformCustomerToSegment(customer);
// Result:
// {
//   userId: 'user@example.com',
//   traits: {
//     email: 'user@example.com',
//     name: 'John Doe',
//   }
// }
```

### Transform Customer with Full Name

```typescript
const customer: CommercetoolsCustomer = {
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  fullName: 'Jane A. Smith', // Takes priority
  addresses: null,
};

const result = transformCustomerToSegment(customer);
// Result:
// {
//   userId: 'jane@example.com',
//   traits: {
//     email: 'jane@example.com',
//     name: 'Jane A. Smith', // Uses fullName, not firstName+lastName
//   }
// }
```

### Transform Customer with Address

```typescript
const customer: CommercetoolsCustomer = {
  email: 'user@example.com',
  firstName: null,
  lastName: null,
  fullName: null,
  addresses: [
    {
      streetName: 'Main St',
      streetNumber: '123',
      city: 'New York',
      postalCode: '10001',
      country: 'US',
    },
  ],
};

const result = transformCustomerToSegment(customer);
// Result:
// {
//   userId: 'user@example.com',
//   traits: {
//     email: 'user@example.com',
//     address: {
//       street: 'Main St 123', // Combined streetName + streetNumber
//       city: 'New York',
//       postalCode: '10001',
//       country: 'US',
//     }
//   }
// }
```

## Edge Cases

### Missing Email

```typescript
const customer: CommercetoolsCustomer = {
  email: null,
  firstName: 'John',
  lastName: 'Doe',
  fullName: null,
  addresses: null,
};

const result = transformCustomerToSegment(customer);
// Result:
// {
//   userId: '', // Empty string, not undefined
//   traits: {
//     email: '', // Empty string, not undefined
//     name: 'John Doe',
//   }
// }
```

### Missing Name Fields

```typescript
const customer: CommercetoolsCustomer = {
  email: 'user@example.com',
  firstName: null,
  lastName: null,
  fullName: null,
  addresses: null,
};

const result = transformCustomerToSegment(customer);
// Result:
// {
//   userId: 'user@example.com',
//   traits: {
//     email: 'user@example.com',
//     // name is omitted (undefined)
//   }
// }
```

### Partial Address

```typescript
const customer: CommercetoolsCustomer = {
  email: 'user@example.com',
  firstName: null,
  lastName: null,
  fullName: null,
  addresses: [
    {
      streetName: 'Broadway',
      streetNumber: null,
      city: 'New York',
      postalCode: null,
      country: null,
    },
  ],
};

const result = transformCustomerToSegment(customer);
// Result:
// {
//   userId: 'user@example.com',
//   traits: {
//     email: 'user@example.com',
//     address: {
//       street: 'Broadway', // Only streetName, no streetNumber
//       city: 'New York',
//       // postalCode and country omitted
//     }
//   }
// }
```

### All Null Address Fields

```typescript
const customer: CommercetoolsCustomer = {
  email: 'user@example.com',
  firstName: null,
  lastName: null,
  fullName: null,
  addresses: [
    {
      streetName: null,
      streetNumber: null,
      city: null,
      postalCode: null,
      country: null,
    },
  ],
};

const result = transformCustomerToSegment(customer);
// Result:
// {
//   userId: 'user@example.com',
//   traits: {
//     email: 'user@example.com',
//     // address is undefined (all fields null)
//   }
// }
```

## Integration Patterns

### Webhook Handler Integration

```typescript
import { transformCustomerToSegment } from './transformation/transformer.js';
import { segmentClient } from './segment/client.js';
import type { CommercetoolsCustomer } from './transformation/types.js';

async function handleCustomerWebhook(
  customer: CommercetoolsCustomer
): Promise<void> {
  // Transform to Segment format
  const payload = transformCustomerToSegment(customer);
  
  // Send to Segment
  await segmentClient.identify({
    userId: payload.userId,
    traits: payload.traits,
  });
}
```

### Batch Processing

```typescript
import { transformCustomerToSegment } from './transformation/transformer.js';
import type { CommercetoolsCustomer } from './transformation/types.js';

function transformCustomers(
  customers: ReadonlyArray<CommercetoolsCustomer>
): ReadonlyArray<SegmentIdentifyPayload> {
  return customers.map(transformCustomerToSegment);
}
```

### Validation Before Transformation

```typescript
import { transformCustomerToSegment } from './transformation/transformer.js';
import type { CommercetoolsCustomer } from './transformation/types.js';

function transformWithValidation(
  customer: CommercetoolsCustomer
): SegmentIdentifyPayload | null {
  // Optional: Validate customer data before transformation
  if (!customer.email || customer.email.trim() === '') {
    console.warn('Customer missing email, userId will be empty string');
  }
  
  return transformCustomerToSegment(customer);
}
```

## Name Priority Examples

### Priority 1: fullName

```typescript
const customer = {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'Jane Smith', // Takes priority
  addresses: null,
};

const result = transformCustomerToSegment(customer);
// result.traits.name === 'Jane Smith' (not 'John Doe')
```

### Priority 2: firstName + lastName

```typescript
const customer = {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  fullName: null,
  addresses: null,
};

const result = transformCustomerToSegment(customer);
// result.traits.name === 'John Doe'
```

### Priority 3: firstName only

```typescript
const customer = {
  email: 'user@example.com',
  firstName: 'Jane',
  lastName: null,
  fullName: null,
  addresses: null,
};

const result = transformCustomerToSegment(customer);
// result.traits.name === 'Jane'
```

### Priority 4: lastName only

```typescript
const customer = {
  email: 'user@example.com',
  firstName: null,
  lastName: 'Smith',
  fullName: null,
  addresses: null,
};

const result = transformCustomerToSegment(customer);
// result.traits.name === 'Smith'
```