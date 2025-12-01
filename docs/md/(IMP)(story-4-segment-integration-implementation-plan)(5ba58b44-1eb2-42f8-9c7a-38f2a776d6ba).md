---
id: 5ba58b44-1eb2-42f8-9c7a-38f2a776d6ba
title: STORY-4 Segment Integration Implementation Plan
tags:
  - status/active
  - issue-4
  - implementation
  - segment-integration
category: IMP
created_at: '2025-11-28T09:45:00.270Z'
updated_at: '2025-11-28T09:45:00.270Z'
last_reviewed: '2025-11-28T09:45:00.270Z'
links: []
sources: []
abstract: >-
  Implementation plan for Segment integration service: types, service functions,
  unit tests, BDD step definitions
---

**Story:** #4 - Segment Identify API Integration

**Scope:** Integration service only. No webhook handler changes, no transformation changes.

**Order:** 1.Types 2.Service 3.UnitTests 4.BDDSteps

**Tasks:**
1. Create src/integration/types.ts: SegmentIntegrationResult, SegmentError
2. Create src/integration/service.ts: sendCustomerToSegment, sendCustomerToSegmentWithClient
3. Create tests/integration/service.test.ts: unit tests with mocked SegmentClient
4. Create tests/steps/story-4-segment-identify-api-integration.steps.ts: BDD step definitions

**Tests:**
- Unit(90%): Service functions (success/error paths, client injection, error wrapping)
- BDD(100%): All 12 scenarios from feature file
- Integration(70%): Service with real SegmentClient (test write key)

**Mocks:**
- SegmentClient in unit tests (mock identify, flush methods)
- Real: Integration service logic (test actual error handling, Result type)
- Real: SegmentClient in integration tests (use test write key)

**Dependencies:**
- SegmentClient (existing, from src/segment/client.ts)
- SegmentIdentifyPayload (existing, from src/transformation/types.ts)
- getSegmentClientFromEnvironment (existing)

**Risks:**
- Segment SDK async behavior → ensure flush() called after identify()
- Error wrapping → preserve original error message in SegmentError
- Empty userId handling → validate userId not empty before API call
- Network timeouts → SDK handles internally, test error propagation

**Implementation Details:**
- Result type: { success: true } | { success: false, error: SegmentError }
- Error wrapping: catch SDK errors, wrap in SegmentError with message
- Client injection: sendCustomerToSegmentWithClient for testability
- Flush strategy: call flush() after identify() to ensure delivery