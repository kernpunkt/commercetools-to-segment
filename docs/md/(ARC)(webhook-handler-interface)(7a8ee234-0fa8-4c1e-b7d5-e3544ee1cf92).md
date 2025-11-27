---
id: 7a8ee234-0fa8-4c1e-b7d5-e3544ee1cf92
title: Webhook Handler Interface
tags:
  - status/active
  - issue-1
  - component/webhook-handler
  - interface
category: ARC
created_at: '2025-11-27T12:34:11.192Z'
updated_at: '2025-11-27T12:34:11.192Z'
last_reviewed: '2025-11-27T12:34:11.192Z'
links: []
sources: []
---

**Component:** Webhook Handler (Serverless Function)

**Contracts:**
- HTTP POST `/api/webhook` → `{ statusCode: number, body: string }`
- Request: `{ headers: Record<string, string>, body: string }`
- Response: `200 OK` (success) | `400 Bad Request` (invalid payload) | `500 Internal Server Error`

**Types:**
```typescript
interface WebhookRequest {
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

interface WebhookResponse {
  readonly statusCode: number;
  readonly body: string;
}

type WebhookHandler = (req: WebhookRequest) => Promise<WebhookResponse>;
```

**Dependencies:**
- VercelRequest → WebhookHandler → SegmentClient
- Environment: `SEGMENT_WRITE_KEY` (required)

**Diagrams:**
```mermaid
sequenceDiagram
    participant CT as Commercetools
    participant Vercel as Vercel Platform
    participant Handler as Webhook Handler
    participant Segment as Segment API

    CT->>Vercel: POST /api/webhook<br/>{ customer data }
    Vercel->>Handler: Invoke serverless function
    Handler->>Handler: Parse JSON payload
    Handler->>Handler: Validate payload structure
    Handler->>Segment: POST /identify<br/>{ transformed data }
    Segment-->>Handler: 200 OK
    Handler-->>Vercel: { statusCode: 200 }
    Vercel-->>CT: 200 OK
```

**Story:** #1