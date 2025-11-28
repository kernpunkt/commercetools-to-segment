---
id: 95d76c0f-97a1-4751-899e-4af46b35e325
title: STORY-2 Webhook API Documentation
tags:
  - status/implemented
  - issue-2
  - topic/api
  - story-2
category: DOC
created_at: '2025-11-28T07:48:16.257Z'
updated_at: '2025-11-28T07:55:10.752Z'
last_reviewed: '2025-11-28T07:48:16.257Z'
links: []
sources: []
abstract: >-
  API documentation for STORY-2 webhook endpoint: handler, validator functions,
  types, request/response formats, error messages.
---

**Story:** #2 - Webhook Endpoint API Documentation

**Component:** Webhook Handler (`api/webhook.ts`)

**Endpoint:** `POST /api/webhook`

**Handler Function:**
```typescript
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void>
```

**Request:**
- Method: POST only (all other methods return 400)
- Content-Type: application/json
- Body: JSON string containing Commercetools webhook payload

**Response:**
- 200 OK: Valid payload
  ```json
  { "eventType": "customer.created" | "customer.updated" }
  ```
- 400 Bad Request: Invalid method, JSON, or payload
  ```json
  { "error": "Error message" }
  ```

**Validator Functions (`src/webhook/validator.ts`):**

**validateMethod(method: string | undefined): boolean**
- Validates HTTP method is POST
- Returns: true if POST, false otherwise

**parseJSON(body: string | undefined): Result**
- Parses JSON string safely
- Returns: `{ success: true, data: unknown }` or `{ success: false, error: string }`
- Handles: undefined, null, empty string, invalid JSON

**validatePayload(payload: unknown): WebhookValidationResult**
- Validates Commercetools webhook payload structure
- Returns: `{ isValid: true, eventType: WebhookEventType }` or `{ isValid: false, error: string }`
- Validates: notificationType, type, resource, projectKey, id, version, sequenceNumber, resourceVersion, createdAt, lastModifiedAt

**identifyEventType(payload: CommercetoolsWebhookPayload): WebhookEventType | undefined**
- Maps Commercetools type to event type
- Returns: 'customer.created' | 'customer.updated' | undefined
- Mapping: CustomerCreated → customer.created, CustomerUpdated → customer.updated

**Types (`src/webhook/types.ts`):**

**CommercetoolsWebhookPayload:**
```typescript
interface CommercetoolsWebhookPayload {
  readonly notificationType: 'Message';
  readonly type: string;
  readonly resource: { readonly typeId: string; readonly id: string };
  readonly projectKey: string;
  readonly id: string;
  readonly version: number;
  readonly sequenceNumber: number;
  readonly resourceVersion: number;
  readonly createdAt: string;
  readonly lastModifiedAt: string;
}
```

**WebhookEventType:**
```typescript
type WebhookEventType = 'customer.created' | 'customer.updated';
```

**WebhookValidationResult:**
```typescript
interface WebhookValidationResult {
  readonly isValid: boolean;
  readonly eventType?: WebhookEventType;
  readonly error?: string;
}
```

**Error Responses:**
- Method not allowed: "Method not allowed. Only POST is supported."
- Missing body: "Request body is required"
- Invalid JSON: JSON.parse error message
- Invalid notificationType: "Invalid notificationType: must be 'Message'"
- Missing type: "Missing or invalid type field"
- Missing resource: "Missing or invalid resource field"
- Invalid resource: "Resource must have typeId and id fields"
- Missing required field: "Missing or invalid [field] field"
- Unrecognized event: "Unrecognized event type: [type]"