---
id: 0d131426-b8f4-46cb-926f-7550eaa86bb8
title: Customer Data Transformation Architecture
tags:
  - status/implemented
  - issue-3
  - component/transformation
  - data-transformation
category: ARC
created_at: '2025-11-28T08:24:55.130Z'
updated_at: '2025-11-28T09:34:33.960Z'
last_reviewed: '2025-11-28T08:24:55.130Z'
links: []
sources: []
abstract: >-
  Pure function transformation from Commercetools customer data to Segment
  Identify API format
---

**Component:** Customer Data Transformation

**Contracts:**
- `transformCustomerToSegment(customer: CommercetoolsCustomer): SegmentIdentifyPayload`
- Input: Commercetools customer resource data
- Output: `{ userId: string, traits: UserTraits }`

**Types:**
```typescript
interface CommercetoolsCustomer {
  readonly email?: string | null;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly fullName?: string | null;
  readonly addresses?: ReadonlyArray<CommercetoolsAddress> | null;
}

interface CommercetoolsAddress {
  readonly streetName?: string | null;
  readonly streetNumber?: string | null;
  readonly city?: string | null;
  readonly postalCode?: string | null;
  readonly country?: string | null;
}

interface SegmentIdentifyPayload {
  readonly userId: string;
  readonly traits: UserTraits;
}
```

**Dependencies:**
- Input: Commercetools customer resource (from webhook payload)
- Output: Segment `UserTraits` (from `src/segment/types.ts`)
- Pattern: Pure function (no side effects, no I/O)

**Field Mapping:**
- `email` → `userId` (required if email exists) + `traits.email`
- `firstName + lastName` → `traits.name` (prefer fullName if exists)
- `addresses[0]` → `traits.address` (streetName+streetNumber → street, city, postalCode, country)

**Behavior:**
- Missing/null fields: Omit from output (graceful handling)
- Email required: If no email, userId = undefined (transformation may fail or return partial)
- Name priority: fullName > firstName+lastName > firstName > lastName
- Address: Use first address if multiple exist

**Diagrams:**
```mermaid
classDiagram
    class CommercetoolsCustomer {
        +email?: string
        +firstName?: string
        +lastName?: string
        +fullName?: string
        +addresses?: Address[]
    }
    
    class CommercetoolsAddress {
        +streetName?: string
        +streetNumber?: string
        +city?: string
        +postalCode?: string
        +country?: string
    }
    
    class TransformFunction {
        +transformCustomerToSegment(customer: CommercetoolsCustomer): SegmentIdentifyPayload
    }
    
    class SegmentIdentifyPayload {
        +userId: string
        +traits: UserTraits
    }
    
    class UserTraits {
        +email: string
        +name?: string
        +address?: Address
    }
    
    CommercetoolsCustomer --> CommercetoolsAddress : contains
    TransformFunction --> CommercetoolsCustomer : accepts
    TransformFunction --> SegmentIdentifyPayload : returns
    SegmentIdentifyPayload --> UserTraits : contains
```

```mermaid
sequenceDiagram
    participant Handler as Webhook Handler
    participant Transform as Transform Function
    participant Segment as Segment Client
    
    Handler->>Transform: transformCustomerToSegment(customer)
    activate Transform
    Transform->>Transform: Extract email → userId
    Transform->>Transform: Extract name (fullName/firstName+lastName)
    Transform->>Transform: Extract address (first address)
    Transform->>Transform: Build SegmentIdentifyPayload
    Transform-->>Handler: { userId, traits }
    deactivate Transform
    Handler->>Segment: identify({ userId, traits })
```

**Story:** #3