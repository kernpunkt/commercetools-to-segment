---
id: 0ce5703f-602b-4a14-8749-fe2c87992df8
title: STORY-18 Lambda Handler Implementation Plan
tags:
  - story-18
  - status/implemented
  - component/lambda
  - component/sns
  - component/adapter
category: IMP
created_at: '2025-12-02T08:50:19.734Z'
updated_at: '2025-12-02T08:50:19.734Z'
last_reviewed: '2025-12-02T08:50:19.734Z'
links: []
sources: []
abstract: >-
  Implementation plan: SNS adapter, Lambda handler, tests, BDD steps. Order:
  Types→Adapter→Handler→Tests→BDD
---

**Story:** #18  
**Component:** Lambda Handler Migration

**Implementation Order:**
1. Types (SNS event, Lambda response)
2. SNS Adapter (extract, parse, convert)
3. Lambda Handler (main handler, record processing, subscription confirmation)
4. Unit Tests (adapter, handler)
5. Integration Tests (handler + business logic)
6. BDD Step Definitions (Cucumber steps)
7. CDK Integration (Lambda subscription to SNS topic)

**Tasks:**

**1. Types (`src/lambda/types.ts`)**
- SNSEvent interface
- SNSRecord interface
- SNSMessage interface
- LambdaResponse interface
- LambdaContext type
- ProcessingResult interface
- Acceptance: Types compile, match ARC spec

**2. SNS Adapter (`src/lambda/adapter.ts`)**
- `extractCommercetoolsPayload(snsEvent: SNSEvent): CommercetoolsPayload | null`
- `parseSnsMessage(message: string): unknown`
- `isSubscriptionConfirmation(record: SNSRecord): boolean`
- `convertToRequestBody(payload: CommercetoolsPayload): RequestBody`
- Acceptance: Extracts payload from SNS Message, handles JSON parse errors, identifies subscription confirmation

**3. Lambda Handler (`src/lambda/handler.ts`)**
- `handler(event: SNSEvent, context: Context): Promise<LambdaResponse>`
- `processSnsRecord(record: SNSRecord): Promise<ProcessingResult>`
- `handleNotification(record: SNSRecord): Promise<ProcessingResult>`
- `handleSubscriptionConfirmation(record: SNSRecord): Promise<ProcessingResult>`
- `extractCustomerFromPayload(payload: unknown): CommercetoolsCustomer | null` (reuse from webhook handler)
- Multiple records processing (map over Records[], aggregate results)
- Acceptance: Processes SNS events, handles subscription confirmation, processes multiple records, returns correct status codes

**4. Unit Tests (`tests/lambda/adapter.test.ts`)**
- Extract payload from valid SNS event
- Extract payload from multiple records
- Handle invalid JSON in Message field
- Handle missing Message field
- Identify subscription confirmation
- Convert payload to request body format
- Acceptance: 100% coverage of adapter functions

**5. Unit Tests (`tests/lambda/handler.test.ts`)**
- Process notification event (customer.created)
- Process notification event (customer.updated)
- Process subscription confirmation
- Process multiple records (all succeed)
- Process multiple records (some fail)
- Handle parse errors
- Handle validation errors
- Handle transformation errors
- Handle integration errors
- Acceptance: 90%+ coverage of handler functions

**6. Integration Tests (`tests/lambda/handler.integration.test.ts`)**
- End-to-end: SNS event → Segment API (mocked)
- End-to-end: Subscription confirmation → success
- Multiple records processing with real validator/transformer/integration
- Acceptance: All integration paths tested

**7. BDD Step Definitions (`tests/steps/story-18-lambda-handler-migration.steps.ts`)**
- Given: SNS event with Commercetools payload
- Given: SNS subscription confirmation event
- When: Lambda handler processes SNS event
- Then: Handler extracts payload from Message field
- Then: Handler processes customer.created/updated event
- Then: Handler returns successful response
- Then: Handler handles subscription confirmation
- Then: Handler processes multiple records
- Then: Handler maintains compatibility with existing logic
- Acceptance: All BDD scenarios executable

**8. CDK Integration (`infrastructure/lib/stack.ts`)**
- Add Lambda function to stack
- Subscribe Lambda to SNS topic
- Configure Lambda environment variables
- Grant Lambda permissions (SNS subscription, CloudWatch logs)
- Acceptance: CDK stack deploys Lambda, Lambda subscribed to SNS topic

**Tests:**

**Unit Tests:**
- Coverage: Adapter (100%), Handler (90%+)
- Framework: Vitest
- Mocks: Segment client (mock), AWS Lambda context (mock)
- Real: Validator, Transformer, Integration service (test with mocked Segment client)

**Integration Tests:**
- Coverage: Handler + business logic integration (70%+)
- Framework: Vitest
- Mocks: Segment API (HTTP mock), AWS Lambda context
- Real: Validator, Transformer, Integration service, SNS adapter

**BDD Tests:**
- Coverage: All feature scenarios (100%)
- Framework: Cucumber
- Mocks: Segment API (HTTP mock)
- Real: All business logic, SNS adapter, Lambda handler

**Mocks:**
- Segment Client: Mock identify/flush methods
- AWS Lambda Context: Mock context object
- Segment API: HTTP mock for E2E tests
- Real: Validator, Transformer, Integration service (with mocked Segment client)

**Risks:**
- SNS event structure variations → Comprehensive test cases for different event formats
- Multiple records processing complexity → Test aggregation logic thoroughly
- Subscription confirmation edge cases → Explicit handling, always return 200
- JSON parse errors in Message field → Try-catch with clear error messages
- Compatibility with existing logic → Reuse exact same functions, test compatibility scenarios