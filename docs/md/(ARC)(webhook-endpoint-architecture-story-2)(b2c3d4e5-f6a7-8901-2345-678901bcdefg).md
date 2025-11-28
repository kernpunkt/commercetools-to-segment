---
id: b2c3d4e5-f6a7-8901-2345-678901bcdefg
title: Webhook Endpoint Architecture
tags:
  - status/implemented
  - issue-2
  - component/webhook-handler
  - interface
  - validation
category: ARC
created_at: '2025-11-27T13:00:00.000Z'
updated_at: '2025-11-27T13:00:00.000Z'
last_reviewed: '2025-11-27T13:00:00.000Z'
links: []
sources: []
---

**Component:** Webhook Endpoint Handler

**Contracts:**
- HTTP POST `/api/webhook` → `{ statusCode: 200 | 400, body: string }`
- Request: VercelRequest with JSON body
- Response: 200 OK (valid) | 400 Bad Request (invalid method/JSON/payload)

**Types:**
```typescript
interface CommercetoolsWebhookPayload {
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
}

type WebhookEventType = 'customer.created' | 'customer.updated';

interface WebhookValidationResult {
  readonly isValid: boolean;
  readonly eventType?: WebhookEventType;
  readonly error?: string;
}
```

**Dependencies:**
- VercelRequest → WebhookHandler → Validation → Response
- No external dependencies (no Segment calls, no env vars)

**Event Type Mapping:**
- `type: "CustomerCreated"` → `eventType: "customer.created"`
- `type: "CustomerUpdated"` → `eventType: "customer.updated"`

**Diagrams:**
```mermaid
sequenceDiagram
    participant CT as Commercetools
    participant Vercel as Vercel Platform
    participant Handler as Webhook Handler
    participant Validator as Request Validator

    CT->>Vercel: POST /api/webhook<br/>{ JSON payload }
    Vercel->>Handler: Invoke serverless function
    Handler->>Validator: Validate HTTP method
    alt Invalid method (not POST)
        Validator-->>Handler: { isValid: false, error: "Method not allowed" }
        Handler-->>Vercel: 400 Bad Request
        Vercel-->>CT: 400 Bad Request
    else Valid method
        Handler->>Validator: Parse JSON body
        alt Invalid JSON
            Validator-->>Handler: { isValid: false, error: "Invalid JSON" }
            Handler-->>Vercel: 400 Bad Request
            Vercel-->>CT: 400 Bad Request
        else Valid JSON
            Handler->>Validator: Validate payload structure
            alt Missing required fields
                Validator-->>Handler: { isValid: false, error: "Invalid payload" }
                Handler-->>Vercel: 400 Bad Request
                Vercel-->>CT: 400 Bad Request
            else Valid payload
                Handler->>Validator: Identify event type
                Validator-->>Handler: { isValid: true, eventType: "customer.created" }
                Handler-->>Vercel: 200 OK
                Vercel-->>CT: 200 OK
            end
        end
    end
```

```mermaid
classDiagram
    class VercelRequest {
        +string method
        +string body
        +Record~string,string~ headers
    }
    
    class WebhookHandler {
        +handle(VercelRequest): Promise~VercelResponse~
    }
    
    class RequestValidator {
        +validateMethod(string): boolean
        +parseJSON(string): Result~object,Error~
        +validatePayload(object): WebhookValidationResult
        +identifyEventType(object): WebhookEventType?
    }
    
    class VercelResponse {
        +number statusCode
        +string body
    }
    
    class CommercetoolsWebhookPayload {
        +string notificationType
        +string type
        +object resource
        +string projectKey
    }
    
    VercelRequest --> WebhookHandler
    WebhookHandler --> RequestValidator
    RequestValidator --> CommercetoolsWebhookPayload
    WebhookHandler --> VercelResponse
```

**Story:** #2

