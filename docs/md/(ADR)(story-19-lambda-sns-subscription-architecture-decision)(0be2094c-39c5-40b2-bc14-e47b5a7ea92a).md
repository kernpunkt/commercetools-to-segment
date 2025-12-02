---
id: 0be2094c-39c5-40b2-bc14-e47b5a7ea92a
title: STORY-19 Lambda-SNS Subscription Architecture Decision
tags:
  - story-19
  - status/active
  - component/infrastructure
  - component/sns
  - component/lambda
  - component/iam
category: ADR
created_at: '2025-12-02T10:52:19.561Z'
updated_at: '2025-12-02T10:52:19.561Z'
last_reviewed: '2025-12-02T10:52:19.561Z'
links: []
sources: []
abstract: >-
  Lambda-SNS subscription via CDK: direct invocation, auto-managed IAM,
  event-driven flow
---

**Decision:** Lambda function subscribed to SNS topic via CDK LambdaSubscription

**Rationale:** 
- Direct invocation eliminates HTTP overhead
- CDK manages IAM permissions automatically
- Event-driven architecture scales automatically
- Integrates existing SNS topic (story-17) with existing Lambda (story-18)

**Trade-offs:** 
+No HTTP overhead +Auto-scaling +CDK-managed IAM +Event-driven
-No request/response pattern -Async only -DLQ optional (deferred)

**Impact:** 
- SNS topic → Lambda subscription via `addSubscription()`
- IAM: SNS service principal gets `lambda:InvokeFunction` (auto)
- IAM: Lambda execution role gets `sns:Subscribe` (auto)
- Event flow: Commercetools → SNS → Lambda (direct)
- Documentation: Update architecture flow diagrams

**Alternatives Considered:**
- SQS queue between SNS and Lambda: Rejected - adds latency, not needed
- HTTP endpoint: Rejected - story goal is to eliminate HTTP overhead
- EventBridge: Deferred - SNS subscription simpler for this use case

**Implementation:**
- Use `aws-cdk-lib/aws-sns-subscriptions.LambdaSubscription`
- Use `topic.addSubscription(new LambdaSubscription(lambdaFunction))`
- CDK auto-grants SNS invoke permission to Lambda
- CDK auto-grants Lambda subscribe permission (if needed)