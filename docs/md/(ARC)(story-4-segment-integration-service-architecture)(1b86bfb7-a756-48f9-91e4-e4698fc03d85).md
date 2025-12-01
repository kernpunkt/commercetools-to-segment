---
id: 1b86bfb7-a756-48f9-91e4-e4698fc03d85
title: STORY-4 Segment Integration Service Architecture
tags:
  - status/active
  - issue-4
  - component/integration-service
  - segment-integration
category: ARC
created_at: '2025-11-28T09:43:53.063Z'
updated_at: '2025-11-28T09:43:53.063Z'
last_reviewed: '2025-11-28T09:43:53.063Z'
links: []
sources: []
abstract: >-
  Architecture for Segment integration service that sends transformed customer
  data to Segment Identify API with explicit error handling
---

**Component:** Segment Integration Service

**Contracts:**
- `sendCustomerToSegment(payload: SegmentIdentifyPayload): Promise<SegmentIntegrationResult>`
- `sendCustomerToSegmentWithClient(client: SegmentClient, payload: SegmentIdentifyPayload): Promise<SegmentIntegrationResult>`

**Types:**
```typescript
type SegmentIntegrationResult = 
  | { success: true }
  | { success: false; error: SegmentError };

interface SegmentError {
  readonly message: string;
  readonly code?: string;
}
```

**Dependencies:**
- IntegrationService → SegmentClient (from environment or injected)
- IntegrationService → SegmentIdentifyPayload (from transformation)
- Uses: `getSegmentClientFromEnvironment()` for default client

**Data Flow:**
```
SegmentIdentifyPayload
    ↓
sendCustomerToSegment()
    ↓
getSegmentClientFromEnvironment()
    ↓
client.identify({ userId, traits })
    ↓
client.flush()
    ↓
SegmentIntegrationResult
```

**Error Handling:**
- Segment SDK errors → caught, wrapped in SegmentError
- Missing write key → error from client initialization
- Network errors → caught, returned as error result
- All errors return Result type (no exceptions)

**Diagrams:**
```mermaid
sequenceDiagram
    participant Caller
    participant Service as Integration Service
    participant Client as Segment Client
    participant Segment as Segment API

    Caller->>Service: sendCustomerToSegment(payload)
    activate Service
    Service->>Client: getSegmentClientFromEnvironment()
    activate Client
    Client-->>Service: SegmentClient instance
    deactivate Client
    
    Service->>Client: identify({ userId, traits })
    activate Client
    Client->>Segment: POST /identify
    activate Segment
    Segment-->>Client: 200 OK (or error)
    deactivate Segment
    
    alt Success
        Client-->>Service: Promise resolved
        Service->>Client: flush()
        Client-->>Service: Promise resolved
        Service-->>Caller: { success: true }
    else Error
        Client-->>Service: Error thrown
        Service-->>Caller: { success: false, error: {...} }
    end
    deactivate Client
    deactivate Service
```

```mermaid
classDiagram
    class IntegrationService {
        +sendCustomerToSegment(payload) Promise~Result~
        +sendCustomerToSegmentWithClient(client, payload) Promise~Result~
    }
    
    class SegmentClient {
        +identify(params) Promise~void~
        +flush() Promise~void~
        +closeAndFlush() Promise~void~
    }
    
    class SegmentIdentifyPayload {
        +userId: string
        +traits: UserTraits
    }
    
    class SegmentIntegrationResult {
        <<union>>
        +success: true
        +success: false
        +error: SegmentError
    }
    
    class SegmentError {
        +message: string
        +code?: string
    }
    
    IntegrationService --> SegmentClient : uses
    IntegrationService --> SegmentIdentifyPayload : accepts
    IntegrationService --> SegmentIntegrationResult : returns
    SegmentIntegrationResult --> SegmentError : contains
```

**Story:** #4