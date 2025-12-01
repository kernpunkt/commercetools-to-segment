---
id: story5-arc-001
title: STORY-5 End-to-End Integration Flow
tags:
  - status/implemented
  - issue-5
  - story-5
  - component/integration
  - data-flow
category: ARC
created_at: '2025-11-28T12:00:00.000Z'
updated_at: '2025-11-28T12:00:00.000Z'
last_reviewed: '2025-11-28T12:00:00.000Z'
links: []
sources: []
---

**Component:** End-to-End Integration Flow (Webhook → Transform → Segment)

**Contracts:**
- POST `/api/webhook` → `{ statusCode: 200, body: { eventType, success: true } }`
- Webhook Handler → Transform: `CommercetoolsCustomer` → `SegmentIdentifyPayload`
- Integration Service → Segment API: `identify({ userId, traits })` → `SegmentIntegrationResult`
- Segment API → User created/updated in Segment workspace

**Types:**
```typescript
interface CommercetoolsCustomer {
  readonly email?: string | null;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly fullName?: string | null;
  readonly addresses?: ReadonlyArray<CommercetoolsAddress> | null;
}

interface SegmentIdentifyPayload {
  readonly userId: string; // email
  readonly traits: UserTraits;
}

interface UserTraits {
  readonly email: string;
  readonly name?: string;
  readonly address?: Address;
}

type SegmentIntegrationResult = 
  | { success: true }
  | { success: false; error: SegmentError };
```

**Dependencies:**
- Webhook Handler → Validator → Transformer → Integration Service → Segment Client
- Environment: `SEGMENT_WRITE_KEY` (required)
- Segment API: External dependency

**Data Flow:**
1. Commercetools → POST `/api/webhook` → Vercel serverless function
2. Webhook Handler → Validate method, parse JSON, validate payload
3. Webhook Handler → Extract customer data from payload
4. Transformer → Transform `CommercetoolsCustomer` → `SegmentIdentifyPayload`
5. Integration Service → Send to Segment API via `identify()` + `flush()`
6. Segment API → Create/update user identified by email
7. Webhook Handler → Return 200 OK to Commercetools

**Integration Points:**
- **Webhook → Handler**: HTTP POST with Commercetools payload
- **Handler → Transformer**: `transformCustomerToSegment(customer)`
- **Transformer → Integration**: `SegmentIdentifyPayload` (userId + traits)
- **Integration → Segment Client**: `identify({ userId, traits })`
- **Segment Client → Segment API**: HTTP POST via `@segment/analytics-node` SDK
- **Integration → Handler**: `SegmentIntegrationResult` (success/error)

**Error Handling:**
- Invalid method → 400 Bad Request
- Invalid JSON → 400 Bad Request
- Invalid payload → 400 Bad Request
- Missing customer data → 400 Bad Request
- Missing email → 400 Bad Request
- Segment API error → 500 Internal Server Error

**Diagrams:**
```mermaid
sequenceDiagram
    participant CT as Commercetools
    participant Vercel as Vercel Platform
    participant WH as Webhook Handler
    participant Val as Validator
    participant TF as Transformer
    participant IS as Integration Service
    participant SC as Segment Client
    participant SA as Segment API

    CT->>Vercel: POST /api/webhook<br/>{ customer.created }
    activate Vercel
    Vercel->>WH: Invoke serverless function
    activate WH
    
    WH->>Val: validateMethod(req.method)
    Val-->>WH: true
    WH->>Val: parseJSON(req.body)
    Val-->>WH: { success: true, data }
    WH->>Val: validatePayload(data)
    Val-->>WH: { isValid: true, eventType }
    
    WH->>WH: extractCustomerFromPayload(data)
    WH->>TF: transformCustomerToSegment(customer)
    activate TF
    TF-->>WH: SegmentIdentifyPayload
    deactivate TF
    
    WH->>IS: sendCustomerToSegment(payload)
    activate IS
    IS->>SC: getSegmentClientFromEnvironment()
    activate SC
    SC-->>IS: SegmentClient
    IS->>SC: identify({ userId, traits })
    SC->>SA: POST /identify
    activate SA
    SA-->>SC: 200 OK
    deactivate SA
    IS->>SC: flush()
    SC-->>IS: Promise resolved
    IS-->>WH: { success: true }
    deactivate SC
    deactivate IS
    
    WH-->>Vercel: { statusCode: 200, body: { eventType, success: true } }
    deactivate WH
    Vercel-->>CT: 200 OK
    deactivate Vercel
```

```mermaid
flowchart TD
    A[Commercetools Webhook] -->|POST /api/webhook| B[Webhook Handler]
    B -->|validateMethod| C{Method = POST?}
    C -->|No| D[400 Bad Request]
    C -->|Yes| E[parseJSON]
    E -->|Invalid JSON| D
    E -->|Valid JSON| F[validatePayload]
    F -->|Invalid Payload| D
    F -->|Valid Payload| G[extractCustomerFromPayload]
    G -->|No Customer| D
    G -->|Customer Found| H[transformCustomerToSegment]
    H -->|Missing Email| D
    H -->|SegmentIdentifyPayload| I[sendCustomerToSegment]
    I -->|getSegmentClient| J[Segment Client]
    J -->|identify + flush| K[Segment API]
    K -->|Error| L[500 Internal Error]
    K -->|Success| M[200 OK]
    M --> N[User in Segment]
    D --> O[Commercetools]
    L --> O
    M --> O
```

**Story:** #5

