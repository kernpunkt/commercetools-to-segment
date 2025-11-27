---
id: 01260b54-b02a-452b-aaad-7f90057f21ec
title: Integration Flow Architecture
tags:
  - status/active
  - issue-1
  - component/integration
  - data-flow
category: ARC
created_at: '2025-11-27T12:34:35.793Z'
updated_at: '2025-11-27T12:34:35.793Z'
last_reviewed: '2025-11-27T12:34:35.793Z'
links: []
sources: []
---

**Component:** End-to-End Integration Flow

**Data Flow:**
1. Commercetools → Webhook POST → Vercel `/api/webhook`
2. Vercel → Serverless Function → Parse payload
3. Serverless Function → Transform data → Segment format
4. Serverless Function → Segment API → Identify call
5. Segment API → Response → Serverless Function
6. Serverless Function → Response → Commercetools

**Integration Points:**
- **Commercetools → Vercel**: HTTP POST webhook delivery
- **Vercel → Segment**: HTTP POST via `@segment/analytics-node` SDK
- **Environment**: `SEGMENT_WRITE_KEY` from Vercel env vars

**Error Handling:**
- Invalid payload → 400 Bad Request
- Missing env var → 500 Internal Server Error
- Segment API error → 500 Internal Server Error (with error details)

**Diagrams:**
```mermaid
sequenceDiagram
    participant CT as Commercetools
    participant Vercel as Vercel Platform
    participant Handler as Webhook Handler
    participant Transform as Data Transformer
    participant Segment as Segment API

    CT->>Vercel: POST /api/webhook<br/>{ customer.created }
    activate Vercel
    Vercel->>Handler: Invoke function<br/>(cold start or warm)
    activate Handler
    
    Handler->>Handler: Validate request
    Handler->>Transform: Extract customer data
    activate Transform
    Transform->>Transform: Map to Segment format
    Transform-->>Handler: UserTraits
    deactivate Transform
    
    Handler->>Segment: analytics.identify()<br/>{ userId: email, traits }
    activate Segment
    Segment-->>Handler: 200 OK
    deactivate Segment
    
    Handler-->>Vercel: { statusCode: 200 }
    deactivate Handler
    Vercel-->>CT: 200 OK
    deactivate Vercel
```

**Story:** #1