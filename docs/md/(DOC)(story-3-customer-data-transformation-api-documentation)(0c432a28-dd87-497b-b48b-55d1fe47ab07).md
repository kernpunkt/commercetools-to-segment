---
id: 0c432a28-dd87-497b-b48b-55d1fe47ab07
title: STORY-3 Customer Data Transformation API Documentation
tags:
  - status/implemented
  - issue-3
  - topic/api
  - story-3
category: DOC
created_at: '2025-11-28T09:30:31.869Z'
updated_at: '2025-12-01T09:08:56.511Z'
last_reviewed: '2025-11-28T09:30:31.869Z'
links: []
sources: []
abstract: >-
  API documentation for customer data transformation component - public
  interfaces, methods, and parameters
---

# STORY-3 Customer Data Transformation API Documentation

## Component: Customer Data Transformation

**Location:** `src/transformation/transformer.ts`

## Public API

### `transformCustomerToSegment`

Transforms a Commercetools customer resource to Segment Identify API format.

**Signature:**
```typescript
function transformCustomerToSegment(
  customer: CommercetoolsCustomer
): SegmentIdentifyPayload
```

**Parameters:**
- `customer` (CommercetoolsCustomer): Commercetools customer resource data
  - `email?: string | null` - Customer email address
  - `firstName?: string | null` - Customer first name
  - `lastName?: string | null` - Customer last name
  - `fullName?: string | null` - Customer full name (takes priority over firstName+lastName)
  - `addresses?: ReadonlyArray<CommercetoolsAddress> | null` - Array of customer addresses

**Returns:**
- `SegmentIdentifyPayload`: Object containing:
  - `userId: string` - User identifier (email or empty string if email missing)
  - `traits: UserTraits` - User traits object with:
    - `email: string` - Email address (required, empty string if missing)
    - `name?: string` - Full name (optional, omitted if no name fields)
    - `address?: Address` - Address object (optional, omitted if no address)

**Behavior:**
- Email handling: If email is missing/null, userId and traits.email are set to empty string
- Name priority: fullName > firstName+lastName > firstName > lastName
- Address: Uses first address from addresses array, combines streetName+streetNumber into street
- Missing fields: Gracefully omits undefined/null fields from output
- Empty address: Returns undefined if all address fields are null/empty

**Throws:** Never throws (pure function, handles all edge cases gracefully)

## Type Definitions

### `CommercetoolsCustomer`
```typescript
interface CommercetoolsCustomer {
  readonly email?: string | null;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly fullName?: string | null;
  readonly addresses?: ReadonlyArray<CommercetoolsAddress> | null;
}
```

### `CommercetoolsAddress`
```typescript
interface CommercetoolsAddress {
  readonly streetName?: string | null;
  readonly streetNumber?: string | null;
  readonly city?: string | null;
  readonly postalCode?: string | null;
  readonly country?: string | null;
}
```

### `SegmentIdentifyPayload`
```typescript
interface SegmentIdentifyPayload {
  readonly userId: string;
  readonly traits: UserTraits;
}
```

**Dependencies:**
- `UserTraits` from `src/segment/types.ts`
- `Address` from `src/segment/types.ts`

## Field Mapping Rules

1. **Email → userId + traits.email**
   - Source: `customer.email`
   - Target: `userId` and `traits.email`
   - Behavior: Trims whitespace, uses empty string if missing

2. **Name → traits.name**
   - Priority: fullName > firstName+lastName > firstName > lastName
   - Behavior: Omitted if all name fields are null/undefined

3. **Address → traits.address**
   - Source: `customer.addresses[0]` (first address)
   - Mapping:
     - `streetName + streetNumber` → `street`
     - `city` → `city`
     - `postalCode` → `postalCode`
     - `country` → `country`
   - Behavior: Returns undefined if all address fields are null/empty

## Design Principles

- **Pure Function:** No side effects, no I/O, deterministic
- **Immutable:** All inputs/outputs are readonly
- **Graceful Degradation:** Handles missing/null fields without errors
- **Type Safety:** Full TypeScript type coverage