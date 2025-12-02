---
id: a1b2c3d4-e5f6-7890-1234-567890abcdef
title: STORY-18 Lambda Handler API Documentation
tags:
  - story-18
  - status/implemented
  - topic/api
  - component/lambda
  - component/sns
  - component/adapter
category: DOC
created_at: '2025-12-02T10:00:00.000Z'
updated_at: '2025-12-02T10:00:00.000Z'
last_reviewed: '2025-12-02T10:00:00.000Z'
links: []
sources: []
abstract: >-
  Complete API documentation for Lambda handler components: handler function,
  adapter functions, customer extractor, and type definitions
---

# STORY-18 Lambda Handler API Documentation

**Component:** AWS Lambda Handler for SNS Events  
**Story:** #18  
**Last Updated:** 2025-12-02

## Overview

The Lambda handler processes AWS SNS events containing Commercetools webhook payloads. It extracts payloads from SNS Message fields, validates and transforms customer data, and sends it to Segment. The implementation reuses existing business logic (validator, transformer, integration service) while adapting SNS event format to the existing request format.

## Public Interfaces

### Lambda Handler

#### `handler(event: SNSEvent, context: Context): Promise<LambdaResponse>`

Main Lambda handler function for processing SNS events.

**Location:** `src/lambda/handler.ts`

**Parameters:**
- **`event: SNSEvent`** - AWS SNS event from Lambda invocation
- **`context: Context`** - AWS Lambda context (unused but required by Lambda interface)

**Returns:** `Promise<LambdaResponse>`
- Success: `{ statusCode: 200, body: JSON.stringify({ success: true, processed: number }) }`
- Error: `{ statusCode: 400 | 500, body: JSON.stringify({ success: false, error: string }) }`

**Behavior:**
1. Processes each record in `event.Records` array in parallel
2. For each record:
   - Checks if record is subscription confirmation (handles separately)
   - Extracts Commercetools payload from `Sns.Message` field
   - Converts payload to request body format
   - Validates payload using existing validator
   - Extracts customer data from payload
   - Transforms customer data to Segment format
   - Sends data to Segment API
3. Aggregates results across all records
4. Returns success if all records succeed, failure if any record fails

**Error Handling:**
- **400 Bad Request:** Invalid payload, missing customer data, or validation failure
- **500 Internal Server Error:** Segment API failure or unexpected errors

**Example:**
```typescript
import handler from './src/lambda/handler.js';
import type { SNSEvent } from './src/lambda/types.js';
import type { Context } from 'aws-lambda';

const event: SNSEvent = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:topic:subscription-id',
      Sns: {
        Type: 'Notification',
        MessageId: 'message-id',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:topic',
        Message: JSON.stringify({
          notificationType: 'Message',
          type: 'CustomerCreated',
          resource: { typeId: 'customer', id: 'customer-123' },
          customer: { email: 'test@example.com' },
        }),
        Timestamp: '2024-01-01T00:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'signature',
        SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
        UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
      },
    },
  ],
};

const context: Context = {
  // ... Lambda context
} as Context;

const response = await handler(event, context);
// { statusCode: 200, body: '{"success":true,"processed":1}' }
```

## Adapter Functions

### `extractCommercetoolsPayload(snsEvent: SNSEvent): CommercetoolsWebhookPayload | null`

Extracts Commercetools webhook payload from SNS event.

**Location:** `src/lambda/adapter.ts`

**Parameters:**
- **`snsEvent: SNSEvent`** - SNS event from AWS Lambda

**Returns:** `CommercetoolsWebhookPayload | null`
- Success: Commercetools payload object
- Failure: `null` if extraction fails (no records, invalid JSON, or non-Commercetools payload)

**Behavior:**
1. Checks if `snsEvent.Records` has at least one record
2. Extracts `Message` field from first record's `Sns.Message`
3. Parses JSON string from `Message` field
4. Validates parsed object is a Commercetools payload (has `notificationType`, `type`, `resource` fields)
5. Returns payload or `null` if validation fails

**Example:**
```typescript
import { extractCommercetoolsPayload } from './src/lambda/adapter.js';
import type { SNSEvent } from './src/lambda/types.js';

const snsEvent: SNSEvent = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:topic:sub-id',
      Sns: {
        Type: 'Notification',
        MessageId: 'msg-id',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:topic',
        Message: JSON.stringify({
          notificationType: 'Message',
          type: 'CustomerCreated',
          resource: { typeId: 'customer', id: 'customer-123' },
        }),
        Timestamp: '2024-01-01T00:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'sig',
        SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
        UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
      },
    },
  ],
};

const payload = extractCommercetoolsPayload(snsEvent);
// { notificationType: 'Message', type: 'CustomerCreated', ... }
```

### `parseSnsMessage(message: string): unknown`

Parses JSON string from SNS Message field.

**Location:** `src/lambda/adapter.ts`

**Parameters:**
- **`message: string`** - JSON string from SNS Message field

**Returns:** `unknown`
- Success: Parsed object
- Failure: `null` if message is empty or invalid JSON

**Behavior:**
1. Returns `null` if message is empty string
2. Attempts to parse JSON using `JSON.parse()`
3. Returns parsed object or `null` if parsing fails

**Example:**
```typescript
import { parseSnsMessage } from './src/lambda/adapter.js';

const message = '{"key":"value"}';
const parsed = parseSnsMessage(message);
// { key: 'value' }

const invalid = parseSnsMessage('invalid json');
// null
```

### `isSubscriptionConfirmation(record: SNSRecord): boolean`

Checks if SNS record is a subscription confirmation.

**Location:** `src/lambda/adapter.ts`

**Parameters:**
- **`record: SNSRecord`** - SNS record to check

**Returns:** `boolean`
- `true` if `record.Sns.Type === 'SubscriptionConfirmation'`
- `false` otherwise

**Example:**
```typescript
import { isSubscriptionConfirmation } from './src/lambda/adapter.js';
import type { SNSRecord } from './src/lambda/types.js';

const record: SNSRecord = {
  EventSource: 'aws:sns',
  EventVersion: '1.0',
  EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:topic:sub-id',
  Sns: {
    Type: 'SubscriptionConfirmation',
    MessageId: 'msg-id',
    TopicArn: 'arn:aws:sns:us-east-1:123456789012:topic',
    Message: '...',
    Timestamp: '2024-01-01T00:00:00.000Z',
    SignatureVersion: '1',
    Signature: 'sig',
    SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
    UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
  },
};

const isSub = isSubscriptionConfirmation(record);
// true
```

### `convertToRequestBody(payload: CommercetoolsWebhookPayload): RequestBody`

Converts Commercetools payload to request body format compatible with existing validator.

**Location:** `src/lambda/adapter.ts`

**Parameters:**
- **`payload: CommercetoolsWebhookPayload`** - Commercetools webhook payload

**Returns:** `RequestBody`
- Request body format with all required fields mapped from payload

**Behavior:**
1. Maps all fields from Commercetools payload to request body format
2. Preserves `customer` field if present
3. Returns request body compatible with existing `validatePayload()` function

**Example:**
```typescript
import { convertToRequestBody } from './src/lambda/adapter.js';
import type { CommercetoolsWebhookPayload } from './src/webhook/types.js';

const payload: CommercetoolsWebhookPayload = {
  notificationType: 'Message',
  type: 'CustomerCreated',
  resource: { typeId: 'customer', id: 'customer-123' },
  projectKey: 'test-project',
  id: 'notification-id',
  version: 1,
  sequenceNumber: 1,
  resourceVersion: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastModifiedAt: '2024-01-01T00:00:00.000Z',
  customer: { email: 'test@example.com' },
};

const requestBody = convertToRequestBody(payload);
// { notificationType: 'Message', type: 'CustomerCreated', ... }
```

## Customer Extractor

### `extractCustomerFromPayload(payload: unknown): CommercetoolsCustomer | null`

Extracts customer data from webhook payload.

**Location:** `src/lambda/customer-extractor.ts`

**Parameters:**
- **`payload: unknown`** - Webhook payload (request body format)

**Returns:** `CommercetoolsCustomer | null`
- Success: Customer object with email, firstName, lastName, fullName, addresses
- Failure: `null` if payload is not a record or customer field is missing/invalid

**Behavior:**
1. Validates payload is a record (object)
2. Extracts `customer` field from payload
3. Validates customer field is a record
4. Extracts customer properties (email, firstName, lastName, fullName, addresses)
5. Handles address extraction (single address or array of addresses)
6. Returns customer object with only defined fields

**Example:**
```typescript
import { extractCustomerFromPayload } from './src/lambda/customer-extractor.js';

const payload = {
  notificationType: 'Message',
  type: 'CustomerCreated',
  customer: {
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    addresses: [
      {
        streetName: 'Main St',
        streetNumber: '123',
        city: 'New York',
        postalCode: '10001',
        country: 'US',
      },
    ],
  },
};

const customer = extractCustomerFromPayload(payload);
// { email: 'test@example.com', firstName: 'John', lastName: 'Doe', ... }
```

## Type Definitions

### `SNSEvent`

SNS event structure from AWS Lambda.

```typescript
interface SNSEvent {
  readonly Records: ReadonlyArray<SNSRecord>;
}
```

**Properties:**
- **`Records: ReadonlyArray<SNSRecord>`** - Array of SNS records (typically one record per invocation)

### `SNSRecord`

Single SNS record structure.

```typescript
interface SNSRecord {
  readonly EventSource: 'aws:sns';
  readonly EventVersion: string;
  readonly EventSubscriptionArn: string;
  readonly Sns: SNSMessage;
}
```

**Properties:**
- **`EventSource: 'aws:sns'`** - Always `'aws:sns'` for SNS events
- **`EventVersion: string`** - Event version (typically `'1.0'`)
- **`EventSubscriptionArn: string`** - Subscription ARN
- **`Sns: SNSMessage`** - SNS message object

### `SNSMessage`

SNS message structure.

```typescript
interface SNSMessage {
  readonly Type: 'Notification' | 'SubscriptionConfirmation';
  readonly MessageId: string;
  readonly TopicArn: string;
  readonly Subject?: string;
  readonly Message: string; // JSON string containing Commercetools payload
  readonly Timestamp: string;
  readonly SignatureVersion: string;
  readonly Signature: string;
  readonly SigningCertUrl: string;
  readonly UnsubscribeUrl: string;
  readonly MessageAttributes?: Record<string, unknown>;
}
```

**Properties:**
- **`Type: 'Notification' | 'SubscriptionConfirmation'`** - Message type
- **`MessageId: string`** - Unique message identifier
- **`TopicArn: string`** - SNS topic ARN
- **`Subject?: string`** - Optional message subject
- **`Message: string`** - JSON string containing Commercetools payload (required)
- **`Timestamp: string`** - ISO timestamp
- **`SignatureVersion: string`** - Signature version
- **`Signature: string`** - Message signature
- **`SigningCertUrl: string`** - Certificate URL for signature verification
- **`UnsubscribeUrl: string`** - URL to unsubscribe from topic
- **`MessageAttributes?: Record<string, unknown>`** - Optional message attributes

### `LambdaResponse`

Lambda function response structure.

```typescript
interface LambdaResponse {
  readonly statusCode: number;
  readonly body: string;
  readonly headers?: Record<string, string>;
}
```

**Properties:**
- **`statusCode: number`** - HTTP status code (200, 400, 500)
- **`body: string`** - JSON string response body
- **`headers?: Record<string, string>`** - Optional response headers

### `ProcessingResult`

Processing result for a single SNS record.

```typescript
interface ProcessingResult {
  readonly success: boolean;
  readonly statusCode: number;
  readonly error?: string;
}
```

**Properties:**
- **`success: boolean`** - Whether processing succeeded
- **`statusCode: number`** - HTTP status code
- **`error?: string`** - Error message if processing failed

### `RequestBody`

Request body format compatible with existing validator.

```typescript
interface RequestBody {
  readonly notificationType: 'Message';
  readonly type: string;
  readonly resource: {
    readonly typeId: string;
    readonly id: string;
  };
  readonly projectKey: string;
  readonly id: string;
  readonly version: number;
  readonly sequenceNumber: number;
  readonly resourceVersion: number;
  readonly createdAt: string;
  readonly lastModifiedAt: string;
  readonly customer?: unknown;
}
```

**Properties:**
- **`notificationType: 'Message'`** - Always `'Message'` for Commercetools notifications
- **`type: string`** - Event type (e.g., `'CustomerCreated'`, `'CustomerUpdated'`)
- **`resource: { typeId: string; id: string }`** - Resource type and ID
- **`projectKey: string`** - Commercetools project key
- **`id: string`** - Notification ID
- **`version: number`** - Notification version
- **`sequenceNumber: number`** - Sequence number
- **`resourceVersion: number`** - Resource version
- **`createdAt: string`** - ISO timestamp
- **`lastModifiedAt: string`** - ISO timestamp
- **`customer?: unknown`** - Optional customer data

## Error Handling

### Error Status Codes

- **200 OK:** Successful processing
- **400 Bad Request:** Invalid payload, missing customer data, validation failure
- **500 Internal Server Error:** Segment API failure, unexpected errors

### Error Response Format

```typescript
{
  statusCode: 400 | 500,
  body: JSON.stringify({
    success: false,
    error: string,
    processed?: number,
  }),
}
```

### Common Error Scenarios

1. **Invalid JSON in SNS Message:**
   - Status: `400`
   - Error: `"Failed to parse SNS Message as Commercetools payload"`

2. **Payload Validation Failure:**
   - Status: `400`
   - Error: `"Invalid payload or customer data not found"`

3. **Missing Customer Data:**
   - Status: `400`
   - Error: `"Invalid payload or customer data not found"`

4. **Missing Email:**
   - Status: `400`
   - Error: `"Customer email is required"`

5. **Segment API Failure:**
   - Status: `500`
   - Error: Segment error message

6. **Unexpected Error:**
   - Status: `500`
   - Error: Error message or `"Internal server error"`

## Dependencies

### External Dependencies

- `aws-lambda` - AWS Lambda types (`Context`)
- `@segment/analytics-node` - Segment client (via integration service)

### Internal Dependencies

- `src/webhook/validator.ts` - Payload validation
- `src/transformation/transformer.ts` - Customer data transformation
- `src/integration/service.ts` - Segment API integration
- `src/logger.ts` - Logging utilities

## Environment Variables

- **`SEGMENT_WRITE_KEY`** (required) - Segment write key for API authentication

## Related Documentation

- [STORY-18 Architecture Design](../ARC/story-18-lambda-handler-architecture-design.md)
- [STORY-18 Interfaces and Data Models](../ARC/story-18-lambda-handler-interfaces-and-data-models.md)
- [STORY-18 Usage Examples](./story-18-lambda-handler-usage-examples.md)
- [STORY-18 Troubleshooting Guide](./story-18-lambda-handler-troubleshooting-guide.md)

