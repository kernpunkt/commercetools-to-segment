---
id: 45e1a7f9-c25d-46f9-8e7c-636157d9449f
title: STORY-19 Lambda-SNS Integration Architecture Design
tags:
  - story-19
  - status/implemented
  - component/infrastructure
  - component/sns
  - component/lambda
  - component/iam
  - component/integration
category: ARC
created_at: '2025-12-02T10:52:49.752Z'
updated_at: '2025-12-02T13:18:47.396Z'
last_reviewed: '2025-12-02T10:52:49.752Z'
links: []
sources: []
abstract: >-
  Lambda-SNS integration: subscription config, IAM permissions, event flow,
  Mermaid diagrams
---

**Component:** Lambda-SNS Subscription Integration

**Interfaces:**

```typescript
// Stack Extension (assumes Lambda exists from story-18)
interface LambdaSnsStackProps extends CdkStackProps {
  readonly lambdaFunction: lambda.Function; // From story-18
}

// Subscription Configuration
interface LambdaSubscriptionConfig {
  readonly topic: sns.Topic; // From story-17
  readonly lambdaFunction: lambda.Function; // From story-18
  readonly deadLetterQueue?: sqs.Queue; // Optional, deferred
}
```

**Contracts:**

**SNS-Lambda Subscription:**
- **Method:** `topic.addSubscription(new LambdaSubscription(lambdaFunction))`
- **Type:** `aws-cdk-lib/aws-sns-subscriptions.LambdaSubscription`
- **Protocol:** Lambda (direct invocation)
- **Event Format:** SNS event with `Records[].Sns.Message` containing Commercetools payload

**IAM Permissions (Auto-managed by CDK):**
- **SNS → Lambda:** `lambda:InvokeFunction` on Lambda ARN (granted to SNS service principal)
- **Lambda → SNS:** `sns:Subscribe` (if needed, auto-granted by CDK)

**Event Flow:**
1. Commercetools publishes → SNS topic
2. SNS invokes → Lambda function (direct, no HTTP)
3. Lambda processes → SNS event format
4. Lambda extracts → Commercetools payload from `Sns.Message`
5. Lambda processes → Existing business logic (validator → transformer → integration)

**Types:**

```typescript
// SNS Event Structure (Lambda receives)
interface SnsEvent {
  Records: Array<{
    EventSource: 'aws:sns';
    EventVersion: string;
    EventSubscriptionArn: string;
    Sns: {
      Type: 'Notification' | 'SubscriptionConfirmation';
      MessageId: string;
      TopicArn: string;
      Subject?: string;
      Message: string; // JSON string containing Commercetools payload
      Timestamp: string;
      SignatureVersion: string;
      Signature: string;
      SigningCertUrl: string;
      UnsubscribeUrl: string;
    };
  }>;
}

// Lambda Subscription Construct
class LambdaSubscription extends SubscriptionBase {
  constructor(
    lambdaFunction: lambda.IFunction,
    props?: LambdaSubscriptionProps
  );
}
```

**Dependencies:**
- `aws-cdk-lib/aws-sns-subscriptions.LambdaSubscription`
- `aws-cdk-lib/aws-lambda.Function` (from story-18)
- `aws-cdk-lib/aws-sns.Topic` (from story-17)
- `aws-cdk-lib/aws-iam` (auto-managed permissions)

**Integration Points:**

**CDK Stack Integration:**
```typescript
// In CdkStack constructor
this.snsTopic.addSubscription(
  new subscriptions.LambdaSubscription(this.lambdaFunction)
);
```

**Event Processing Flow:**
```
Commercetools Webhook
  │
  ├─► SNS Topic (story-17)
  │   │
  │   └─► Lambda Subscription (story-19)
  │       │
  │       └─► Lambda Function (story-18)
  │           │
  │           ├─► Extract SNS Message
  │           ├─► Parse Commercetools Payload
  │           ├─► Validate (existing validator)
  │           ├─► Transform (existing transformer)
  │           └─► Integrate (existing Segment service)
```

**Mermaid Diagrams:**

**Sequence Diagram - Event Flow:**
```mermaid
sequenceDiagram
    participant CT as Commercetools
    participant SNS as SNS Topic
    participant Lambda as Lambda Function
    participant Segment as Segment API

    CT->>SNS: Publish webhook event
    SNS->>Lambda: Invoke (SNS event)
    Lambda->>Lambda: Extract payload from Sns.Message
    Lambda->>Lambda: Validate payload
    Lambda->>Lambda: Transform customer data
    Lambda->>Segment: Send to Segment
    Segment-->>Lambda: Response
    Lambda-->>SNS: Success
```

**Component Diagram:**
```mermaid
graph TB
    subgraph "CDK Stack"
        Topic[SNS Topic<br/>story-17]
        Lambda[Lambda Function<br/>story-18]
        Sub[Lambda Subscription<br/>story-19]
    end
    
    subgraph "AWS Resources"
        SNSResource[(SNS Topic)]
        LambdaResource[(Lambda Function)]
        IAMPolicy[IAM Permissions<br/>Auto-managed]
    end
    
    subgraph "External"
        CT[Commercetools]
        Segment[Segment API]
    end
    
    Topic --> Sub
    Lambda --> Sub
    Sub --> SNSResource
    Sub --> LambdaResource
    Sub --> IAMPolicy
    
    CT -->|Publish| SNSResource
    SNSResource -->|Invoke| LambdaResource
    LambdaResource -->|API Call| Segment
```

**Class Diagram:**
```mermaid
classDiagram
    class CdkStack {
        +snsTopic: Topic
        +lambdaFunction: Function
        +addLambdaSubscription(): void
    }
    
    class Topic {
        +topicArn: string
        +addSubscription(subscription): void
    }
    
    class LambdaSubscription {
        +lambdaFunction: IFunction
        +constructor(function, props?)
    }
    
    class Function {
        +functionArn: string
        +functionName: string
    }
    
    CdkStack --> Topic: uses
    CdkStack --> Function: uses
    Topic --> LambdaSubscription: subscribes
    LambdaSubscription --> Function: invokes
```

**Data Flow Diagram:**
```mermaid
flowchart LR
    A[Commercetools<br/>Webhook] -->|JSON Payload| B[SNS Topic]
    B -->|SNS Event| C[Lambda Function]
    C -->|Extract| D[Commercetools<br/>Payload]
    D -->|Validate| E[Validator]
    E -->|Transform| F[Transformer]
    F -->|Integrate| G[Segment API]
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#ffe1f5
    style G fill:#e1ffe1
```

**IAM Permissions Flow:**
```mermaid
sequenceDiagram
    participant CDK as CDK Stack
    participant SNS as SNS Service
    participant Lambda as Lambda Function
    participant IAM as IAM

    CDK->>IAM: Grant lambda:InvokeFunction
    IAM->>SNS: Allow SNS to invoke Lambda
    CDK->>IAM: Grant sns:Subscribe (if needed)
    IAM->>Lambda: Allow Lambda to subscribe
    Note over SNS,Lambda: Permissions auto-managed by CDK
```