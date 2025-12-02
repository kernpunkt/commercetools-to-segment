---
id: 831721e9-3047-4609-90ce-206121008214
title: STORY-19 Lambda Customer Extractor API Documentation
tags:
  - story-19
  - status/implemented
  - topic/api
  - component/lambda
  - component/extraction
  - component/customer
category: DOC
created_at: '2025-12-02T13:06:23.622Z'
updated_at: '2025-12-02T13:18:53.374Z'
last_reviewed: '2025-12-02T13:06:23.622Z'
links: []
sources: []
abstract: >-
  Lambda customer extractor API documentation: function signatures, type
  definitions, usage patterns, error handling, and integration points for
  extracting customer data from Commercetools webhook payloads.
---

# Lambda Customer Extractor API Documentation - Story-19

## Overview

The `customer-extractor.ts` module provides utilities for extracting customer data from Commercetools webhook payloads in Lambda functions. It handles SNS event parsing and customer data extraction.

## Public Interface

### Module: `src/lambda/customer-extractor.ts`

### Function: `extractCustomerFromPayload`

Extracts customer data from webhook payload.

**Signature:**
```typescript
export function extractCustomerFromPayload(
  payload: unknown
): CommercetoolsCustomer | null
```

**Parameters:**
- `payload` (unknown): Webhook payload (can be any structure)

**Returns:**
- `CommercetoolsCustomer | null`: Extracted customer data, or `null` if extraction fails

**Behavior:**
- Validates payload structure
- Extracts customer object from payload
- Extracts customer fields: `email`, `firstName`, `lastName`, `fullName`, `addresses`
- Handles missing or invalid fields gracefully
- Returns `null` if payload structure is invalid

**Type Safety:**
- Uses type guards to validate payload structure
- Returns `null` for invalid input (never throws)
- Handles `undefined` values by converting to `null`

**Example:**
```typescript
import { extractCustomerFromPayload } from './customer-extractor';

// From SNS event
const snsMessage = JSON.parse(event.Records[0].Sns.Message);
const customer = extractCustomerFromPayload(snsMessage);

if (customer) {
  // Process customer data
  console.log(customer.email);
}
```

## Type Definitions

### `CommercetoolsCustomer`

**Location:** `src/transformation/types.ts`

**Structure:**
```typescript
interface CommercetoolsCustomer {
  readonly email?: string | null;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly fullName?: string | null;
  readonly addresses?: ReadonlyArray<{
    readonly streetName?: string | null;
    readonly streetNumber?: string | null;
    readonly city?: string | null;
    readonly postalCode?: string | null;
    readonly country?: string | null;
  }> | null;
}
```

**Field Details:**

- `email` (string | null, optional): Customer email address
- `firstName` (string | null, optional): Customer first name
- `lastName` (string | null, optional): Customer last name
- `fullName` (string | null, optional): Customer full name
- `addresses` (array | null, optional): Array of customer addresses

**Address Structure:**
- `streetName` (string | null, optional): Street name
- `streetNumber` (string | null, optional): Street number
- `city` (string | null, optional): City name
- `postalCode` (string | null, optional): Postal/ZIP code
- `country` (string | null, optional): Country code

## Internal Functions

### `isRecord(value: unknown): value is Record<string, unknown>`

Type guard to check if value is a record object.

**Parameters:**
- `value` (unknown): Value to check

**Returns:**
- `boolean`: `true` if value is a non-null object

### `extractStringOrNull(value: unknown): string | null`

Helper to extract string or null value (never undefined).

**Parameters:**
- `value` (unknown): Value to extract

**Returns:**
- `string | null`: String value or null

**Behavior:**
- Returns `null` if value is `undefined`
- Returns `null` if value is not a string
- Returns string value if valid

### `extractAddress(addrRecord: Record<string, unknown>): Address`

Extract address from address record.

**Parameters:**
- `addrRecord` (Record<string, unknown>): Address record object

**Returns:**
- Address object with extracted fields

### `extractAddresses(addresses: unknown): ReadonlyArray<Address> | null`

Extract addresses array from customer record.

**Parameters:**
- `addresses` (unknown): Addresses value (can be array, null, or invalid)

**Returns:**
- `ReadonlyArray<Address> | null`: Array of addresses or null

**Behavior:**
- Returns `null` if addresses is `null`
- Returns `null` if addresses is not an array
- Maps array items to address objects
- Returns empty object `{}` for invalid array items

## Usage Patterns

### Pattern 1: SNS Event Processing

```typescript
import { SNSEvent } from 'aws-lambda';
import { extractCustomerFromPayload } from './customer-extractor';

export async function handler(event: SNSEvent): Promise<void> {
  for (const record of event.Records) {
    try {
      // Parse SNS message (JSON string)
      const snsMessage = JSON.parse(record.Sns.Message);
      
      // Extract customer data
      const customer = extractCustomerFromPayload(snsMessage);
      
      if (customer) {
        // Process customer
        console.log('Customer extracted:', customer.email);
      } else {
        console.warn('Failed to extract customer from payload');
      }
    } catch (error) {
      console.error('Error processing SNS record:', error);
      throw error;
    }
  }
}
```

### Pattern 2: Direct Payload Processing

```typescript
import { extractCustomerFromPayload } from './customer-extractor';

// Direct payload (e.g., from test or other source)
const payload = {
  customer: {
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe'
  }
};

const customer = extractCustomerFromPayload(payload);
if (customer) {
  // Use customer data
}
```

### Pattern 3: Error Handling

```typescript
import { extractCustomerFromPayload } from './customer-extractor';

function processPayload(payload: unknown): void {
  const customer = extractCustomerFromPayload(payload);
  
  if (!customer) {
    // Handle extraction failure
    console.warn('Invalid payload structure');
    return;
  }
  
  // Validate required fields
  if (!customer.email) {
    console.warn('Customer missing email');
    return;
  }
  
  // Process customer
  processCustomer(customer);
}
```

## Error Handling

### Null Returns

The function returns `null` (never throws) for:
- Invalid payload structure (not an object)
- Missing `customer` field
- Invalid `customer` field (not an object)

### Type Safety

- All field extractions use type guards
- `undefined` values are converted to `null`
- Invalid types are converted to `null`
- Arrays are validated before processing

## Integration Points

### With SNS Events

The extractor is designed to work with SNS-triggered Lambda events:

1. SNS event contains `Records[].Sns.Message` (JSON string)
2. Parse message: `JSON.parse(record.Sns.Message)`
3. Extract customer: `extractCustomerFromPayload(parsedMessage)`
4. Process customer data

### With Transformation Layer

The extracted customer data matches the `CommercetoolsCustomer` type used by:
- `src/transformation/transformer.ts` - Customer data transformation
- `src/integration/service.ts` - Integration service

### With Segment Integration

The extracted customer data is used by:
- `src/segment/client.ts` - Segment API client
- `src/integration/service.ts` - Integration service

## Testing

See `tests/transformation/transformer.test.ts` for related tests.

**Test Coverage:**
- Valid payload extraction
- Invalid payload handling
- Missing field handling
- Address extraction
- Type safety validation

## Dependencies

- `src/transformation/types.ts` - Type definitions

## Notes

- Function is pure (no side effects)
- Function is idempotent (same input = same output)
- Function handles all edge cases gracefully
- Function never throws (returns null for errors)