---
id: 2d23c74d-5617-49aa-bcaf-faf3191853b7
title: STORY-17 SNS Infrastructure Architecture Decision
tags:
  - story-17
  - status/active
  - component/infrastructure
  - component/sns
  - component/iam
category: ADR
created_at: '2025-12-02T08:06:21.166Z'
updated_at: '2025-12-02T08:06:21.166Z'
last_reviewed: '2025-12-02T08:06:21.166Z'
links: []
sources: []
abstract: >-
  SNS topic with IAM resource policy for Commercetools publish access,
  environment-aware naming, ARN export
---

**Decision:** SNS topic with IAM resource policy for Commercetools publish access

**Rationale:** 
- Resource policy allows external IAM user (arn:aws:iam::362576667341:user/subscriptions) to publish
- Environment-aware naming enables multi-env deployment
- ARN export enables Commercetools subscription configuration

**Trade-offs:** 
+Simple IAM setup +External user access +Environment isolation
-No encryption at rest (SNS default) -No message filtering (future story)

**Impact:** 
- SNS topic: `commercetools-webhook-{env}` format
- IAM policy: Grant `sns:Publish` to Commercetools IAM user
- Stack output: Topic ARN for Commercetools config
- No Lambda subscription (future story)

**Alternatives Considered:**
- IAM user policy: Rejected - requires Commercetools account access
- SNS access policy: Selected - resource-based, stack-managed
- KMS encryption: Deferred - not in scope

**Implementation:**
- Use `aws-cdk-lib/aws-sns.Topic` construct
- Use `aws-cdk-lib/aws-iam.PolicyStatement` for resource policy
- Use `Stack.addOutput()` for ARN export
- Use CDK context/env vars for environment name