---
id: ada8ea1a-e141-4b19-9946-838b867747ef
title: STORY-4 Segment Integration Data Flow
tags:
  - status/active
  - issue-4
  - component/integration
  - data-flow
category: ARC
created_at: '2025-11-28T09:44:07.066Z'
updated_at: '2025-11-28T09:44:07.066Z'
last_reviewed: '2025-11-28T09:44:07.066Z'
links: []
sources: []
abstract: >-
  End-to-end data flow architecture for Segment integration from webhook to
  Segment API
---

**Component:** End-to-End Segment Integration Flow

**Data Flow:**
1. Commercetools → Webhook POST → `/api/webhook`
2. Webhook Handler → Validate payload → Extract customer data
3. Transformation → Transform customer → SegmentIdentifyPayload
4. Integration Service → Send to Segment → SegmentIntegrationResult
5. Webhook Handler → Return HTTP response → Commercetools

**Integration Points:**
- **Transformation → Integration**: `SegmentIdentifyPayload` (userId + traits)
- **Integration → Segment Client**: `identify({ userId, traits })`
- **Segment Client → Segment API**: HTTP POST via SDK
- **Integration → Handler**: `SegmentIntegrationResult` (success/error)

**Error Flow:**
- Segment API error → Integration Service → Result<false, error>
- Handler checks result → Returns 500 or 200 based on result
- Error details logged but not exposed to caller

**Diagrams:**
```mermaid
flowchart TD
    A[Commercetools Webhook] -->|POST /api/webhook| B[Webhook Handler]
    B -->|Validate| C{Valid?}
    C -->|No| D[400 Bad Request]
    C -->|Yes| E[Extract Customer Data]
    E --> F[Transform Customer]
    F -->|SegmentIdentifyPayload| G[Integration Service]
    G -->|getSegmentClient| H[Segment Client]
    H -->|identify + flush| I[Segment API]
    I -->|Response| H
    H -->|Result| G
    G -->|SegmentIntegrationResult| J{Success?}
    J -->|Yes| K[200 OK]
    J -->|No| L[500 Internal Error]
    K --> M[Commercetools]
    L --> M
    D --> M
```

```mermaid
sequenceDiagram
    participant CT as Commercetools
    participant WH as Webhook Handler
    participant TF as Transformer
    participant IS as Integration Service
    participant SC as Segment Client
    participant SA as Segment API

    CT->>WH: POST /api/webhook<br/>{ customer.created }
    activate WH
    WH->>WH: Validate payload
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
    
    alt Success
        SA-->>SC: 200 OK
        SC-->>IS: Promise resolved
        IS->>SC: flush()
        SC-->>IS: Promise resolved
        IS-->>WH: { success: true }
        WH-->>CT: 200 OK
    else Error
        SA-->>SC: Error response
        SC-->>IS: Error thrown
        IS-->>WH: { success: false, error }
        WH-->>CT: 500 Internal Error
    end
    deactivate SA
    deactivate SC
    deactivate IS
    deactivate WH
```

**Story:** #4