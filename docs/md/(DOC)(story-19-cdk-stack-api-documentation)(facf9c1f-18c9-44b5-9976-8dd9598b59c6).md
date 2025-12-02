---
id: facf9c1f-18c9-44b5-9976-8dd9598b59c6
title: STORY-19 CDK Stack API Documentation
tags:
  - story-19
  - status/implemented
  - topic/api
  - component/infrastructure
  - component/cdk
  - component/sns
  - component/lambda
category: DOC
created_at: '2025-12-02T13:05:44.463Z'
updated_at: '2025-12-02T13:18:51.974Z'
last_reviewed: '2025-12-02T13:05:44.463Z'
links: []
sources: []
abstract: >-
  CDK Stack API documentation: public interfaces, properties, methods, IAM
  permissions, stack outputs, error handling, and CloudFormation resources for
  Story-19 Lambda-SNS integration.
---

# CDK Stack API Documentation - Story-19

## Overview

The `CdkStack` class provides AWS CDK infrastructure for integrating Commercetools webhooks with AWS SNS and Lambda. When a Lambda function is provided, it automatically creates a Lambda subscription to the SNS topic.

## Public Interface

### Class: `CdkStack`

**Location:** `infrastructure/lib/stack.ts`

**Extends:** `Stack` from `aws-cdk-lib`

### Constructor

```typescript
constructor(scope: Construct, id: string, props?: CdkStackProps)
```

**Parameters:**
- `scope` (Construct, required): Parent construct scope
- `id` (string, required): Unique identifier for the stack
- `props` (CdkStackProps, optional): Stack configuration properties

**Behavior:**
- Creates SNS topic with environment-aware naming
- Adds IAM resource policy for Commercetools IAM user
- Creates Lambda subscription when Lambda function is provided
- Exports stack outputs for SNS topic ARN and Lambda function ARN

### Public Properties

#### `snsTopic: Topic`

SNS topic for receiving Commercetools webhook events.

**Type:** `aws-cdk-lib/aws-sns.Topic`

**Access:** Read-only

**Example:**
```typescript
const stack = new CdkStack(app, 'MyStack');
const topicArn = stack.snsTopic.topicArn;
```

#### `topicName: string`

Name of the SNS topic (environment-aware).

**Format:** `commercetools-webhook-{environment}`

**Valid environments:** `dev`, `staging`, `prod`

**Default:** `commercetools-webhook-dev`

**Example:**
```typescript
const stack = new CdkStack(app, 'MyStack', { environment: 'prod' });
console.log(stack.topicName); // "commercetools-webhook-prod"
```

#### `topicArn: string`

ARN of the SNS topic.

**Format:** `arn:aws:sns:{region}:{account}:{topicName}`

**Example:**
```typescript
const stack = new CdkStack(app, 'MyStack');
console.log(stack.topicArn); // "arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev"
```

#### `lambdaFunction?: lambda.IFunction`

Optional Lambda function for processing SNS messages.

**Type:** `aws-cdk-lib/aws-lambda.IFunction | undefined`

**Access:** Read-only

**Behavior:**
- When provided, automatically creates a Lambda subscription to the SNS topic
- CDK auto-grants IAM permissions for SNS to invoke Lambda
- Stack output `LambdaFunctionArn` is created when Lambda is in the same stack

**Example:**
```typescript
const lambdaFunction = new Function(lambdaStack, 'MyLambda', { /* ... */ });
const stack = new CdkStack(app, 'MyStack', { lambdaFunction });
console.log(stack.lambdaFunction?.functionArn);
```

### Interface: `CdkStackProps`

**Extends:** `StackProps` from `aws-cdk-lib`

**Properties:**

```typescript
interface CdkStackProps extends StackProps {
  readonly description?: string;
  readonly tags?: Record<string, string>;
  readonly environment?: 'dev' | 'staging' | 'prod';
  readonly commercetoolsIamUserArn?: string;
  readonly lambdaFunction?: lambda.IFunction;
}
```

**Property Details:**

- `description` (string, optional): Stack description
- `tags` (Record<string, string>, optional): Key-value pairs for stack tags
- `environment` ('dev' | 'staging' | 'prod', optional): Environment name (default: 'dev')
- `commercetoolsIamUserArn` (string, optional): IAM user ARN for Commercetools (default: `arn:aws:iam::362576667341:user/subscriptions`)
- `lambdaFunction` (lambda.IFunction, optional): Lambda function to subscribe to SNS topic

**Validation:**
- `environment` must be one of: `dev`, `staging`, `prod`
- `commercetoolsIamUserArn` must match format: `arn:aws:iam::\d{12}:user/[\w+=,.@-]+`

### Helper Functions

#### `setupLambdaSubscription(stack: CdkStack, lambdaFunction: lambda.IFunction): void`

Sets up Lambda subscription to SNS topic and creates stack outputs.

**Parameters:**
- `stack` (CdkStack): Stack instance
- `lambdaFunction` (lambda.IFunction): Lambda function to subscribe

**Behavior:**
- Creates `LambdaSubscription` using `stack.snsTopic.addSubscription()`
- CDK auto-grants `lambda:InvokeFunction` permission to SNS service principal
- Creates `LambdaFunctionArn` stack output when Lambda is in the same stack
- Skips output creation for cross-stack Lambda references to avoid dependency cycles

**Internal Use:** This function is called automatically by the constructor when `lambdaFunction` is provided.

## Stack Outputs

### `SnsTopicArn`

**Type:** `CfnOutput`

**Value:** SNS topic ARN (CDK Ref token)

**Description:** "ARN of the SNS topic for Commercetools webhook events"

**Always Created:** Yes

### `LambdaFunctionArn`

**Type:** `CfnOutput`

**Value:** Lambda function ARN (CDK Ref token)

**Description:** "ARN of the Lambda function for processing Commercetools events"

**Created When:** Lambda function is provided AND Lambda is in the same stack

**Note:** Cross-stack Lambda references don't create outputs to avoid dependency cycles.

## IAM Permissions

### Auto-Granted Permissions

When a Lambda subscription is created, CDK automatically grants:

1. **SNS → Lambda:**
   - **Permission:** `lambda:InvokeFunction`
   - **Principal:** `sns.amazonaws.com` (SNS service principal)
   - **Resource:** Lambda function ARN
   - **Created As:** `AWS::Lambda::Permission` CloudFormation resource

2. **Lambda → SNS:**
   - **Permission:** `sns:Subscribe` (if needed)
   - **Auto-granted:** By CDK LambdaSubscription construct

### Manual Permissions

The stack creates an IAM resource policy for the SNS topic:

- **Principal:** Commercetools IAM user ARN
- **Action:** `sns:Publish`
- **Resource:** SNS topic ARN
- **Created As:** `AWS::SNS::TopicPolicy` CloudFormation resource

## Error Handling

### Validation Errors

The constructor throws errors for invalid input:

- **Invalid environment:** `Invalid environment: {value}. Must be one of: dev, staging, prod`
- **Invalid IAM ARN format:** `Invalid IAM user ARN format: {arn}. Expected format: arn:aws:iam::ACCOUNT_ID:user/USER_NAME`

### Type Guards

- `validateEnvironment(environment: string): asserts environment is 'dev' | 'staging' | 'prod'`
- `validateIamUserArn(arn: string): void`

## Dependencies

### CDK Constructs

- `aws-cdk-lib/aws-sns.Topic`
- `aws-cdk-lib/aws-sns-subscriptions.LambdaSubscription`
- `aws-cdk-lib/aws-lambda.IFunction`
- `aws-cdk-lib/aws-iam.PolicyStatement`
- `aws-cdk-lib.Stack`
- `aws-cdk-lib.CfnOutput`

### Required CDK Version

Compatible with AWS CDK v2 (`aws-cdk-lib`).

## CloudFormation Resources

The stack creates the following CloudFormation resources:

1. **AWS::SNS::Topic** - SNS topic for webhook events
2. **AWS::SNS::TopicPolicy** - IAM resource policy for Commercetools
3. **AWS::SNS::Subscription** - Lambda subscription (when Lambda provided)
4. **AWS::Lambda::Permission** - SNS invoke permission (when Lambda provided)
5. **AWS::CloudFormation::Stack** - Stack itself

## Testing

See `tests/infrastructure/stack.test.ts` for comprehensive test coverage:

- Stack construction with/without Lambda
- Subscription creation
- IAM permissions verification
- Stack output validation
- CloudFormation template synthesis

**Test Coverage:** 32 tests covering all code paths and edge cases.