---
id: a5ef816f-f4f5-4716-9eb8-f33c0b1e35e7
title: STORY-18 Lambda Handler Testing Strategy
tags:
  - story-18
  - status/implemented
  - component/testing
  - component/lambda
category: IMP
created_at: '2025-12-02T08:50:47.112Z'
updated_at: '2025-12-02T08:50:47.112Z'
last_reviewed: '2025-12-02T08:50:47.112Z'
links: []
sources: []
abstract: >-
  Testing strategy: unit tests (adapter 100%, handler 90%+), integration tests
  (70%+), BDD tests (100% scenarios), mocks vs real implementations
---

**Story:** #18  
**Component:** Testing Strategy

**Test Coverage Targets:**
- Unit: Adapter (100%), Handler (90%+)
- Integration: Handler + business logic (70%+)
- BDD: All feature scenarios (100%)

**Unit Tests:**

**Adapter Tests (`tests/lambda/adapter.test.ts`):**
- Extract payload from single record SNS event
- Extract payload from multiple records SNS event
- Parse valid JSON from SNS Message field
- Handle invalid JSON in Message field (parse error)
- Handle missing Message field
- Handle empty Records array
- Identify subscription confirmation (Type: SubscriptionConfirmation)
- Identify notification (Type: Notification)
- Convert CommercetoolsPayload to RequestBody format
- Handle nested JSON in Message field
- Framework: Vitest
- Mocks: None (pure functions)

**Handler Tests (`tests/lambda/handler.test.ts`):**
- Process notification event (customer.created) → success
- Process notification event (customer.updated) → success
- Process subscription confirmation → 200 OK
- Process multiple records (all succeed) → 200 OK
- Process multiple records (some fail) → 400/500
- Handle parse errors → 400 Bad Request
- Handle validation errors → 400 Bad Request
- Handle missing customer data → 400 Bad Request
- Handle transformation errors → 400 Bad Request
- Handle integration errors → 500 Internal Server Error
- Handle empty Records array → 400 Bad Request
- Framework: Vitest
- Mocks: Segment client (mock identify/flush), Lambda context (mock)
- Real: Validator, Transformer, Integration service (with mocked Segment client)

**Integration Tests:**

**Handler Integration (`tests/lambda/handler.integration.test.ts`):**
- End-to-end: SNS event → validation → transformation → Segment API
- End-to-end: Subscription confirmation → success
- Multiple records: All succeed → aggregate success
- Multiple records: Mixed results → aggregate failure
- Error propagation: Validation error → 400
- Error propagation: Integration error → 500
- Framework: Vitest
- Mocks: Segment API (HTTP mock), Lambda context
- Real: Validator, Transformer, Integration service, SNS adapter

**BDD Tests:**

**Step Definitions (`tests/steps/story-18-lambda-handler-migration.steps.ts`):**
- Given: SNS event with customer.created payload
- Given: SNS event with customer.updated payload
- Given: SNS subscription confirmation event
- Given: SNS event with Message field containing payload
- Given: SNS event with multiple Records
- When: Lambda handler processes SNS event
- Then: Handler extracts payload from Message field
- Then: Handler processes customer.created/updated event
- Then: Handler returns successful response
- Then: Handler handles subscription confirmation
- Then: Handler processes each record
- Then: Handler maintains compatibility with existing logic
- Framework: Cucumber
- Mocks: Segment API (HTTP mock)
- Real: All business logic, SNS adapter, Lambda handler

**Test Doubles Strategy:**

**Mock:**
- Segment Client: Mock identify/flush methods (external dependency)
- AWS Lambda Context: Mock context object (AWS runtime)
- Segment API: HTTP mock for E2E tests (external service)

**Real:**
- Validator: Real implementation (core business logic)
- Transformer: Real implementation (core business logic)
- Integration Service: Real implementation with mocked Segment client (core business logic)
- SNS Adapter: Real implementation (component under test)

**Test Data Builders:**

**SNS Event Builder (`tests/utils/sns-event-builder.ts`):**
- `createSnsEvent(records: SNSRecord[]): SNSEvent`
- `createSnsNotificationRecord(payload: CommercetoolsPayload): SNSRecord`
- `createSnsSubscriptionConfirmationRecord(): SNSRecord`
- `createSnsRecordWithMessage(message: string, type: 'Notification' | 'SubscriptionConfirmation'): SNSRecord`

**Test Scenarios:**

**Success Paths:**
- Single record, customer.created → 200 OK
- Single record, customer.updated → 200 OK
- Multiple records, all succeed → 200 OK
- Subscription confirmation → 200 OK

**Error Paths:**
- Invalid JSON in Message → 400 Bad Request
- Missing Message field → 400 Bad Request
- Invalid payload structure → 400 Bad Request
- Missing customer data → 400 Bad Request
- Segment API error → 500 Internal Server Error
- Multiple records, some fail → 400/500

**Edge Cases:**
- Empty Records array → 400 Bad Request
- Nested JSON in Message → Parse successfully
- Missing Sns field → 400 Bad Request
- Invalid SNS Type → 400 Bad Request