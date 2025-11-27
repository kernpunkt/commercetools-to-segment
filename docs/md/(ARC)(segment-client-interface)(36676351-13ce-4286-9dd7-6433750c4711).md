---
id: 36676351-13ce-4286-9dd7-6433750c4711
title: Segment Client Interface
tags:
  - status/implemented
  - issue-1
  - component/segment-client
  - interface
category: ARC
created_at: '2025-11-27T12:34:17.467Z'
updated_at: '2025-11-27T12:55:17.073Z'
last_reviewed: '2025-11-27T12:34:17.467Z'
links: []
sources: []
---

**Component:** Segment Analytics Client

**Contracts:**
- `identify(userId: string, traits: UserTraits): Promise<void>`
- `flush(): Promise<void>` (optional, for explicit flushing)

**Types:**
```typescript
interface UserTraits {
  readonly email: string;
  readonly name?: string;
  readonly address?: Address;
}

interface Address {
  readonly street?: string;
  readonly city?: string;
  readonly country?: string;
  readonly postalCode?: string;
}

interface SegmentClient {
  identify(params: { userId: string; traits: UserTraits }): Promise<void>;
  flush(): Promise<void>;
  closeAndFlush(): Promise<void>;
}
```

**Dependencies:**
- SegmentClient ← `@segment/analytics-node` Analytics instance
- Initialization: `new Analytics({ writeKey: string })`

**Diagrams:**
```mermaid
classDiagram
    class SegmentClient {
        +identify(userId: string, traits: UserTraits) Promise~void~
        +flush() Promise~void~
        +closeAndFlush() Promise~void~
    }
    
    class Analytics {
        +identify(params) Promise~void~
        +flush() Promise~void~
        +closeAndFlush() Promise~void~
    }
    
    class UserTraits {
        +email: string
        +name?: string
        +address?: Address
    }
    
    class Address {
        +street?: string
        +city?: string
        +country?: string
        +postalCode?: string
    }
    
    SegmentClient --> Analytics : uses
    SegmentClient --> UserTraits : accepts
    UserTraits --> Address : contains
```

**Story:** #1