---
id: 463125e6-ac28-40af-9192-3442f8192239
title: STORY-18 Lambda Handler Architecture Decision
tags:
  - story-18
  - status/active
  - component/lambda
  - component/sns
category: ADR
created_at: '2025-12-02T08:41:23.273Z'
updated_at: '2025-12-02T08:41:23.273Z'
last_reviewed: '2025-12-02T08:41:23.273Z'
links: []
sources: []
abstract: >-
  Lambda handler processes SNS events, extracts Commercetools payload from
  Message field, adapts to existing request format, reuses business logic
  unchanged
---

**Decision:** AWS Lambda handler processes SNS events, extracts Commercetools payload from SNS Message field, adapts to existing request format, reuses validator/transformer/integration service unchanged

**Rationale:**
- SNS event structure differs from HTTP: payload in `Records[].Sns.Message` (JSON string)
- Existing business logic (validator, transformer, integration) is HTTP-agnostic
- Adapter layer converts SNS event → HTTP-like format → existing logic
- Subscription confirmation handled separately (SNS lifecycle)

**Trade-offs:**
+Reuse existing logic +Separation of concerns +Testable adapter
-Adapter layer complexity -SNS event parsing overhead

**Impact:**
- Lambda handler: `handler(event: SNSEvent, context: Context) → Promise<LambdaResponse>`
- Adapter: `extractCommercetoolsPayload(snsEvent: SNSEvent) → unknown`
- Format converter: `convertSnsToRequestFormat(snsMessage: string) → RequestBody`
- Subscription handler: `handleSubscriptionConfirmation(snsEvent: SNSEvent) → boolean`
- Business logic: Unchanged (validator, transformer, integration service)

**Alternatives Considered:**
- Rewrite business logic for SNS: Rejected - violates DRY, increases maintenance
- Dual handlers (HTTP + SNS): Selected - adapter pattern, single business logic
- SNS → HTTP proxy: Rejected - unnecessary network hop, latency

**Constraints:**
- Must handle SNS `Type: Notification` (Commercetools payload)
- Must handle SNS `Type: SubscriptionConfirmation` (SNS lifecycle)
- Must process multiple Records in single event
- Must extract JSON from `Sns.Message` string field
- Must maintain compatibility with existing validator/transformer/integration