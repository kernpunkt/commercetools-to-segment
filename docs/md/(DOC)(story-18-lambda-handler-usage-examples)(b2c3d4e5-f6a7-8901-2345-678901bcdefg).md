---
id: b2c3d4e5-f6a7-8901-2345-678901bcdefg
title: STORY-18 Lambda Handler Usage Examples
tags:
  - story-18
  - status/implemented
  - topic/examples
  - component/lambda
  - component/sns
category: DOC
created_at: '2025-12-02T10:00:00.000Z'
updated_at: '2025-12-02T10:00:00.000Z'
last_reviewed: '2025-12-02T10:00:00.000Z'
links: []
sources: []
abstract: >-
  Practical usage examples for Lambda handler: basic usage, SNS event processing,
  subscription confirmation, error handling, and testing patterns
---

# STORY-18 Lambda Handler Usage Examples

**Component:** AWS Lambda Handler for SNS Events  
**Story:** #18  
**Last Updated:** 2025-12-02

## Basic Usage

### Processing Customer Created Event

```typescript
import handler from './src/lambda/handler.js';
import type { SNSEvent } from './src/lambda/types.js';
import type { Context } from 'aws-lambda';

const event: SNSEvent = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:topic:sub-id',
      Sns: {
        Type: 'Notification',
        MessageId: 'msg-123',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev',
        Message: JSON.stringify({
          notificationType: 'Message',
          type: 'CustomerCreated',
          resource: {
            typeId: 'customer',
            id: 'customer-123',
          },
          projectKey: 'my-project',
          id: 'notification-456',
          version: 1,
          sequenceNumber: 1,
          resourceVersion: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          lastModifiedAt: '2024-01-01T00:00:00.000Z',
          customer: {
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            addresses: [
              {
                streetName: 'Main St',
                streetNumber: '123',
                city: 'New York',
                postalCode: '10001',
                country: 'US',
              },
            ],
          },
        }),
        Timestamp: '2024-01-01T00:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'signature-value',
        SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
        UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
      },
    },
  ],
};

const context: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'commercetools-webhook-handler',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:handler',
  memoryLimitInMB: '256',
  awsRequestId: 'request-id-123',
  logGroupName: '/aws/lambda/handler',
  logStreamName: '2024/01/01/[$LATEST]stream',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
} as Context;

const response = await handler(event, context);
// { statusCode: 200, body: '{"success":true,"processed":1}' }
```

### Processing Customer Updated Event

```typescript
import handler from './src/lambda/handler.js';
import type { SNSEvent } from './src/lambda/types.js';
import type { Context } from 'aws-lambda';

const event: SNSEvent = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:topic:sub-id',
      Sns: {
        Type: 'Notification',
        MessageId: 'msg-456',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev',
        Message: JSON.stringify({
          notificationType: 'Message',
          type: 'CustomerUpdated',
          resource: {
            typeId: 'customer',
            id: 'customer-123',
          },
          projectKey: 'my-project',
          id: 'notification-789',
          version: 2,
          sequenceNumber: 2,
          resourceVersion: 2,
          createdAt: '2024-01-01T00:00:00.000Z',
          lastModifiedAt: '2024-01-02T00:00:00.000Z',
          customer: {
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Smith', // Updated last name
          },
        }),
        Timestamp: '2024-01-02T00:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'signature-value',
        SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
        UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
      },
    },
  ],
};

const context: Context = {
  // ... context
} as Context;

const response = await handler(event, context);
// { statusCode: 200, body: '{"success":true,"processed":1}' }
```

## Subscription Confirmation

### Handling SNS Subscription Confirmation

```typescript
import handler from './src/lambda/handler.js';
import type { SNSEvent } from './src/lambda/types.js';
import type { Context } from 'aws-lambda';

const event: SNSEvent = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:topic:sub-id',
      Sns: {
        Type: 'SubscriptionConfirmation',
        MessageId: 'sub-msg-123',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev',
        Message: JSON.stringify({
          Type: 'SubscriptionConfirmation',
          MessageId: 'sub-msg-123',
          Token: 'subscription-token',
          TopicArn: 'arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev',
          Message: 'You have chosen to subscribe to the topic',
          SubscribeURL: 'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=...',
          Timestamp: '2024-01-01T00:00:00.000Z',
        }),
        Timestamp: '2024-01-01T00:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'signature-value',
        SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
        UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
      },
    },
  ],
};

const context: Context = {
  // ... context
} as Context;

const response = await handler(event, context);
// { statusCode: 200, body: '{"success":true,"processed":1}' }
// Note: Subscription confirmation is handled automatically, no business logic executed
```

## Multiple Records Processing

### Processing Multiple SNS Records

```typescript
import handler from './src/lambda/handler.js';
import type { SNSEvent } from './src/lambda/types.js';
import type { Context } from 'aws-lambda';

const event: SNSEvent = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:topic:sub-id',
      Sns: {
        Type: 'Notification',
        MessageId: 'msg-1',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev',
        Message: JSON.stringify({
          notificationType: 'Message',
          type: 'CustomerCreated',
          resource: { typeId: 'customer', id: 'customer-1' },
          projectKey: 'my-project',
          id: 'notification-1',
          version: 1,
          sequenceNumber: 1,
          resourceVersion: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          lastModifiedAt: '2024-01-01T00:00:00.000Z',
          customer: { email: 'customer1@example.com' },
        }),
        Timestamp: '2024-01-01T00:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'sig-1',
        SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
        UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
      },
    },
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:topic:sub-id',
      Sns: {
        Type: 'Notification',
        MessageId: 'msg-2',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev',
        Message: JSON.stringify({
          notificationType: 'Message',
          type: 'CustomerUpdated',
          resource: { typeId: 'customer', id: 'customer-2' },
          projectKey: 'my-project',
          id: 'notification-2',
          version: 2,
          sequenceNumber: 2,
          resourceVersion: 2,
          createdAt: '2024-01-01T00:00:00.000Z',
          lastModifiedAt: '2024-01-02T00:00:00.000Z',
          customer: { email: 'customer2@example.com' },
        }),
        Timestamp: '2024-01-02T00:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'sig-2',
        SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
        UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
      },
    },
  ],
};

const context: Context = {
  // ... context
} as Context;

const response = await handler(event, context);
// { statusCode: 200, body: '{"success":true,"processed":2}' }
// Both records processed successfully
```

## Using Adapter Functions

### Extracting Commercetools Payload

```typescript
import { extractCommercetoolsPayload } from './src/lambda/adapter.js';
import type { SNSEvent } from './src/lambda/types.js';

const snsEvent: SNSEvent = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:topic:sub-id',
      Sns: {
        Type: 'Notification',
        MessageId: 'msg-123',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev',
        Message: JSON.stringify({
          notificationType: 'Message',
          type: 'CustomerCreated',
          resource: { typeId: 'customer', id: 'customer-123' },
          customer: { email: 'test@example.com' },
        }),
        Timestamp: '2024-01-01T00:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'sig',
        SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
        UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
      },
    },
  ],
};

const payload = extractCommercetoolsPayload(snsEvent);
if (payload) {
  console.log('Extracted payload:', payload);
  // { notificationType: 'Message', type: 'CustomerCreated', ... }
} else {
  console.error('Failed to extract payload');
}
```

### Converting to Request Body Format

```typescript
import { convertToRequestBody } from './src/lambda/adapter.js';
import type { CommercetoolsWebhookPayload } from './src/webhook/types.js';

const payload: CommercetoolsWebhookPayload = {
  notificationType: 'Message',
  type: 'CustomerCreated',
  resource: { typeId: 'customer', id: 'customer-123' },
  projectKey: 'my-project',
  id: 'notification-456',
  version: 1,
  sequenceNumber: 1,
  resourceVersion: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastModifiedAt: '2024-01-01T00:00:00.000Z',
  customer: { email: 'test@example.com' },
};

const requestBody = convertToRequestBody(payload);
// Now compatible with existing validatePayload() function
```

### Checking Subscription Confirmation

```typescript
import { isSubscriptionConfirmation } from './src/lambda/adapter.js';
import type { SNSRecord } from './src/lambda/types.js';

const record: SNSRecord = {
  EventSource: 'aws:sns',
  EventVersion: '1.0',
  EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:topic:sub-id',
  Sns: {
    Type: 'SubscriptionConfirmation',
    MessageId: 'msg-id',
    TopicArn: 'arn:aws:sns:us-east-1:123456789012:topic',
    Message: '...',
    Timestamp: '2024-01-01T00:00:00.000Z',
    SignatureVersion: '1',
    Signature: 'sig',
    SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
    UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
  },
};

if (isSubscriptionConfirmation(record)) {
  console.log('This is a subscription confirmation');
  // Handle subscription confirmation
} else {
  console.log('This is a notification');
  // Process Commercetools payload
}
```

## Using Customer Extractor

### Extracting Customer Data

```typescript
import { extractCustomerFromPayload } from './src/lambda/customer-extractor.js';

const payload = {
  notificationType: 'Message',
  type: 'CustomerCreated',
  customer: {
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    addresses: [
      {
        streetName: 'Main St',
        streetNumber: '123',
        city: 'New York',
        postalCode: '10001',
        country: 'US',
      },
    ],
  },
};

const customer = extractCustomerFromPayload(payload);
if (customer) {
  console.log('Customer email:', customer.email);
  console.log('Customer name:', customer.firstName, customer.lastName);
  console.log('Addresses:', customer.addresses);
} else {
  console.error('Failed to extract customer data');
}
```

## Error Handling Examples

### Handling Invalid JSON

```typescript
import handler from './src/lambda/handler.js';
import type { SNSEvent } from './src/lambda/types.js';
import type { Context } from 'aws-lambda';

const event: SNSEvent = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:topic:sub-id',
      Sns: {
        Type: 'Notification',
        MessageId: 'msg-123',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev',
        Message: 'invalid json {', // Invalid JSON
        Timestamp: '2024-01-01T00:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'sig',
        SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
        UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
      },
    },
  ],
};

const context: Context = {
  // ... context
} as Context;

const response = await handler(event, context);
// { statusCode: 400, body: '{"success":false,"error":"Failed to parse SNS Message as Commercetools payload"}' }
```

### Handling Missing Customer Data

```typescript
import handler from './src/lambda/handler.js';
import type { SNSEvent } from './src/lambda/types.js';
import type { Context } from 'aws-lambda';

const event: SNSEvent = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:topic:sub-id',
      Sns: {
        Type: 'Notification',
        MessageId: 'msg-123',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev',
        Message: JSON.stringify({
          notificationType: 'Message',
          type: 'CustomerCreated',
          resource: { typeId: 'customer', id: 'customer-123' },
          // customer field missing
        }),
        Timestamp: '2024-01-01T00:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'sig',
        SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
        UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
      },
    },
  ],
};

const context: Context = {
  // ... context
} as Context;

const response = await handler(event, context);
// { statusCode: 400, body: '{"success":false,"error":"Invalid payload or customer data not found"}' }
```

## Testing Patterns

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import handler from '../../src/lambda/handler.js';
import type { SNSEvent } from '../../src/lambda/types.js';
import type { Context } from 'aws-lambda';
import { createSnsEventWithCustomerCreated } from '../utils/sns-event-builder.js';
import { createCustomerCreatedPayload } from '../utils/webhook-payload-builder.js';

// Mock dependencies
vi.mock('../../src/webhook/validator.js');
vi.mock('../../src/transformation/transformer.js');
vi.mock('../../src/integration/service.js');
vi.mock('../../src/logger.js');

describe('Lambda Handler', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = {
      // ... mock context
    } as Context;
  });

  it('should process customer.created event successfully', async () => {
    const payload = createCustomerCreatedPayload();
    const snsEvent = createSnsEventWithCustomerCreated(payload);

    // Setup mocks
    const { validatePayload } = await import('../../src/webhook/validator.js');
    const { transformCustomerToSegment } = await import('../../src/transformation/transformer.js');
    const { sendCustomerToSegment } = await import('../../src/integration/service.js');

    vi.mocked(validatePayload).mockReturnValue({
      isValid: true,
      eventType: 'customer.created',
    });
    vi.mocked(transformCustomerToSegment).mockReturnValue({
      userId: 'test@example.com',
      traits: { email: 'test@example.com' },
    });
    vi.mocked(sendCustomerToSegment).mockResolvedValue({ success: true });

    const response = await handler(snsEvent as SNSEvent, mockContext);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      success: true,
      processed: 1,
    });
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { extractCommercetoolsPayload } from '../../src/lambda/adapter.js';
import { convertToRequestBody } from '../../src/lambda/adapter.js';
import { extractCustomerFromPayload } from '../../src/lambda/customer-extractor.js';
import { validatePayload } from '../../src/webhook/validator.js';
import { transformCustomerToSegment } from '../../src/transformation/transformer.js';
import { createSnsEventWithCustomerCreated } from '../utils/sns-event-builder.js';
import { createCustomerCreatedPayload } from '../utils/webhook-payload-builder.js';
import type { SNSEvent } from '../../src/lambda/types.js';

describe('Lambda Handler Integration', () => {
  it('should process complete flow from SNS event to Segment payload', async () => {
    const payload = createCustomerCreatedPayload();
    const snsEvent = createSnsEventWithCustomerCreated(payload);

    // Step 1: Extract Commercetools payload
    const commercetoolsPayload = extractCommercetoolsPayload(snsEvent as SNSEvent);
    expect(commercetoolsPayload).not.toBeNull();

    if (!commercetoolsPayload) {
      throw new Error('Failed to extract payload');
    }

    // Step 2: Convert to request body format
    const requestBody = convertToRequestBody(commercetoolsPayload);
    expect(requestBody.notificationType).toBe('Message');
    expect(requestBody.type).toBe('CustomerCreated');

    // Step 3: Validate payload
    const validationResult = validatePayload(requestBody);
    expect(validationResult.isValid).toBe(true);

    // Step 4: Extract customer data
    const customer = extractCustomerFromPayload(requestBody);
    expect(customer).not.toBeNull();

    if (!customer) {
      throw new Error('Failed to extract customer');
    }

    // Step 5: Transform to Segment format
    const segmentPayload = transformCustomerToSegment(customer);
    expect(segmentPayload.userId).toBeDefined();
    expect(segmentPayload.traits).toBeDefined();
  });
});
```

## AWS Lambda Deployment

### Lambda Function Configuration

```typescript
// infrastructure/lib/stack.ts
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SnsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // SNS Topic
    const topic = new Topic(this, 'CommercetoolsWebhookTopic', {
      topicName: 'commercetools-webhook-dev',
    });

    // Lambda Function
    const handler = new Function(this, 'WebhookHandler', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler.handler',
      code: Code.fromAsset('dist'),
      environment: {
        SEGMENT_WRITE_KEY: process.env.SEGMENT_WRITE_KEY || '',
      },
      timeout: Duration.seconds(30),
      memorySize: 256,
    });

    // Subscribe Lambda to SNS Topic
    handler.addEventSource(
      new SnsEventSource(topic)
    );
  }
}
```

## Common Use Cases

### 1. Processing Single Customer Event

```typescript
// Lambda receives SNS event with single customer.created payload
// Handler processes it and sends to Segment
const response = await handler(snsEvent, context);
// Returns 200 if successful
```

### 2. Processing Batch of Events

```typescript
// Lambda receives SNS event with multiple records
// Handler processes each record in parallel
// Returns success only if all records succeed
const response = await handler(multiRecordEvent, context);
// Returns 200 if all succeed, 400/500 if any fail
```

### 3. Handling Subscription Confirmation

```typescript
// Lambda receives subscription confirmation during SNS topic setup
// Handler acknowledges confirmation without processing business logic
const response = await handler(subscriptionEvent, context);
// Always returns 200
```

## Environment Configuration

### Setting Environment Variables

```bash
# .env file
SEGMENT_WRITE_KEY=your-segment-write-key-here
```

```typescript
// Lambda function environment
const handler = new Function(this, 'Handler', {
  environment: {
    SEGMENT_WRITE_KEY: process.env.SEGMENT_WRITE_KEY || '',
  },
});
```

## Related Documentation

- [STORY-18 API Documentation](./story-18-lambda-handler-api-documentation.md)
- [STORY-18 Architecture Design](../ARC/story-18-lambda-handler-architecture-design.md)
- [STORY-18 Troubleshooting Guide](./story-18-lambda-handler-troubleshooting-guide.md)

