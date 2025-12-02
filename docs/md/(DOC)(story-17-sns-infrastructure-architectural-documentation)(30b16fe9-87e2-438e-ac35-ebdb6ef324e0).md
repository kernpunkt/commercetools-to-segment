---
id: 30b16fe9-87e2-438e-ac35-ebdb6ef324e0
title: STORY-17 SNS Infrastructure Architectural Documentation
tags:
  - story-17
  - status/implemented
  - topic/architecture
  - component/infrastructure
  - component/sns
  - component/iam
category: DOC
created_at: '2025-12-02T08:29:59.082Z'
updated_at: '2025-12-02T08:32:48.240Z'
last_reviewed: '2025-12-02T08:29:59.082Z'
links: []
sources: []
abstract: >-
  Architectural documentation for SNS infrastructure: component relationships,
  data flow, design decisions, and integration patterns
---

# STORY-17 SNS Infrastructure Architectural Documentation

**Component:** SNS Topic Infrastructure  
**Story:** #17  
**Last Updated:** 2025-12-02

## Architecture Overview

The SNS infrastructure component provides a CDK stack that creates an AWS SNS topic with IAM resource policies, enabling Commercetools to publish webhook events. The architecture follows AWS CDK best practices with environment-aware naming, validation, and CloudFormation output exports.

## Component Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CDK Application                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    CdkStack                           │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │            SNS Topic                          │    │  │
│  │  │  Name: commercetools-webhook-{env}            │    │  │
│  │  │  Type: Standard Topic                         │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │                        │                              │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │         IAM Resource Policy                   │    │  │
│  │  │  Principal: Commercetools IAM User            │    │  │
│  │  │  Action: sns:Publish                          │    │  │
│  │  │  Resource: Topic ARN                          │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │                        │                              │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │         CloudFormation Output                 │    │  │
│  │  │  Key: SnsTopicArn                            │    │  │
│  │  │  Value: Topic ARN                            │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Deploy
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS CloudFormation                        │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐             │
│  │  SNS Topic       │    │  IAM Policy      │             │
│  │  Resource        │◄───│  Resource         │             │
│  └──────────────────┘    └──────────────────┘             │
│                                                              │
│  ┌──────────────────┐                                       │
│  │  Stack Output    │                                       │
│  │  SnsTopicArn     │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ ARN Reference
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Commercetools                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Subscription Configuration                 │  │
│  │  Topic ARN: arn:aws:sns:...                           │  │
│  │  IAM User: arn:aws:iam::362576667341:user/...        │  │
│  └──────────────────────────────────────────────────────┘  │
│                        │                                    │
│                        │ Publish Events                     │
│                        ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            SNS Topic (AWS)                            │  │
│  │  Receives webhook events from Commercetools           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Relationships

### Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CdkStack                              │
│  + snsTopic: Topic                                          │
│  + topicName: string                                        │
│  + topicArn: string                                         │
│  + constructor(scope, id, props?)                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ creates
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                         Topic                                │
│  (aws-cdk-lib/aws-sns)                                      │
│  + topicName: string                                        │
│  + topicArn: Token                                          │
│  + addToResourcePolicy(policy): void                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ has policy
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    PolicyStatement                           │
│  (aws-cdk-lib/aws-iam)                                      │
│  + principals: ArnPrincipal[]                               │
│  + actions: string[]                                       │
│  + resources: string[]                                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ uses
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      ArnPrincipal                           │
│  (aws-cdk-lib/aws-iam)                                      │
│  + arn: string                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Stack Construction
   ┌─────────────┐
   │ CdkStack   │
   │ Props      │
   └─────┬──────┘
         │
         ├─► Validate Environment
         │   └─► validateEnvironment()
         │
         ├─► Generate Topic Name
         │   └─► commercetools-webhook-{env}
         │
         ├─► Create SNS Topic
         │   └─► new Topic()
         │
         ├─► Validate IAM ARN
         │   └─► validateIamUserArn()
         │
         ├─► Create IAM Policy
         │   └─► new PolicyStatement()
         │
         ├─► Attach Policy to Topic
         │   └─► topic.addToResourcePolicy()
         │
         └─► Export Topic ARN
             └─► new CfnOutput()

2. CloudFormation Deployment
   ┌─────────────┐
   │ CDK Stack  │
   └─────┬───────┘
         │
         ├─► Synthesize Template
         │   └─► app.synth()
         │
         ├─► Create SNS Topic Resource
         │   └─► AWS::SNS::Topic
         │
         ├─► Create IAM Policy Resource
         │   └─► AWS::SNS::TopicPolicy
         │
         └─► Create Stack Output
             └─► Outputs.SnsTopicArn

3. Runtime (Commercetools → SNS)
   ┌─────────────────┐
   │ Commercetools   │
   └────────┬────────┘
            │
            ├─► Authenticate with IAM User
            │   └─► arn:aws:iam::362576667341:user/subscriptions
            │
            ├─► Publish Event to Topic
            │   └─► sns:Publish action
            │
            └─► SNS Topic Receives Event
                └─► Event available for subscribers
```

## Design Decisions

### 1. Environment-Aware Naming

**Decision:** Topic names include environment prefix: `commercetools-webhook-{env}`

**Rationale:**
- Enables multi-environment deployments in same AWS account
- Prevents naming conflicts between environments
- Makes topic identification clear in AWS Console

**Trade-offs:**
- ✅ Clear environment separation
- ✅ No naming conflicts
- ⚠️ Requires environment prop management

### 2. IAM Resource Policy (Not User Policy)

**Decision:** Use SNS resource policy instead of IAM user policy

**Rationale:**
- Resource policy is managed by our CDK stack
- No need for access to Commercetools AWS account
- Policy attached to resource, not user

**Trade-offs:**
- ✅ Stack-managed policy
- ✅ No external account access needed
- ⚠️ Policy tied to specific resource

### 3. Validation at Construction Time

**Decision:** Validate environment and IAM ARN during stack construction

**Rationale:**
- Fail fast with clear error messages
- Type safety with TypeScript type assertions
- Prevents invalid CloudFormation templates

**Trade-offs:**
- ✅ Early error detection
- ✅ Type safety
- ⚠️ Validation happens before deployment

### 4. Computed Properties for Testing

**Decision:** Store `topicName` and `topicArn` as computed string properties

**Rationale:**
- Enables direct property access in tests
- Avoids CDK token resolution complexity in tests
- Maintains CDK token usage for CloudFormation

**Trade-offs:**
- ✅ Test-friendly API
- ✅ No property override hacks
- ⚠️ Properties computed from CDK account/region

### 5. Default Values

**Decision:** Default environment to 'dev', default IAM ARN to Commercetools user

**Rationale:**
- Simplifies development setup
- Sensible defaults for common use case
- Can be overridden for production

**Trade-offs:**
- ✅ Easy development
- ✅ Sensible defaults
- ⚠️ Must explicitly set for production

## Integration Patterns

### CDK Stack Integration

```typescript
// Stack is integrated into CDK app
const app = new App();
const stack = new CdkStack(app, 'StackId', props);
app.synth(); // Generates CloudFormation template
```

### Commercetools Integration

1. **Deploy Stack** → Get topic ARN from CloudFormation output
2. **Configure Commercetools Subscription** → Use topic ARN
3. **Commercetools Publishes** → Events sent to SNS topic
4. **Future: Lambda Subscription** → Process events from topic

### Multi-Environment Pattern

```typescript
// Deploy to multiple environments
['dev', 'staging', 'prod'].forEach(env => {
  new CdkStack(app, `${env}-stack`, { environment: env });
});
```

## Security Architecture

### IAM Policy Structure

```
Resource: SNS Topic ARN
Principal: Commercetools IAM User ARN
Action: sns:Publish
Effect: Allow
```

### Security Considerations

1. **Least Privilege:** Only `sns:Publish` action granted
2. **Resource Scoping:** Policy scoped to specific topic ARN
3. **Principal Validation:** IAM ARN format validated
4. **No Secrets:** IAM ARN is public identifier (not sensitive)

## Scalability Considerations

### Current Limitations

- Single topic per stack
- No message filtering (all messages published)
- No encryption at rest (SNS default)

### Future Enhancements

- Multiple topics for different event types
- Message filtering with subscription filters
- KMS encryption for topic
- Dead-letter queues for failed processing

## Monitoring and Observability

### CloudFormation Outputs

- `SnsTopicArn`: Topic ARN for external systems

### AWS CloudWatch Metrics

- `NumberOfMessagesPublished`: Messages published to topic
- `NumberOfMessagesDelivered`: Messages delivered to subscribers
- `PublishSize`: Size of published messages

### Recommended Monitoring

1. Monitor publish success rate
2. Monitor message delivery failures
3. Alert on topic errors
4. Track message volume trends

## Deployment Architecture

### CDK Synthesis Flow

```
CDK App
  │
  ├─► CdkStack Construction
  │   ├─► Validate Inputs
  │   ├─► Create Constructs
  │   └─► Attach Policies
  │
  ├─► Synthesis
  │   └─► Generate CloudFormation Template
  │
  └─► Deployment
      └─► CloudFormation Creates Resources
```

### Resource Dependencies

```
Stack
  │
  ├─► SNS Topic (no dependencies)
  │
  ├─► IAM Policy (depends on: Topic)
  │
  └─► Stack Output (depends on: Topic)
```

## Error Handling Architecture

### Validation Flow

```
Input → Validate Environment → Validate IAM ARN → Create Resources
         │                      │
         └─► Error if invalid   └─► Error if invalid
```

### Error Types

1. **Environment Validation Error**
   - Triggered: Invalid environment value
   - Message: "Invalid environment: {value}. Must be one of: dev, staging, prod"

2. **IAM ARN Validation Error**
   - Triggered: Invalid IAM ARN format
   - Message: "Invalid IAM user ARN format: {arn}. Expected format: arn:aws:iam::ACCOUNT_ID:user/USER_NAME"

## Related Documentation

- [API Documentation](./story-17-api-documentation.md)
- [Usage Examples](./story-17-usage-examples.md)
- [Troubleshooting Guide](./story-17-troubleshooting.md)
- [Architecture Decision Record](../ADR/story-17-adr.md)