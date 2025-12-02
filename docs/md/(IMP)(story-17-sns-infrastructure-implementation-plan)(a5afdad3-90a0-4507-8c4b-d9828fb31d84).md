---
id: a5afdad3-90a0-4507-8c4b-d9828fb31d84
title: STORY-17 SNS Infrastructure Implementation Plan
tags:
  - story-17
  - status/implemented
  - component/infrastructure
  - component/sns
  - component/iam
  - implementation
category: IMP
created_at: '2025-12-02T08:08:47.091Z'
updated_at: '2025-12-02T08:32:44.434Z'
last_reviewed: '2025-12-02T08:08:47.091Z'
links: []
sources: []
abstract: >-
  SNS infrastructure implementation: extend stack props, create topic, add IAM
  policy, export ARN, unit/integration tests
---

**Story:** #17 - SNS Infrastructure Setup

**Order:** 1.Props 2.Topic 3.IAM 4.Output 5.UnitTests 6.IntegrationTests

**Tasks:**

1. **Extend CdkStackProps Interface**
   - Add `environment?: 'dev' | 'staging' | 'prod'` (optional, default 'dev')
   - Add `commercetoolsIamUserArn?: string` (optional, default from story)
   - Update `infrastructure/lib/stack.ts`
   - Acceptance: Props interface extends with optional env and IAM user ARN

2. **Create SNS Topic in CdkStack**
   - Import `aws-cdk-lib/aws-sns.Topic`
   - Generate topic name: `commercetools-webhook-${environment || 'dev'}`
   - Create Topic construct in constructor
   - Store topic reference as readonly property
   - Acceptance: Topic created with correct name format

3. **Add IAM Resource Policy**
   - Import `aws-cdk-lib/aws-iam.PolicyStatement`, `ArnPrincipal`
   - Create policy statement: principal=IAM user, action=sns:Publish, resource=topic ARN
   - Use `topic.addToResourcePolicy()` to attach policy
   - Default IAM user ARN: `arn:aws:iam::362576667341:user/subscriptions`
   - Acceptance: IAM policy allows Commercetools user to publish

4. **Export Topic ARN as Stack Output**
   - Import `aws-cdk-lib.CfnOutput`
   - Create output with key `SnsTopicArn`
   - Value: `topic.topicArn`
   - Optional: Named export for cross-stack reference
   - Acceptance: Stack output contains topic ARN

5. **Unit Tests: SNS Topic Creation**
   - Test topic creation with environment prop
   - Test topic name generation (dev/staging/prod)
   - Test default environment (dev)
   - Test topic ARN format
   - File: `tests/infrastructure/stack.test.ts`
   - Acceptance: All topic creation tests pass

6. **Unit Tests: IAM Policy**
   - Test IAM policy attachment to topic
   - Test policy principal (Commercetools IAM user)
   - Test policy action (sns:Publish)
   - Test custom IAM user ARN from props
   - Test default IAM user ARN
   - File: `tests/infrastructure/stack.test.ts`
   - Acceptance: All IAM policy tests pass

7. **Unit Tests: Stack Output**
   - Test stack output creation
   - Test output key (SnsTopicArn)
   - Test output value (topic ARN)
   - File: `tests/infrastructure/stack.test.ts`
   - Acceptance: All stack output tests pass

8. **Integration Tests: Stack Synthesis**
   - Test CloudFormation template synthesis
   - Verify SNS topic resource in template
   - Verify IAM policy resource in template
   - Verify stack output in template
   - Use `stack.toCloudFormation()` or `app.synth()`
   - File: `tests/infrastructure/stack.test.ts` or new integration test file
   - Acceptance: Synthesized template contains all resources

**Tests:**

**Unit Tests (90% coverage):**
- Topic creation with all environment variants
- Topic name generation logic
- IAM policy statement creation
- Stack output creation
- Props validation

**Integration Tests (70% coverage):**
- Stack synthesis (CloudFormation template generation)
- Resource presence in template
- Resource properties validation
- Output presence in template

**Test Types:**
- **Unit:** CDK construct instantiation, property validation
- **Integration:** Stack synthesis, template validation
- **No BDD:** Infrastructure story (not user-facing behavior)
- **No E2E:** Deployment testing deferred (manual verification)

**Mocks:**
- **Mock:** None (CDK constructs are testable without mocks)
- **Real:** CDK App, Stack, SNS Topic, IAM Policy, CfnOutput
- **Test Doubles:** Use CDK's in-memory synthesis (no AWS calls)

**Risks:**

1. **Topic Name Collision:** Environment-aware naming prevents conflicts
   - **Mitigation:** Use environment prefix in topic name

2. **IAM Policy Format:** Incorrect policy structure prevents publish
   - **Mitigation:** Follow CDK IAM policy patterns, test policy structure

3. **Stack Output Format:** Incorrect ARN format breaks Commercetools config
   - **Mitigation:** Use `topic.topicArn` property (CDK-managed), validate in tests

4. **Environment Default:** Missing environment defaults to 'dev'
   - **Mitigation:** Explicit default in code, document in props interface

**File Structure:**

```
infrastructure/
  lib/
    stack.ts              # Extended with SNS topic, IAM policy, output
tests/
  infrastructure/
    stack.test.ts         # Extended with SNS tests
```

**Dependencies:**
- `aws-cdk-lib/aws-sns.Topic` (already in package.json)
- `aws-cdk-lib/aws-iam.PolicyStatement`, `ArnPrincipal` (already in package.json)
- `aws-cdk-lib.CfnOutput` (already in package.json)

**Acceptance Criteria Mapping:**

- [x] SNS topic created in CDK stack → Task 2
- [x] SNS topic has appropriate name → Task 2
- [x] IAM policy allows Commercetools user to publish → Task 3
- [x] SNS topic ARN exported as stack output → Task 4
- [x] CDK stack deploys successfully → Task 8 (synthesis test)
- [x] SNS topic visible in AWS Console → Manual verification (out of scope)
- [x] IAM permissions verified in AWS Console → Manual verification (out of scope)
- [x] Documentation updated → Separate task (out of scope)

**Implementation Notes:**

- **Environment Handling:** Use optional prop with default 'dev', validate enum values
- **IAM User ARN:** Use optional prop with default from story requirements
- **Topic Naming:** Follow pattern `commercetools-webhook-{env}` exactly
- **Policy Attachment:** Use `addToResourcePolicy()` method on topic
- **Output Export:** Use `CfnOutput` construct, consider named export for future cross-stack
- **Testing:** Follow existing patterns from `stack.test.ts` and `app.test.ts`