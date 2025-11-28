---
id: c3d4e5f6-a7b8-9012-3456-789012cdefgh
title: STORY-2 Implementation Plan
tags:
  - status/implemented
  - issue-2
  - implementation
  - webhook
category: IMP
created_at: '2025-11-27T13:30:00.000Z'
updated_at: '2025-11-27T13:30:00.000Z'
last_reviewed: '2025-11-27T13:30:00.000Z'
links: []
sources: []
abstract: >-
  Implementation plan for Webhook Endpoint: types, validator, handler, tests.
  Receive POST, validate, parse JSON, identify event types.
---

**Story:** #2 - Webhook Endpoint for Commercetools Events

**Scope:** Webhook reception and validation only. No auth, transformation, or Segment calls.

**Order:** 1.Types 2.Validator 3.Handler 4.UnitTests 5.BDDSteps 6.Integration

**Tasks:**
1. Install @vercel/node dev dependency
2. Create src/webhook/types.ts: CommercetoolsWebhookPayload, WebhookEventType, WebhookValidationResult
3. Create src/webhook/validator.ts: validateMethod, parseJSON, validatePayload, identifyEventType
4. Create api/webhook.ts: Vercel handler, call validator, return 200/400
5. Create tests/webhook/validator.test.ts: unit tests for all validator functions
6. Create tests/webhook/handler.test.ts: unit tests for handler with mocked VercelRequest/Response
7. Create tests/steps/story-2-webhook-endpoint.steps.ts: BDD step definitions
8. Update vercel.json: add functions config for webhook.ts

**Tests:**
- Unit(90%): Validator functions (method, JSON, payload, event type)
- Unit(85%): Handler (success/error paths, status codes)
- BDD(100%): All 8 scenarios from feature file
- Integration(70%): End-to-end handler with real validator

**Mocks:**
- VercelRequest/Response in handler tests
- Real: Validator functions (test actual validation logic)

**Dependencies:**
- @vercel/node: dev dependency for types
- No runtime dependencies (no env vars, no external APIs)

**Risks:**
- Vercel handler signature mismatch → verify with @vercel/node types
- JSON parsing edge cases → test malformed JSON thoroughly
- Payload structure variations → validate against Commercetools docs
- Event type mapping errors → test CustomerCreated/CustomerUpdated mapping

**Acceptance Criteria:**
- [ ] POST /api/webhook accepts valid customer.created payload → 200
- [ ] POST /api/webhook accepts valid customer.updated payload → 200
- [ ] Non-POST methods rejected → 400
- [ ] Missing body rejected → 400
- [ ] Invalid JSON rejected → 400
- [ ] Malformed payload rejected → 400
- [ ] Event type identified correctly (customer.created/updated)

**File Changes:**
- package.json: Add @vercel/node dev dependency
- src/webhook/types.ts: Create types
- src/webhook/validator.ts: Create validator functions
- api/webhook.ts: Create handler
- tests/webhook/validator.test.ts: Create unit tests
- tests/webhook/handler.test.ts: Create handler tests
- tests/steps/story-2-webhook-endpoint.steps.ts: Create BDD steps
- vercel.json: Update functions config

