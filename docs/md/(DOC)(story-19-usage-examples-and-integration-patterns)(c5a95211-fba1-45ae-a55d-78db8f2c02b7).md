---
id: c5a95211-fba1-45ae-a55d-78db8f2c02b7
title: STORY-19 Usage Examples and Integration Patterns
tags:
  - story-19
  - status/implemented
  - topic/examples
  - component/infrastructure
  - component/lambda
  - component/sns
  - component/integration
category: DOC
created_at: '2025-12-02T13:07:28.673Z'
updated_at: '2025-12-02T13:18:55.018Z'
last_reviewed: '2025-12-02T13:07:28.673Z'
links: []
sources: []
abstract: >-
  Practical usage examples and integration patterns for Story-19: CDK stack
  usage, Lambda function implementation, SNS event processing, complete
  integration examples, and testing patterns.
---

# STORY-19 Usage Examples and Integration Patterns

## Overview

This document provides practical examples and integration patterns for using the Story-19 Lambda-SNS integration components.

## Table of Contents

1. [CDK Stack Usage](#cdk-stack-usage)
2. [Lambda Function Implementation](#lambda-function-implementation)
3. [SNS Event Processing](#sns-event-processing)
4. [Complete Integration Example](#complete-integration-example)
5. [Testing Patterns](#testing-patterns)

## CDK Stack Usage

### Basic Stack Creation

```typescript
import { App } from 'aws-cdk-lib';
import { CdkStack } from './infrastructure/lib/stack';

const app = new App();

const stack = new CdkStack(app, 'CommercetoolsStack', {
  env: {
    account: '123456789012',
    region: 'us-east-1',
  },
  environment: 'prod',
  description: 'Commercetools to Segment integration',
  tags: {
    Environment: 'production',
    Project: 'commercetools-to-segment',
  },
});

app.synth();
```

### Stack with Lambda Function

```typescript
import { App, Stack } from 'aws-cdk-lib';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { CdkStack } from './infrastructure/lib/stack';

const app = new App();

// Create Lambda function
const lambdaStack = new Stack(app, 'LambdaStack', {
  env: {
    account: '123456789012',
    region: 'us-east-1',
  },
});

const lambdaFunction = new Function(lambdaStack, 'CustomerProcessor', {
  runtime: Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: Code.fromAsset('dist/lambda'),
  environment: {
    SEGMENT_WRITE_KEY: process.env.SEGMENT_WRITE_KEY || '',
  },
});

// Create main stack with Lambda subscription
const mainStack = new CdkStack(app, 'CommercetoolsStack', {
  env: {
    account: '123456789012',
    region: 'us-east-1',
  },
  environment: 'prod',
  lambdaFunction, // Lambda subscription created automatically
  commercetoolsIamUserArn: 'arn:aws:iam::999999999999:user/commercetools',
});

app.synth();
```

### Stack Outputs Usage

```typescript
import { App } from 'aws-cdk-lib';
import { CdkStack } from './infrastructure/lib/stack';

const app = new App();

const stack = new CdkStack(app, 'CommercetoolsStack', {
  env: {
    account: '123456789012',
    region: 'us-east-1',
  },
  environment: 'prod',
  lambdaFunction: myLambdaFunction,
});

// Access stack outputs
const topicArn = stack.topicArn; // Direct property access
// Or from CloudFormation: stack.getOutput('SnsTopicArn')
// Or from CloudFormation: stack.getOutput('LambdaFunctionArn')

app.synth();
```

## Lambda Function Implementation

### Basic Lambda Handler

```typescript
import { SNSEvent, Context } from 'aws-lambda';
import { extractCustomerFromPayload } from './customer-extractor';
import { identifyCustomer } from './segment-client';

export async function handler(
  event: SNSEvent,
  context: Context
): Promise<void> {
  console.log('Received SNS event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      // Parse SNS message (JSON string)
      const snsMessage = JSON.parse(record.Sns.Message);
      console.log('Parsed SNS message:', snsMessage);

      // Extract customer data
      const customer = extractCustomerFromPayload(snsMessage);
      
      if (!customer) {
        console.warn('Failed to extract customer from payload');
        continue;
      }

      // Process customer
      await identifyCustomer(customer);
      console.log('Customer processed successfully:', customer.email);
    } catch (error) {
      console.error('Error processing SNS record:', error);
      // Consider implementing retry logic or dead-letter queue
      throw error;
    }
  }
}
```

### Lambda Handler with Error Handling

```typescript
import { SNSEvent, Context } from 'aws-lambda';
import { extractCustomerFromPayload } from './customer-extractor';
import { identifyCustomer } from './segment-client';

interface ProcessingResult {
  success: boolean;
  error?: string;
  customerEmail?: string;
}

export async function handler(
  event: SNSEvent,
  context: Context
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];

  for (const record of event.Records) {
    try {
      // Parse SNS message
      const snsMessage = JSON.parse(record.Sns.Message);
      
      // Extract customer
      const customer = extractCustomerFromPayload(snsMessage);
      
      if (!customer) {
        results.push({
          success: false,
          error: 'Failed to extract customer from payload',
        });
        continue;
      }

      // Validate required fields
      if (!customer.email) {
        results.push({
          success: false,
          error: 'Customer missing email',
          customerEmail: undefined,
        });
        continue;
      }

      // Process customer
      await identifyCustomer(customer);
      
      results.push({
        success: true,
        customerEmail: customer.email,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        success: false,
        error: errorMessage,
      });
    }
  }

  return results;
}
```

### Lambda Handler with Retry Logic

```typescript
import { SNSEvent, Context } from 'aws-lambda';
import { extractCustomerFromPayload } from './customer-extractor';
import { identifyCustomer } from './segment-client';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function processWithRetry(
  customer: ReturnType<typeof extractCustomerFromPayload>,
  retries = 0
): Promise<void> {
  try {
    if (!customer) {
      throw new Error('Customer is null');
    }
    await identifyCustomer(customer);
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.warn(`Retry ${retries + 1}/${MAX_RETRIES}:`, error);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return processWithRetry(customer, retries + 1);
    }
    throw error;
  }
}

export async function handler(
  event: SNSEvent,
  context: Context
): Promise<void> {
  for (const record of event.Records) {
    try {
      const snsMessage = JSON.parse(record.Sns.Message);
      const customer = extractCustomerFromPayload(snsMessage);
      await processWithRetry(customer);
    } catch (error) {
      console.error('Failed to process record after retries:', error);
      throw error;
    }
  }
}
```

## SNS Event Processing

### SNS Event Structure

```typescript
import { SNSEvent } from 'aws-lambda';

// SNS event structure
const event: SNSEvent = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:topic:subscription',
      Sns: {
        Type: 'Notification',
        MessageId: '12345678-1234-1234-1234-123456789012',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:commercetools-webhook-prod',
        Subject: 'CustomerCreated',
        Message: JSON.stringify({
          notificationType: 'Message',
          type: 'CustomerCreated',
          customer: {
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        }),
        Timestamp: '2024-01-01T00:00:00.000Z',
        SignatureVersion: '1',
        Signature: '...',
        SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/...',
        UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/...',
      },
    },
  ],
};
```

### Processing SNS Messages

```typescript
import { SNSEvent } from 'aws-lambda';
import { extractCustomerFromPayload } from './customer-extractor';

function processSnsEvent(event: SNSEvent): void {
  for (const record of event.Records) {
    // Validate event source
    if (record.EventSource !== 'aws:sns') {
      console.warn('Unexpected event source:', record.EventSource);
      continue;
    }

    // Parse message
    let message: unknown;
    try {
      message = JSON.parse(record.Sns.Message);
    } catch (error) {
      console.error('Failed to parse SNS message:', error);
      continue;
    }

    // Extract customer
    const customer = extractCustomerFromPayload(message);
    if (customer) {
      // Process customer
      processCustomer(customer);
    }
  }
}
```

## Complete Integration Example

### Full Stack Setup

```typescript
// infrastructure/bin/app.ts
import { App } from 'aws-cdk-lib';
import { Stack, Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { CdkStack } from '../lib/stack';

const app = new App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Create Lambda function
const lambdaStack = new Stack(app, 'LambdaStack', { env });
const lambdaFunction = new Function(lambdaStack, 'CustomerProcessor', {
  runtime: Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: Code.fromAsset('dist/lambda'),
  environment: {
    SEGMENT_WRITE_KEY: process.env.SEGMENT_WRITE_KEY || '',
    NODE_ENV: process.env.NODE_ENV || 'production',
  },
  timeout: 30, // 30 seconds
  memorySize: 256,
});

// Create main stack
const mainStack = new CdkStack(app, 'CommercetoolsStack', {
  env,
  environment: 'prod',
  lambdaFunction,
  commercetoolsIamUserArn: process.env.COMMERCETOOLS_IAM_USER_ARN,
  description: 'Commercetools to Segment integration via SNS and Lambda',
  tags: {
    Environment: 'production',
    Project: 'commercetools-to-segment',
    ManagedBy: 'CDK',
  },
});

app.synth();
```

### Complete Lambda Handler

```typescript
// src/lambda/handler.ts
import { SNSEvent, Context } from 'aws-lambda';
import { extractCustomerFromPayload } from './customer-extractor';
import { identifyCustomer } from '../segment/client';
import { logger } from '../logger';

export async function handler(
  event: SNSEvent,
  context: Context
): Promise<{ success: boolean; processed: number; failed: number }> {
  logger.info('Processing SNS event', {
    requestId: context.requestId,
    recordCount: event.Records.length,
  });

  let processed = 0;
  let failed = 0;

  for (const record of event.Records) {
    try {
      // Parse SNS message
      const snsMessage = JSON.parse(record.Sns.Message);
      logger.debug('Parsed SNS message', { messageId: record.Sns.MessageId });

      // Extract customer
      const customer = extractCustomerFromPayload(snsMessage);
      if (!customer) {
        logger.warn('Failed to extract customer', {
          messageId: record.Sns.MessageId,
        });
        failed++;
        continue;
      }

      // Validate required fields
      if (!customer.email) {
        logger.warn('Customer missing email', {
          messageId: record.Sns.MessageId,
        });
        failed++;
        continue;
      }

      // Process customer
      await identifyCustomer(customer);
      logger.info('Customer processed', {
        email: customer.email,
        messageId: record.Sns.MessageId,
      });
      processed++;
    } catch (error) {
      logger.error('Error processing record', {
        error: error instanceof Error ? error.message : String(error),
        messageId: record.Sns.MessageId,
      });
      failed++;
    }
  }

  return { success: true, processed, failed };
}
```

## Testing Patterns

### Unit Test: Customer Extraction

```typescript
import { describe, it, expect } from 'vitest';
import { extractCustomerFromPayload } from './customer-extractor';

describe('extractCustomerFromPayload', () => {
  it('should extract customer from valid payload', () => {
    const payload = {
      customer: {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    const customer = extractCustomerFromPayload(payload);
    expect(customer).toEqual({
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  it('should return null for invalid payload', () => {
    const payload = { invalid: 'structure' };
    const customer = extractCustomerFromPayload(payload);
    expect(customer).toBeNull();
  });
});
```

### Integration Test: CDK Stack

```typescript
import { describe, it, expect } from 'vitest';
import { App } from 'aws-cdk-lib';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { CdkStack } from '../infrastructure/lib/stack';

describe('CdkStack Integration', () => {
  it('should create stack with Lambda subscription', () => {
    const app = new App();
    const lambdaFunction = new Function(app, 'TestLambda', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromInline('exports.handler = async () => {};'),
    });

    const stack = new CdkStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      lambdaFunction,
    });

    const assembly = app.synth();
    const template = assembly.getStackByName('TestStack').template;

    // Verify subscription exists
    const subscription = Object.values(template.Resources).find(
      (r: any) => r.Type === 'AWS::SNS::Subscription'
    );
    expect(subscription).toBeDefined();
  });
});
```

## Best Practices

1. **Error Handling:** Always handle errors gracefully in Lambda handlers
2. **Logging:** Use structured logging for better observability
3. **Validation:** Validate customer data before processing
4. **Retry Logic:** Implement retry logic for transient failures
5. **Dead Letter Queue:** Consider using DLQ for failed messages
6. **Monitoring:** Set up CloudWatch alarms for Lambda errors
7. **Testing:** Write comprehensive unit and integration tests
8. **Type Safety:** Use TypeScript types for all data structures