---
id: 9558648c-5996-446f-963f-5ed471043b54
title: STORY-19 Lambda-SNS Integration Implementation Plan
tags:
  - story-19
  - status/implemented
  - component/infrastructure
  - component/sns
  - component/lambda
  - component/iam
  - implementation
category: IMP
created_at: '2025-12-02T10:54:49.968Z'
updated_at: '2025-12-02T13:18:48.765Z'
last_reviewed: '2025-12-02T10:54:49.968Z'
links: []
sources: []
abstract: >-
  Lambda-SNS subscription: props extension, subscription creation, IAM
  auto-grant, tests, docs update
---

**Story:** #19 - SNS Subscription and Lambda Integration

**Order:** 1.Props 2.Import 3.Subscription 4.Output 5.UnitTests 6.IntegrationTests 7.Docs

**Tasks:**

1. **Extend CdkStackProps Interface**
   - Add `lambdaFunction?: lambda.IFunction` (optional, from story-18)
   - Update `infrastructure/lib/stack.ts`
   - Acceptance: Props interface includes optional Lambda function

2. **Import Lambda Subscription Module**
   - Import `aws-cdk-lib/aws-sns-subscriptions.LambdaSubscription`
   - Import `aws-cdk-lib/aws-lambda` types
   - Update imports in `infrastructure/lib/stack.ts`
   - Acceptance: Imports available for Lambda subscription

3. **Add Lambda Property to CdkStack**
   - Add `public readonly lambdaFunction?: lambda.IFunction` property
   - Store Lambda from props in constructor
   - Acceptance: Stack exposes Lambda function property

4. **Create Lambda-SNS Subscription**
   - Check if Lambda function exists in props
   - Use `snsTopic.addSubscription(new LambdaSubscription(lambdaFunction))`
   - CDK auto-grants IAM permissions (lambda:InvokeFunction, sns:Subscribe)
   - Acceptance: Subscription created when Lambda provided

5. **Add Stack Output for Lambda ARN (Optional)**
   - Create `CfnOutput` for Lambda function ARN if Lambda exists
   - Key: `LambdaFunctionArn`
   - Acceptance: Stack output contains Lambda ARN when Lambda exists

6. **Unit Tests: Lambda Subscription Creation**
   - Test: Subscription created when Lambda provided
   - Test: No subscription when Lambda not provided
   - Test: IAM permissions auto-granted by CDK
   - Test: Subscription uses correct Lambda function
   - Acceptance: All unit tests pass

7. **Unit Tests: Stack Output**
   - Test: Lambda ARN output created when Lambda provided
   - Test: No Lambda output when Lambda not provided
   - Acceptance: Output tests pass

8. **Integration Tests: CDK Stack Synthesis**
   - Test: Stack synthesizes with Lambda subscription
   - Test: CloudFormation template contains SNS subscription resource
   - Test: CloudFormation template contains IAM permissions
   - Acceptance: Stack synthesizes successfully

9. **Integration Tests: IAM Permissions Verification**
   - Test: SNS service principal has lambda:InvokeFunction permission
   - Test: Lambda execution role has sns:Subscribe permission (if needed)
   - Acceptance: IAM permissions correct in CloudFormation template

10. **Update Documentation: Architecture Flow**
    - Update `docs/COMMERCETOOLS_SUBSCRIPTION_SETUP.md`
    - Change flow: Commercetools → SNS → Lambda (remove HTTP endpoint)
    - Update SNS subscription setup: Lambda instead of HTTPS
    - Acceptance: Documentation reflects Lambda integration

11. **Update Documentation: Architecture Diagrams**
    - Update any architecture diagrams to show Lambda integration
    - Remove HTTP endpoint references
    - Show direct SNS → Lambda invocation
    - Acceptance: Diagrams updated

**Tests:**

**Unit Tests (90% coverage):**
- Stack construction with Lambda
- Stack construction without Lambda
- Subscription creation logic
- Stack output creation
- Props validation

**Integration Tests (70% coverage):**
- CDK stack synthesis
- CloudFormation template validation
- IAM permissions verification
- Resource dependencies

**E2E Tests (50% coverage):**
- Deferred (belongs to testing story)

**Mocks:**
- Mock: `lambda.Function` construct (CDK construct, not business logic)
- Real: SNS Topic (from story-17, already exists)
- Real: CDK Stack synthesis (test actual CloudFormation output)
- Real: IAM permissions (verify actual permissions in template)

**Risks:**
- Lambda not created in story-18 → Make Lambda optional in props, handle gracefully
- IAM permissions not auto-granted → Verify CDK version, check LambdaSubscription docs
- Subscription confirmation → Lambda handles SNS subscription confirmation (story-18 scope)
- Stack deployment order → Lambda must exist before subscription (dependency on story-18)

**Dependencies:**
- Story-17: SNS topic must exist (✅ implemented)
- Story-18: Lambda function must exist (⚠️ assumed, make optional)
- CDK: `aws-cdk-lib/aws-sns-subscriptions` package

**File Changes:**
- `infrastructure/lib/stack.ts`: Add Lambda prop, subscription, output
- `tests/infrastructure/stack.test.ts`: Add subscription tests
- `docs/COMMERCETOOLS_SUBSCRIPTION_SETUP.md`: Update flow documentation