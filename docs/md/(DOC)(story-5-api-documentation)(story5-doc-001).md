---
id: story5-doc-001
title: STORY-5 API Documentation
tags:
  - status/implemented
  - story-5
  - topic/api
  - component/webhook-handler
  - component/transformer
  - component/integration-service
  - component/segment-client
category: DOC
created_at: '2025-01-27T12:00:00.000Z'
updated_at: '2025-01-27T12:00:00.000Z'
last_reviewed: '2025-01-27T12:00:00.000Z'
links: []
sources: []
---

# API Documentation for Story 5: End-to-End Integration

## Webhook Handler API

### `handler(req: VercelRequest, res: VercelResponse): Promise<void>`

Vercel serverless function handler for Commercetools webhook endpoint.

**Location:** `api/webhook.ts`

**Parameters:**
- `req: VercelRequest` - Vercel request object containing webhook payload
- `res: VercelResponse` - Vercel response object for sending HTTP responses

**Returns:** `Promise<void>`

**Behavior:**
1. Validates HTTP method (must be POST)
2. Parses JSON request body
3. Validates Commercetools webhook payload structure
4. Extracts customer data from payload
5. Transforms customer data to Segment format
6. Sends data to Segment via integration service
7. Returns appropriate HTTP status code

**Response Codes:**
- `200 OK` - Success: `{ eventType: string, success: true }`
- `400 Bad Request` - Invalid method, JSON, payload, or missing customer data
- `500 Internal Server Error` - Segment API error

**Example:**
```typescript
// Handled automatically by Vercel when POST /api/webhook is called
// No direct invocation needed
```

**Error Handling:**
- Invalid method → 400 with `{ error: 'Method not allowed. Only POST is supported.' }`
- Invalid JSON → 400 with `{ error: string }`
- Invalid payload → 400 with `{ error: string }`
- Missing customer → 400 with `{ error: 'Customer data not found in payload' }`
- Missing email → 400 with `{ error: 'Customer email is required' }`
- Segment error → 500 with `{ error: 'Failed to send data to Segment', details: string }`

---

## Data Transformer API

### `transformCustomerToSegment(customer: CommercetoolsCustomer): SegmentIdentifyPayload`

Transforms Commercetools customer data to Segment Identify API format.

**Location:** `src/transformation/transformer.ts`

**Parameters:**
- `customer: CommercetoolsCustomer` - Commercetools customer resource data
  ```typescript
  interface CommercetoolsCustomer {
    readonly email?: string | null;
    readonly firstName?: string | null;
    readonly lastName?: string | null;
    readonly fullName?: string | null;
    readonly addresses?: ReadonlyArray<CommercetoolsAddress> | null;
  }
  ```

**Returns:** `SegmentIdentifyPayload`
```typescript
interface SegmentIdentifyPayload {
  readonly userId: string; // email (or empty string if missing)
  readonly traits: UserTraits;
}
```

**Behavior:**
1. Extracts email as userId (empty string if missing)
2. Extracts name with priority: fullName > firstName+lastName > firstName > lastName
3. Extracts address from first address in addresses array
4. Combines streetName and streetNumber into street field
5. Builds traits object with email, name (if available), and address (if available)

**Name Extraction Priority:**
1. `fullName` (if present and non-empty)
2. `firstName + lastName` (if both present)
3. `firstName` (if present)
4. `lastName` (if present)
5. `undefined` (if none present)

**Address Extraction:**
- Uses first address from addresses array
- Combines `streetName` and `streetNumber` into `street` field
- Includes `city`, `postalCode`, `country` if available
- Returns `undefined` if no addresses or all fields are empty

**Example:**
```typescript
const customer: CommercetoolsCustomer = {
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

const payload = transformCustomerToSegment(customer);
// Result:
// {
//   userId: 'user@example.com',
//   traits: {
//     email: 'user@example.com',
//     name: 'John Doe',
//     address: {
//       street: 'Main St 123',
//       city: 'New York',
//       postalCode: '10001',
//       country: 'US'
//     }
//   }
// }
```

**Edge Cases:**
- Missing email → userId is empty string (validation should catch this)
- Missing name fields → name is undefined in traits
- Missing addresses → address is undefined in traits
- Empty address fields → address is undefined in traits

---

## Integration Service API

### `sendCustomerToSegment(payload: Readonly<SegmentIdentifyPayload>): Promise<SegmentIntegrationResult>`

Sends customer data to Segment Identify API using client from environment.

**Location:** `src/integration/service.ts`

**Parameters:**
- `payload: Readonly<SegmentIdentifyPayload>` - Segment identify payload
  ```typescript
  interface SegmentIdentifyPayload {
    readonly userId: string;
    readonly traits: UserTraits;
  }
  ```

**Returns:** `Promise<SegmentIntegrationResult>`
```typescript
type SegmentIntegrationResult =
  | { success: true }
  | { success: false; error: SegmentError };

interface SegmentError {
  readonly message: string;
  readonly code?: string;
}
```

**Behavior:**
1. Gets Segment client from environment configuration
2. Calls `client.identify()` with userId and traits
3. Calls `client.flush()` with 5-second timeout
4. Returns success or error result

**Environment Requirements:**
- `SEGMENT_WRITE_KEY` must be set in environment variables

**Example:**
```typescript
const payload: SegmentIdentifyPayload = {
  userId: 'user@example.com',
  traits: {
    email: 'user@example.com',
    name: 'John Doe',
    address: {
      street: '123 Main St',
      city: 'New York',
      postalCode: '10001',
      country: 'US'
    }
  }
};

const result = await sendCustomerToSegment(payload);
if (result.success) {
  console.log('User sent to Segment successfully');
} else {
  console.error('Error:', result.error.message);
}
```

**Error Handling:**
- Missing `SEGMENT_WRITE_KEY` → Returns `{ success: false, error: { message: string } }`
- Segment client error → Returns `{ success: false, error: { message: string } }`
- Flush timeout → Returns `{ success: false, error: { message: 'Flush operation timed out after 5 seconds' } }`

### `sendCustomerToSegmentWithClient(client: Readonly<SegmentClient>, payload: Readonly<SegmentIdentifyPayload>): Promise<SegmentIntegrationResult>`

Sends customer data to Segment Identify API using provided client.

**Location:** `src/integration/service.ts`

**Parameters:**
- `client: Readonly<SegmentClient>` - Segment client instance
- `payload: Readonly<SegmentIdentifyPayload>` - Segment identify payload

**Returns:** `Promise<SegmentIntegrationResult>`

**Use Case:** Useful for testing with mock clients or custom client instances.

**Example:**
```typescript
const mockClient: SegmentClient = {
  identify: async () => {},
  flush: async () => {},
  closeAndFlush: async () => {}
};

const result = await sendCustomerToSegmentWithClient(mockClient, payload);
```

---

## Segment Client API

### `createSegmentClient(writeKey: string): SegmentClient`

Creates a Segment Analytics client instance.

**Location:** `src/segment/client.ts`

**Parameters:**
- `writeKey: string` - Segment write key (must be non-empty after trimming)

**Returns:** `SegmentClient`
```typescript
interface SegmentClient {
  identify(params: {
    readonly userId: string;
    readonly traits: UserTraits;
  }): Promise<void>;
  flush(): Promise<void>;
  closeAndFlush(): Promise<void>;
}
```

**Throws:** `Error` if writeKey is empty or whitespace only

**Example:**
```typescript
const client = createSegmentClient('your-segment-write-key');
await client.identify({
  userId: 'user@example.com',
  traits: { email: 'user@example.com' }
});
await client.flush();
```

### `getSegmentClientFromEnvironment(): SegmentClient`

Gets Segment client from environment configuration.

**Location:** `src/segment/client.ts`

**Returns:** `SegmentClient`

**Environment Requirements:**
- `SEGMENT_WRITE_KEY` must be set in environment variables

**Throws:** `Error` if `SEGMENT_WRITE_KEY` is missing or invalid

**Example:**
```typescript
const client = getSegmentClientFromEnvironment();
await client.identify({
  userId: 'user@example.com',
  traits: { email: 'user@example.com' }
});
```

---

## Webhook Validator API

### `validateMethod(method: string | undefined): boolean`

Validates that the HTTP method is POST.

**Location:** `src/webhook/validator.ts`

**Parameters:**
- `method: string | undefined` - HTTP method string

**Returns:** `boolean` - true if method is POST, false otherwise

**Example:**
```typescript
if (!validateMethod(req.method)) {
  return res.status(400).json({ error: 'Method not allowed' });
}
```

### `parseJSON(body: unknown): { success: true; data: unknown } | { success: false; error: string }`

Parses JSON string or returns object if already parsed.

**Location:** `src/webhook/validator.ts`

**Parameters:**
- `body: unknown` - JSON string to parse or already parsed object

**Returns:** Result object with parsed data or error message

**Example:**
```typescript
const parseResult = parseJSON(req.body);
if (!parseResult.success) {
  return res.status(400).json({ error: parseResult.error });
}
const payload = parseResult.data;
```

### `validatePayload(payload: unknown): WebhookValidationResult`

Validates payload structure against Commercetools webhook format.

**Location:** `src/webhook/validator.ts`

**Parameters:**
- `payload: unknown` - Parsed JSON payload

**Returns:** `WebhookValidationResult`
```typescript
interface WebhookValidationResult {
  readonly isValid: boolean;
  readonly eventType?: WebhookEventType;
  readonly error?: string;
}

type WebhookEventType = 'customer.created' | 'customer.updated';
```

**Validates:**
- `notificationType` must be `'Message'`
- `type` must be a non-empty string
- `resource` must have `typeId` and `id` fields
- `projectKey`, `id`, `version`, `sequenceNumber`, `resourceVersion`, `createdAt`, `lastModifiedAt` must be present and valid
- `type` must map to recognized event type (`CustomerCreated` → `'customer.created'`, `CustomerUpdated` → `'customer.updated'`)

**Example:**
```typescript
const validationResult = validatePayload(parseResult.data);
if (!validationResult.isValid) {
  return res.status(400).json({ error: validationResult.error });
}
const eventType = validationResult.eventType; // 'customer.created' | 'customer.updated'
```

### `identifyEventType(payload: CommercetoolsWebhookPayload): WebhookEventType | undefined`

Identifies event type from validated payload.

**Location:** `src/webhook/validator.ts`

**Parameters:**
- `payload: CommercetoolsWebhookPayload` - Validated Commercetools webhook payload

**Returns:** `WebhookEventType | undefined`

**Mapping:**
- `'CustomerCreated'` → `'customer.created'`
- `'CustomerUpdated'` → `'customer.updated'`
- Other types → `undefined`

**Example:**
```typescript
const eventType = identifyEventType(payload);
if (eventType === undefined) {
  return res.status(400).json({ error: 'Unrecognized event type' });
}
```

---

## Type Definitions

### CommercetoolsCustomer
```typescript
interface CommercetoolsCustomer {
  readonly email?: string | null;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly fullName?: string | null;
  readonly addresses?: ReadonlyArray<CommercetoolsAddress> | null;
}
```

### CommercetoolsAddress
```typescript
interface CommercetoolsAddress {
  readonly streetName?: string | null;
  readonly streetNumber?: string | null;
  readonly city?: string | null;
  readonly postalCode?: string | null;
  readonly country?: string | null;
}
```

### SegmentIdentifyPayload
```typescript
interface SegmentIdentifyPayload {
  readonly userId: string;
  readonly traits: UserTraits;
}
```

### UserTraits
```typescript
interface UserTraits {
  readonly email: string;
  readonly name?: string;
  readonly address?: Address;
}
```

### Address
```typescript
interface Address {
  readonly street?: string;
  readonly city?: string;
  readonly postalCode?: string;
  readonly country?: string;
}
```

### SegmentIntegrationResult
```typescript
type SegmentIntegrationResult =
  | { success: true }
  | { success: false; error: SegmentError };

interface SegmentError {
  readonly message: string;
  readonly code?: string;
}
```

### WebhookValidationResult
```typescript
interface WebhookValidationResult {
  readonly isValid: boolean;
  readonly eventType?: WebhookEventType;
  readonly error?: string;
}

type WebhookEventType = 'customer.created' | 'customer.updated';
```

**Story:** #5

