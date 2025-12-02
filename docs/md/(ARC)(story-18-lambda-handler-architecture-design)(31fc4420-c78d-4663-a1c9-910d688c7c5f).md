---
id: 31fc4420-c78d-4663-a1c9-910d688c7c5f
title: STORY-18 Lambda Handler Architecture Design
tags:
  - story-18
  - status/implemented
  - component/lambda
  - component/sns
  - component/adapter
category: ARC
created_at: '2025-12-02T08:41:52.348Z'
updated_at: '2025-12-02T08:41:52.348Z'
last_reviewed: '2025-12-02T08:41:52.348Z'
links: []
sources: []
abstract: >-
  Lambda handler architecture: SNS event processing, payload extraction, format
  adaptation, business logic reuse, subscription confirmation handling
---

**Component:** Lambda Handler for SNS Events  
**Story:** #18

**Contracts:**
- Lambda handler: `(event: SNSEvent, context: Context) → Promise<LambdaResponse>`
- Adapter: `extractCommercetoolsPayload(snsEvent: SNSEvent) → CommercetoolsPayload | null`
- Format converter: `convertSnsMessageToRequestBody(snsMessage: string) → unknown`
- Subscription handler: `handleSubscriptionConfirmation(snsEvent: SNSEvent) → boolean`

**Types:**
```typescript
interface SNSEvent {
  Records: ReadonlyArray<{
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
      MessageAttributes?: Record<string, unknown>;
    };
  }>;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

interface CommercetoolsPayload {
  notificationType: 'Message';
  type: string;
  resource: { typeId: string; id: string };
  projectKey: string;
  id: string;
  version: number;
  sequenceNumber: number;
  resourceVersion: number;
  createdAt: string;
  lastModifiedAt: string;
  customer?: unknown;
}
```

**Dependencies:**
- SNS Event → Lambda Handler → Adapter → Validator → Transformer → Integration Service → Segment
- Environment: `SEGMENT_WRITE_KEY` (required)
- AWS Lambda runtime: Node.js 24.3.0+

**Diagrams:**

```mermaid
sequenceDiagram
    participant SNS as SNS Topic
    participant Lambda as Lambda Handler
    participant Adapter as SNS Adapter
    participant Validator as Webhook Validator
    participant Transformer as Customer Transformer
    participant Integration as Integration Service
    participant Segment as Segment API

    SNS->>Lambda: SNSEvent (Records[])
    Lambda->>Lambda: Check SNS Type
    
    alt Type: SubscriptionConfirmation
        Lambda->>Lambda: Handle subscription confirmation
        Lambda-->>SNS: 200 OK
    else Type: Notification
        Lambda->>Adapter: Extract payload from Records[].Sns.Message
        Adapter->>Adapter: Parse JSON string
        Adapter-->>Lambda: CommercetoolsPayload
        
        Lambda->>Validator: validatePayload(payload)
        Validator-->>Lambda: ValidationResult
        
        alt Validation fails
            Lambda-->>SNS: 400 Bad Request
        else Validation succeeds
            Lambda->>Lambda: extractCustomerFromPayload(payload)
            Lambda->>Transformer: transformCustomerToSegment(customer)
            Transformer-->>Lambda: SegmentIdentifyPayload
            
            Lambda->>Integration: sendCustomerToSegment(payload)
            Integration->>Segment: POST /identify
            Segment-->>Integration: 200 OK
            Integration-->>Lambda: IntegrationResult
            
            alt Integration fails
                Lambda-->>SNS: 500 Internal Server Error
            else Integration succeeds
                Lambda-->>SNS: 200 OK
            end
        end
    end
```

```mermaid
classDiagram
    class LambdaHandler {
        +handler(event: SNSEvent, context: Context): Promise~LambdaResponse~
        -processSnsRecord(record: SNSRecord): Promise~LambdaResponse~
        -handleNotification(record: SNSRecord): Promise~LambdaResponse~
        -handleSubscriptionConfirmation(record: SNSRecord): Promise~LambdaResponse~
    }
    
    class SnsAdapter {
        +extractCommercetoolsPayload(snsEvent: SNSEvent): CommercetoolsPayload | null
        +parseSnsMessage(message: string): unknown
        +isSubscriptionConfirmation(record: SNSRecord): boolean
    }
    
    class WebhookValidator {
        +validatePayload(payload: unknown): WebhookValidationResult
        +parseJSON(body: unknown): ParseResult
        +identifyEventType(payload: CommercetoolsWebhookPayload): WebhookEventType
    }
    
    class CustomerTransformer {
        +transformCustomerToSegment(customer: CommercetoolsCustomer): SegmentIdentifyPayload
    }
    
    class IntegrationService {
        +sendCustomerToSegment(payload: SegmentIdentifyPayload): Promise~IntegrationResult~
    }
    
    LambdaHandler --> SnsAdapter: uses
    LambdaHandler --> WebhookValidator: uses
    LambdaHandler --> CustomerTransformer: uses
    LambdaHandler --> IntegrationService: uses
    SnsAdapter ..> WebhookValidator: converts to
```

```mermaid
flowchart TD
    Start([SNS Event Received]) --> CheckType{Check SNS Type}
    
    CheckType -->|SubscriptionConfirmation| HandleSub[Handle Subscription Confirmation]
    HandleSub --> ReturnSub[Return 200 OK]
    
    CheckType -->|Notification| ExtractPayload[Extract Commercetools Payload from Sns.Message]
    ExtractPayload --> ParseJSON[Parse JSON String]
    ParseJSON --> ValidatePayload[Validate Payload Structure]
    
    ValidatePayload -->|Invalid| Return400[Return 400 Bad Request]
    
    ValidatePayload -->|Valid| ExtractCustomer[Extract Customer Data]
    ExtractCustomer --> TransformCustomer[Transform to Segment Format]
    TransformCustomer --> SendToSegment[Send to Segment API]
    
    SendToSegment -->|Success| Return200[Return 200 OK]
    SendToSegment -->|Failure| Return500[Return 500 Internal Server Error]
    
    ReturnSub --> End([End])
    Return400 --> End
    Return200 --> End
    Return500 --> End
```

**Integration Points:**

**1. SNS Event → Lambda Handler**
- Trigger: SNS topic subscription (from STORY-17)
- Event structure: AWS SNS event format with Records array
- Message location: `Records[].Sns.Message` (JSON string)

**2. Lambda Handler → Business Logic**
- Adapter extracts Commercetools payload from SNS Message
- Converts SNS event format to request body format
- Reuses existing validator, transformer, integration service
- No changes to business logic modules

**3. Error Handling**
- Validation errors: 400 Bad Request
- Transformation errors: 400 Bad Request
- Integration errors: 500 Internal Server Error
- Subscription confirmation: 200 OK (always succeeds)

**4. Multiple Records Processing**
- Lambda processes each Record in SNSEvent.Records array
- Each record processed independently
- Aggregate results across all records
- Return success if all records succeed, failure if any fails