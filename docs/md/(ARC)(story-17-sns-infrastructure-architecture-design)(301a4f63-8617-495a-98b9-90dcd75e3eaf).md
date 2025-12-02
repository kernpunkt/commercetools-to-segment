---
id: 301a4f63-8617-495a-98b9-90dcd75e3eaf
title: STORY-17 SNS Infrastructure Architecture Design
tags:
  - story-17
  - status/implemented
  - component/infrastructure
  - component/sns
  - component/iam
  - component/cdk
category: ARC
created_at: '2025-12-02T08:06:49.272Z'
updated_at: '2025-12-02T08:32:43.062Z'
last_reviewed: '2025-12-02T08:06:49.272Z'
links: []
sources: []
abstract: >-
  SNS topic infrastructure design: topic creation, IAM resource policy,
  environment-aware naming, ARN export
---

**Component:** SNS Topic Infrastructure

**Interfaces:**

```typescript
// Stack Props Extension
interface SnsStackProps extends CdkStackProps {
  readonly environment: 'dev' | 'staging' | 'prod';
  readonly commercetoolsIamUserArn: string;
}

// SNS Topic Configuration
interface SnsTopicConfig {
  readonly topicName: string; // commercetools-webhook-{env}
  readonly displayName?: string;
  readonly fifo?: boolean; // false for standard topic
}
```

**Contracts:**

**SNS Topic:**
- **Name:** `commercetools-webhook-{env}` (env from props)
- **Type:** Standard topic (not FIFO)
- **ARN Format:** `arn:aws:sns:{region}:{account}:commercetools-webhook-{env}`

**IAM Resource Policy:**
- **Principal:** `arn:aws:iam::362576667341:user/subscriptions`
- **Action:** `sns:Publish`
- **Resource:** Topic ARN
- **Effect:** Allow

**Stack Output:**
- **Key:** `SnsTopicArn`
- **Value:** Topic ARN (string)
- **Export:** Named export for cross-stack reference

**Types:**

```typescript
// SNS Topic Construct
class SnsTopicConstruct extends Construct {
  readonly topic: sns.Topic;
  readonly topicArn: string;
  
  constructor(scope: Construct, id: string, props: SnsTopicConfig);
}

// IAM Policy Statement
interface CommercetoolsPublishPolicy {
  readonly principal: iam.ArnPrincipal;
  readonly actions: ['sns:Publish'];
  readonly resources: [string]; // Topic ARN
}
```

**Dependencies:**
- `aws-cdk-lib/aws-sns.Topic`
- `aws-cdk-lib/aws-iam.PolicyStatement`, `ArnPrincipal`
- `aws-cdk-lib.Stack`, `CfnOutput`
- `constructs.Construct`

**Integration Points:**

**CDK Stack Integration:**
- Add SNS topic to `CdkStack` constructor
- Read environment from stack props or context
- Create topic with environment-aware name
- Add IAM resource policy to topic
- Export topic ARN as stack output

**Commercetools Integration:**
- Topic ARN used in Commercetools subscription configuration
- Commercetools publishes webhook events to topic
- IAM user `arn:aws:iam::362576667341:user/subscriptions` authenticates

**Environment Configuration:**
- Environment name from stack props: `dev` | `staging` | `prod`
- Default: `dev` if not specified
- Topic name includes environment: `commercetools-webhook-{env}`

**Diagrams:**

```mermaid
graph TD
    A[CDK Stack] --> B[SNS Topic]
    B --> C[Topic Name: commercetools-webhook-env]
    B --> D[IAM Resource Policy]
    D --> E[Principal: Commercetools IAM User]
    D --> F[Action: sns:Publish]
    B --> G[Stack Output: Topic ARN]
    G --> H[Commercetools Subscription Config]
    
    I[Commercetools] --> J[Publish Event]
    J --> K[SNS Topic]
    K --> L[Future: Lambda Subscription]
    
    style B fill:#ff9900
    style D fill:#ff9900
    style K fill:#51cf66
    style L fill:#ffd43b
```

```mermaid
sequenceDiagram
    participant CDK as CDK Stack
    participant SNS as SNS Topic
    participant IAM as IAM Policy
    participant CT as Commercetools
    participant CF as CloudFormation
    
    CDK->>SNS: Create Topic(commercetools-webhook-env)
    SNS-->>CDK: Topic ARN
    CDK->>IAM: Add Resource Policy
    IAM->>SNS: Grant sns:Publish
    CDK->>CF: Deploy Stack
    CF->>SNS: Create Topic
    CF->>IAM: Apply Policy
    CF-->>CDK: Stack Output: Topic ARN
    CDK-->>CT: Topic ARN (manual config)
    CT->>SNS: Publish Event (authenticated)
    SNS-->>CT: Publish Success
```

```mermaid
classDiagram
    class CdkStack {
        +environment: string
        +commercetoolsIamUserArn: string
        +createSnsTopic(): void
        +addIamPolicy(): void
        +exportTopicArn(): void
    }
    
    class SnsTopic {
        +topicName: string
        +topicArn: string
        +addToResourcePolicy(): void
    }
    
    class TopicPolicy {
        +principal: ArnPrincipal
        +actions: string[]
        +resources: string[]
    }
    
    class ArnPrincipal {
        +arn: string
    }
    
    class CfnOutput {
        +key: string
        +value: string
        +exportName: string
    }
    
    CdkStack --> SnsTopic
    SnsTopic --> TopicPolicy
    TopicPolicy --> ArnPrincipal
    CdkStack --> CfnOutput
```

```mermaid
erDiagram
    CDK_STACK ||--|| SNS_TOPIC : creates
    SNS_TOPIC ||--|| IAM_POLICY : has
    IAM_POLICY }o--|| IAM_USER : grants
    SNS_TOPIC ||--|| STACK_OUTPUT : exports
    STACK_OUTPUT }o--o| COMMERCETOOLS : consumed_by
    
    CDK_STACK {
        string environment
        string stackName
    }
    
    SNS_TOPIC {
        string topicName
        string topicArn
        string region
        string account
    }
    
    IAM_POLICY {
        string principalArn
        string action
        string resourceArn
    }
    
    IAM_USER {
        string userArn
        string accountId
    }
    
    STACK_OUTPUT {
        string key
        string value
        string exportName
    }
```

**Data Flow:**

```mermaid
flowchart LR
    A[Environment Config] --> B[Stack Props]
    B --> C[Topic Name Generation]
    C --> D[SNS Topic Creation]
    D --> E[IAM Policy Creation]
    E --> F[Policy Attachment]
    F --> G[ARN Export]
    G --> H[Stack Output]
    
    I[Commercetools] --> J[Publish Request]
    J --> K[IAM Auth Check]
    K --> L[Policy Validation]
    L --> M[Publish to Topic]
    
    style D fill:#ff9900
    style E fill:#ff9900
    style M fill:#51cf66
```

**Environment Naming:**
- **dev:** `commercetools-webhook-dev`
- **staging:** `commercetools-webhook-staging`
- **prod:** `commercetools-webhook-prod`

**IAM User ARN:**
- **Fixed:** `arn:aws:iam::362576667341:user/subscriptions`
- **Account:** 362576667341 (Commercetools AWS account)
- **User:** subscriptions

**Stack Output Format:**
```json
{
  "SnsTopicArn": "arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev"
}
```