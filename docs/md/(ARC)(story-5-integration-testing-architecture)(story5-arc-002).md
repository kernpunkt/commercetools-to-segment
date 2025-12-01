---
id: story5-arc-002
title: STORY-5 Integration Testing Architecture
tags:
  - status/implemented
  - issue-5
  - story-5
  - component/testing
  - bdd
category: ARC
created_at: '2025-11-28T12:00:00.000Z'
updated_at: '2025-11-28T12:00:00.000Z'
last_reviewed: '2025-11-28T12:00:00.000Z'
links: []
sources: []
---

**Component:** Integration Testing (BDD with Cucumber)

**Contracts:**
- Feature files: `features/story-5-end-to-end-integration.feature`
- Step definitions: `tests/steps/story-5-end-to-end-integration.steps.ts`
- Test execution: `pnpm test:bdd` (Cucumber)
- Test environment: Local dev server or Vercel deployment

**Types:**
```typescript
// BDD Step Definitions
Given('a valid Commercetools customer.created webhook payload', ...)
When('I send the webhook payload to the webhook endpoint', ...)
Then('the customer should be created in Segment with userId "{string}"', ...)

// Test Data Structures
interface TestWebhookPayload {
  readonly notificationType: 'Message';
  readonly type: 'CustomerCreated' | 'CustomerUpdated';
  readonly customer: CommercetoolsCustomer;
  // ... other required fields
}

interface SegmentUserVerification {
  readonly userId: string;
  readonly traits: {
    readonly email: string;
    readonly name?: string;
    readonly address?: Address;
  };
}
```

**Dependencies:**
- Cucumber: BDD test framework
- Test webhook endpoint: Local or Vercel deployment
- Segment test workspace: For user verification
- Segment API: For verifying user data

**Test Scenarios:**
1. Complete flow for customer.created event creates user in Segment
2. Complete flow for customer.updated event updates user in Segment
3. User is identified by email in Segment
4. All three fields (email, name, address) are correctly synced
5. Complete flow processes customer.created event end-to-end
6. Complete flow processes customer.updated event end-to-end
7. Data flows correctly from webhook through transformation to Segment
8. Complete flow works with different customer data combinations (Scenario Outline)
9. Integration can be tested locally
10. Integration can be tested on Vercel

**Testing Strategy:**
- **Local Testing**: Run webhook handler locally, send test requests, verify Segment
- **Vercel Testing**: Deploy to Vercel, send test requests to production endpoint, verify Segment
- **Verification**: Check Segment dashboard or API for user data
- **Manual Testing**: Document procedures for manual validation

**Test Flow:**
1. Setup: Configure test environment (local or Vercel)
2. Given: Create test webhook payload with customer data
3. When: Send POST request to `/api/webhook` endpoint
4. Then: Verify HTTP 200 response
5. And: Verify user exists in Segment with correct data
6. Cleanup: Remove test data from Segment (if needed)

**Diagrams:**
```mermaid
flowchart TD
    A[BDD Feature File] -->|Gherkin Scenarios| B[Cucumber Test Runner]
    B -->|Execute Steps| C[Step Definitions]
    C -->|Send Request| D[Webhook Endpoint<br/>Local or Vercel]
    D -->|Process| E[Webhook Handler]
    E -->|Transform| F[Data Transformer]
    F -->|Send| G[Segment API]
    G -->|Create/Update| H[Segment Workspace]
    C -->|Verify| I[Segment API/Dashboard]
    I -->|Check User| H
    C -->|Assert| J[Test Result]
    J -->|Pass/Fail| B
```

```mermaid
sequenceDiagram
    participant Test as BDD Test
    participant Cucumber as Cucumber Runner
    participant Steps as Step Definitions
    participant Endpoint as Webhook Endpoint
    participant Handler as Webhook Handler
    participant Segment as Segment API
    participant Verify as Segment Verification

    Test->>Cucumber: Run feature file
    activate Cucumber
    Cucumber->>Steps: Given valid webhook payload
    activate Steps
    Steps-->>Cucumber: Payload created
    Cucumber->>Steps: When send to endpoint
    Steps->>Endpoint: POST /api/webhook
    activate Endpoint
    Endpoint->>Handler: Process request
    activate Handler
    Handler->>Segment: identify() + flush()
    activate Segment
    Segment-->>Handler: 200 OK
    deactivate Segment
    Handler-->>Endpoint: 200 OK
    deactivate Handler
    Endpoint-->>Steps: HTTP 200
    deactivate Endpoint
    Steps-->>Cucumber: Request sent
    Cucumber->>Steps: Then verify user in Segment
    Steps->>Verify: Check user data
    activate Verify
    Verify-->>Steps: User found with correct data
    deactivate Verify
    Steps-->>Cucumber: Assertion passed
    deactivate Steps
    Cucumber-->>Test: Test passed
    deactivate Cucumber
```

**Story:** #5

