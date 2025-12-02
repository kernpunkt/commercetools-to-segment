---
id: b3f7b92a-2a7c-4ff9-b27c-9ba0d4c8d13e
title: STORY-17 SNS Infrastructure API Documentation
tags:
  - story-17
  - status/implemented
  - topic/api
  - component/infrastructure
  - component/sns
  - component/iam
category: DOC
created_at: '2025-12-02T08:28:26.830Z'
updated_at: '2025-12-02T08:32:45.724Z'
last_reviewed: '2025-12-02T08:28:26.830Z'
links: []
sources: []
abstract: >-
  Complete API documentation for SNS infrastructure components: CdkStack class,
  CdkStackProps interface, validation functions, and public methods
---

# STORY-17 SNS Infrastructure API Documentation

**Component:** SNS Topic Infrastructure  
**Story:** #17  
**Last Updated:** 2025-12-02

## Overview

The SNS infrastructure component provides AWS CDK constructs for creating SNS topics with IAM resource policies for Commercetools webhook event publishing. The implementation includes environment-aware naming, validation, and CloudFormation output exports.

## Public Interfaces

### `CdkStackProps` Interface

Extends AWS CDK's `StackProps` with additional properties for SNS topic configuration.

```typescript
export interface CdkStackProps extends StackProps {
  readonly description?: string;
  readonly tags?: Record<string, string>;
  readonly environment?: 'dev' | 'staging' | 'prod';
  readonly commercetoolsIamUserArn?: string;
}
```

#### Properties

- **`description?: string`**  
  Optional stack description. Passed through to AWS CDK StackProps.

- **`tags?: Record<string, string>`**  
  Optional key-value pairs for stack tags. Applied to all resources in the stack using CDK's tag system.

- **`environment?: 'dev' | 'staging' | 'prod'`**  
  Environment identifier for topic naming. Defaults to `'dev'` if not provided.  
  **Validation:** Must be one of: `'dev'`, `'staging'`, `'prod'`  
  **Throws:** `Error` if invalid environment value provided

- **`commercetoolsIamUserArn?: string`**  
  IAM user ARN for Commercetools publish access. Defaults to `'arn:aws:iam::362576667341:user/subscriptions'` if not provided.  
  **Validation:** Must match IAM user ARN format: `arn:aws:iam::ACCOUNT_ID:user/USER_NAME`  
  **Throws:** `Error` if ARN format is invalid

#### Inheritance

Extends `StackProps` from `aws-cdk-lib`, inheriting:
- `env?: Environment` - AWS account and region
- `analyticsReporting?: boolean` - CDK analytics
- `description?: string` - Stack description
- `stackName?: string` - Stack name
- `tags?: { [key: string]: string }` - Stack tags
- `terminationProtection?: boolean` - Termination protection

### `CdkStack` Class

AWS CDK Stack class that creates SNS topic infrastructure with IAM resource policies.

```typescript
export class CdkStack extends Stack {
  public readonly snsTopic: Topic;
  public readonly topicName: string;
  public readonly topicArn: string;

  constructor(scope: Construct, id: string, props?: CdkStackProps);
}
```

#### Constructor

**Parameters:**
- **`scope: Construct`** - Parent construct (typically `App`)
- **`id: string`** - Stack identifier
- **`props?: CdkStackProps`** - Optional stack configuration

**Behavior:**
1. Validates environment value (if provided)
2. Creates SNS topic with environment-aware naming
3. Validates IAM user ARN (if provided)
4. Attaches IAM resource policy to topic
5. Exports topic ARN as CloudFormation output

**Throws:**
- `Error` if environment value is invalid
- `Error` if IAM user ARN format is invalid

#### Public Properties

- **`snsTopic: Topic`**  
  AWS SNS Topic construct instance. Use this for CDK operations and CloudFormation resource references.

- **`topicName: string`**  
  Computed topic name: `commercetools-webhook-{environment}`  
  **Format:** `commercetools-webhook-dev` | `commercetools-webhook-staging` | `commercetools-webhook-prod`  
  **Use Case:** Testing, logging, debugging

- **`topicArn: string`**  
  Computed topic ARN: `arn:aws:sns:{region}:{account}:{topicName}`  
  **Format:** `arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev`  
  **Use Case:** Testing, logging, debugging  
  **Note:** Uses CDK's account/region resolution (no hardcoded defaults)

## Internal Functions

### `validateIamUserArn(arn: string): void`

Validates IAM user ARN format.

**Parameters:**
- **`arn: string`** - IAM user ARN to validate

**Throws:**
- `Error` with message: `"Invalid IAM user ARN format: {arn}. Expected format: arn:aws:iam::ACCOUNT_ID:user/USER_NAME"`

**Validation Pattern:**
```regex
^arn:aws:iam::\d{12}:user\/[\w+=,.@-]+$
```

**Valid Examples:**
- `arn:aws:iam::123456789012:user/subscriptions`
- `arn:aws:iam::362576667341:user/commercetools-user`
- `arn:aws:iam::999999999999:user/custom-user`

**Invalid Examples:**
- `invalid-arn` (missing prefix)
- `arn:aws:iam::123:user/test` (invalid account ID length)
- `arn:aws:iam::123456789012:role/test-role` (wrong resource type)

### `validateEnvironment(environment: string): asserts environment is 'dev' | 'staging' | 'prod'`

Validates environment value and provides TypeScript type narrowing.

**Parameters:**
- **`environment: string`** - Environment value to validate

**Returns:**
- TypeScript type assertion that narrows type to `'dev' | 'staging' | 'prod'`

**Throws:**
- `Error` with message: `"Invalid environment: {environment}. Must be one of: dev, staging, prod"`

**Valid Values:**
- `'dev'`
- `'staging'`
- `'prod'`

**Invalid Examples:**
- `'development'` (not in allowed list)
- `'production'` (not in allowed list)
- `'invalid'` (not in allowed list)

### `buildStackProps(props?: CdkStackProps): StackProps | undefined`

Builds StackProps from CdkStackProps, only including defined values.

**Parameters:**
- **`props?: CdkStackProps`** - Optional stack props

**Returns:**
- `StackProps` object with only defined values, or `undefined` if no props provided

**Behavior:**
- Only includes `env` if provided
- Only includes `description` if provided
- Returns `undefined` if no props provided (allows CDK default behavior)

## CloudFormation Outputs

### `SnsTopicArn`

Exports the SNS topic ARN as a CloudFormation output.

**Key:** `SnsTopicArn`  
**Value:** Topic ARN (CDK token, resolved during synthesis)  
**Description:** `"ARN of the SNS topic for Commercetools webhook events"`  
**Export:** Not exported (can be added for cross-stack references)

**Usage:**
```typescript
// In CloudFormation template
Outputs:
  SnsTopicArn:
    Value: !Ref CommercetoolsWebhookTopic
    Description: ARN of the SNS topic for Commercetools webhook events
```

## IAM Resource Policy

The stack automatically creates an IAM resource policy on the SNS topic.

**Principal:** Commercetools IAM user ARN (from props or default)  
**Action:** `sns:Publish`  
**Resource:** Topic ARN  
**Effect:** Allow

**Policy Structure:**
```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::362576667341:user/subscriptions"
      },
      "Action": "sns:Publish",
      "Resource": "arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev"
    }
  ]
}
```

## Type Definitions

### Topic Policy Resource Type

Used in tests for CloudFormation template validation:

```typescript
type TopicPolicyResource = {
  Properties?: {
    PolicyDocument?: {
      Statement?: ReadonlyArray<{
        Principal?: { AWS?: string };
        Action?: string | ReadonlyArray<string>;
      }>;
    };
  };
};
```

## Error Handling

All validation errors throw `Error` objects with descriptive messages:

- **Environment Validation:** `"Invalid environment: {value}. Must be one of: dev, staging, prod"`
- **IAM ARN Validation:** `"Invalid IAM user ARN format: {arn}. Expected format: arn:aws:iam::ACCOUNT_ID:user/USER_NAME"`

## Dependencies

- `aws-cdk-lib` - AWS CDK core library
- `aws-cdk-lib/aws-sns` - SNS constructs
- `aws-cdk-lib/aws-iam` - IAM constructs
- `constructs` - CDK construct base classes

## Related Documentation

- [STORY-17 Architecture Design](../ARC/story-17-architecture.md)
- [STORY-17 Implementation Plan](../IMP/story-17-implementation.md)
- [STORY-17 Code Review](../CRV/story-17-review.md)