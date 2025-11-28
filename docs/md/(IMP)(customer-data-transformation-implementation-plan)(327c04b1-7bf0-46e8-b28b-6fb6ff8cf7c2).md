---
id: 327c04b1-7bf0-46e8-b28b-6fb6ff8cf7c2
title: Customer Data Transformation Implementation Plan
tags:
  - status/implemented
  - issue-3
  - implementation
  - testing
category: IMP
created_at: '2025-11-28T08:26:54.573Z'
updated_at: '2025-11-28T09:34:34.839Z'
last_reviewed: '2025-11-28T08:26:54.573Z'
links: []
sources: []
abstract: >-
  Implementation plan for transforming Commercetools customer data to Segment
  format
---

**Order:** 1.Types 2.Transform 3.Tests 4.BDD

**Tasks:**
1. Create `src/transformation/types.ts` - CommercetoolsCustomer, CommercetoolsAddress types
2. Create `src/transformation/transformer.ts` - transformCustomerToSegment function
3. Create `tests/transformation/transformer.test.ts` - Unit tests (90% coverage)
4. Create `tests/steps/story-3-customer-data-transformation.steps.ts` - BDD step definitions

**Tests:**
- Unit: 90% coverage (email, name, address extraction, missing/null handling)
- BDD: 15 scenarios from feature file
- Integration: N/A (pure function, no I/O)

**Mocks:** None (pure function, no dependencies)
**Real:** Transform function, all test data

**File Structure:**
```
src/transformation/
  types.ts          # CommercetoolsCustomer, CommercetoolsAddress
  transformer.ts    # transformCustomerToSegment()
tests/transformation/
  transformer.test.ts
tests/steps/
  story-3-customer-data-transformation.steps.ts
```

**Implementation Details:**
- Email: Extract → userId + traits.email (required if email exists)
- Name: Priority fullName > firstName+lastName > firstName > lastName
- Address: addresses[0] → traits.address (streetName+streetNumber → street)
- Missing/null: Omit from output, no errors
- Output: { userId: string, traits: UserTraits } (reuse UserTraits from segment/types.ts)

**Test Cases (Unit):**
1. Email extraction (with/without email)
2. Name extraction (fullName, firstName+lastName, firstName only, lastName only)
3. Address extraction (complete, partial, missing)
4. All fields combined
5. Missing fields (email, name, address individually)
6. Null fields (email, name, address individually)
7. Empty addresses array
8. Multiple addresses (use first)
9. Street name+number combination
10. Name priority logic

**BDD Scenarios:** 15 scenarios from story-3-customer-data-transformation.feature

**Risks:**
- Commercetools address format variations → handle streetName+streetNumber combination
- Name field priority conflicts → fullName takes precedence
- Missing email edge case → return partial payload or handle in caller
**Mitigation:** Comprehensive test coverage, handle all null/undefined cases

**Dependencies:**
- Input: Commercetools customer structure (from webhook payload)
- Output: UserTraits from `src/segment/types.ts` (already exists)
- No external dependencies (pure function)

**Acceptance Criteria:**
✅ Extract email → userId + traits.email
✅ Extract name (firstName/lastName/fullName) → traits.name
✅ Extract address → traits.address
✅ Transform to Segment format
✅ Handle missing/null fields gracefully
✅ Return Segment-compatible structure
✅ Pure function (testable in isolation)

**Story:** #3