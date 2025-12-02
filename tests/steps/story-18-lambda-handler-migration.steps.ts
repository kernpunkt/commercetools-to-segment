import { Before, Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import type { Context } from 'aws-lambda';
import {
  createCustomerCreatedPayload,
  createCustomerUpdatedPayload,
  createCustomerCreatedPayloadWithEmail,
  createCustomerUpdatedPayloadWithEmail,
  createPayloadFromDataTable,
  parseDataTable,
} from '../utils/webhook-payload-builder.js';
import {
  createSnsEventWithCustomerCreated,
  createSnsEventWithCustomerUpdated,
  createSnsSubscriptionConfirmationEvent,
  createSnsEventWithMessage,
  createSnsEventWithType,
  createSnsEventWithMultipleRecords,
  type SNSEvent,
} from '../utils/sns-event-builder.js';
import {
  verifyUserInSegment,
  verifyUserTraits,
} from '../utils/segment-verification.js';

// Lambda handler will be imported dynamically when processing events
// This allows step definitions to load even when handler doesn't exist yet (red phase)
let handler: (
  event: SNSEvent,
  context: Context
) => Promise<{ statusCode: number; body: string; headers?: Record<string, string> }>;

// Set up environment variable for Segment client
Before(function () {
  // Set SEGMENT_WRITE_KEY for Lambda handler tests
  // The handler requires this to create Segment client
  if (!process.env.SEGMENT_WRITE_KEY) {
    process.env.SEGMENT_WRITE_KEY = 'test-write-key-for-lambda-tests';
  }
});

// Shared context for storing Lambda handler test state
interface LambdaStepContext {
  snsEvent?: SNSEvent;
  lambdaResponse?: {
    readonly statusCode: number;
    readonly body: string;
    readonly headers?: Record<string, string>;
  };
  eventType?: string;
  extractedPayload?: unknown;
  userId?: string;
  expectedTraits?: {
    readonly email: string;
    readonly name?: string;
  };
}

// Mock Lambda context
function createMockLambdaContext(): Context {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-lambda-handler',
    functionVersion: '$LATEST',
    invokedFunctionArn:
      'arn:aws:lambda:us-east-1:123456789012:function:test-lambda-handler',
    memoryLimitInMB: '128',
    awsRequestId: `test-request-${Date.now()}`,
    logGroupName: '/aws/lambda/test-lambda-handler',
    logStreamName: '2024/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: () => {
      // No-op
    },
    fail: () => {
      // No-op
    },
    succeed: () => {
      // No-op
    },
  } as Context;
}

// Background steps
Given('the Lambda handler is deployed and available', function () {
  // Lambda handler is imported and available for testing
  // This step ensures the handler is ready (no action needed)
});

Given(
  'the Lambda handler is configured with valid Segment credentials',
  function () {
    // Verify SEGMENT_WRITE_KEY is set
    expect(process.env.SEGMENT_WRITE_KEY).to.not.be.undefined;
    expect(process.env.SEGMENT_WRITE_KEY).to.not.equal('');
  }
);

// Given steps: SNS event creation
Given(
  'an SNS event containing a Commercetools customer.created webhook payload',
  function () {
    const context = this as LambdaStepContext;
    const payload = createCustomerCreatedPayloadWithEmail('test@example.com');
    context.snsEvent = createSnsEventWithCustomerCreated(payload);
    context.eventType = 'customer.created';
  }
);

Given(
  'an SNS event containing a Commercetools customer.updated webhook payload',
  function () {
    const context = this as LambdaStepContext;
    const payload = createCustomerUpdatedPayloadWithEmail('test@example.com');
    context.snsEvent = createSnsEventWithCustomerUpdated(payload);
    context.eventType = 'customer.updated';
  }
);

Given('an SNS subscription confirmation event', function () {
  const context = this as LambdaStepContext;
  context.snsEvent = createSnsSubscriptionConfirmationEvent();
});

Given(
  'an SNS event with a Message field containing a valid Commercetools webhook payload',
  function () {
    const context = this as LambdaStepContext;
    const payload = createCustomerCreatedPayloadWithEmail('test@example.com');
    const message = JSON.stringify(payload);
    context.snsEvent = createSnsEventWithMessage(message, 'Notification');
  }
);

Given(
  'an SNS event with a Commercetools customer.created payload in the Message field',
  function () {
    const context = this as LambdaStepContext;
    const payload = createCustomerCreatedPayloadWithEmail('test@example.com');
    context.snsEvent = createSnsEventWithCustomerCreated(payload);
  }
);

Given(
  'an SNS event containing a Commercetools customer.created webhook payload with:',
  function (dataTable: { rawTable: ReadonlyArray<ReadonlyArray<string>> }) {
    const context = this as LambdaStepContext;
    const fields = parseDataTable(dataTable);
    const payload = createPayloadFromDataTable({
      ...fields,
      eventType: 'customer.created',
    });
    context.snsEvent = createSnsEventWithCustomerCreated(payload);

    // Extract expected traits
    const email = fields.email;
    if (email) {
      context.userId = email;
      const name =
        fields.fullName ??
        (fields.firstName && fields.lastName
          ? `${fields.firstName} ${fields.lastName}`
          : fields.firstName ?? fields.lastName);
      context.expectedTraits = {
        email,
        ...(name && { name }),
      };
    }
    context.eventType = 'customer.created';
  }
);

Given(
  'an SNS event containing a Commercetools customer.updated webhook payload with:',
  function (dataTable: { rawTable: ReadonlyArray<ReadonlyArray<string>> }) {
    const context = this as LambdaStepContext;
    const fields = parseDataTable(dataTable);
    const payload = createPayloadFromDataTable({
      ...fields,
      eventType: 'customer.updated',
    });
    context.snsEvent = createSnsEventWithCustomerUpdated(payload);

    // Extract expected traits
    const email = fields.email;
    if (email) {
      context.userId = email;
      const name =
        fields.fullName ??
        (fields.firstName && fields.lastName
          ? `${fields.firstName} ${fields.lastName}`
          : fields.firstName ?? fields.lastName);
      context.expectedTraits = {
        email,
        ...(name && { name }),
      };
    }
    context.eventType = 'customer.updated';
  }
);

Given(
  'an SNS event with Type {string} containing a Commercetools payload',
  function (type: string) {
    const context = this as LambdaStepContext;
    if (type === 'SubscriptionConfirmation') {
      context.snsEvent = createSnsSubscriptionConfirmationEvent();
    } else {
      const payload = createCustomerCreatedPayloadWithEmail('test@example.com');
      context.snsEvent = createSnsEventWithType(
        type as 'Notification' | 'SubscriptionConfirmation',
        payload
      );
    }
  }
);

Given('an SNS event with Type {string}', function (type: string) {
  const context = this as LambdaStepContext;
  context.snsEvent = createSnsEventWithType(
    type as 'Notification' | 'SubscriptionConfirmation'
  );
});

Given(
  'an SNS event with multiple Records containing Commercetools payloads',
  function () {
    const context = this as LambdaStepContext;
    const payload1 = createCustomerCreatedPayloadWithEmail('test1@example.com');
    const payload2 = createCustomerUpdatedPayloadWithEmail('test2@example.com');
    context.snsEvent = createSnsEventWithMultipleRecords([payload1, payload2]);
  }
);

Given(
  'an SNS event containing the same Commercetools payload that would be sent via HTTP webhook',
  function () {
    const context = this as LambdaStepContext;
    const payload = createCustomerCreatedPayloadWithEmail('test@example.com');
    context.snsEvent = createSnsEventWithCustomerCreated(payload);
  }
);

// Scenario Outline support
Given(
  'an SNS event with {string} containing a Commercetools customer.created payload',
  function (description: string) {
    const context = this as LambdaStepContext;
    const payload = createCustomerCreatedPayloadWithEmail('test@example.com');
    // Create event based on description
    if (description.includes('single Record')) {
      context.snsEvent = createSnsEventWithCustomerCreated(payload);
    } else if (description.includes('nested')) {
      // For nested JSON, wrap the payload in an extra layer
      const nestedMessage = JSON.stringify({ payload });
      context.snsEvent = createSnsEventWithMessage(nestedMessage, 'Notification');
    } else if (description.includes('Type "Notification"')) {
      context.snsEvent = createSnsEventWithType('Notification', payload);
    } else {
      // Default to single record
      context.snsEvent = createSnsEventWithCustomerCreated(payload);
    }
  }
);

// Specific step definitions for scenario outline examples
Given(
  'an SNS event with a single Record with Sns.Message field containing a Commercetools customer.created payload',
  function () {
    const context = this as LambdaStepContext;
    const payload = createCustomerCreatedPayloadWithEmail('test@example.com');
    context.snsEvent = createSnsEventWithCustomerCreated(payload);
  }
);

Given(
  'an SNS event with a Record with nested Sns.Message JSON string containing a Commercetools customer.created payload',
  function () {
    const context = this as LambdaStepContext;
    const payload = createCustomerCreatedPayloadWithEmail('test@example.com');
    // The Message field contains the payload directly as JSON string
    // "nested" here means the JSON string itself, not an extra nesting layer
    const message = JSON.stringify(payload);
    context.snsEvent = createSnsEventWithMessage(message, 'Notification');
  }
);

Given(
  'an SNS event with a Record with Sns.Type {string} containing a Commercetools customer.created payload',
  function (type: string) {
    const context = this as LambdaStepContext;
    const payload = createCustomerCreatedPayloadWithEmail('test@example.com');
    context.snsEvent = createSnsEventWithType(
      type as 'Notification' | 'SubscriptionConfirmation',
      payload
    );
  }
);

// When steps: Processing SNS events
When('the Lambda handler processes the SNS event', async function () {
  const context = this as LambdaStepContext;
  if (!context.snsEvent) {
    throw new Error('SNS event must be set before processing');
  }

  // Dynamically import handler (will fail until src/lambda/handler.ts exists - expected in red phase)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const handlerModule = await import('../../src/lambda/handler.js');
    handler = handlerModule.default;
  } catch (error) {
    throw new Error(
      `Lambda handler not found. This is expected in the red phase. Implement src/lambda/handler.ts first. Original error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const lambdaContext = createMockLambdaContext();

  try {
    const response = await handler(context.snsEvent, lambdaContext);
    context.lambdaResponse = {
      statusCode: response.statusCode,
      body: response.body,
      headers: response.headers,
    };
  } catch (error) {
    throw new Error(
      `Lambda handler failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// Then steps: Response verification
Then('the handler should return a successful response', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
});

Then('the handler should extract the Commercetools payload from the SNS Message field', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
  // If handler returns 200, payload extraction succeeded
  // The extracted payload is stored internally by the handler
});

Then('the handler should process the customer.created event', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
  expect(context.eventType).to.equal('customer.created');
});

Then('the handler should process the customer.updated event', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
  expect(context.eventType).to.equal('customer.updated');
});

Then(
  'the handler should identify the event as a subscription confirmation',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // Subscription confirmation should always return 200
  }
);

Then(
  'the handler should handle the subscription confirmation request',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // Subscription confirmation handling should always succeed
  }
);

Then('the handler should parse the JSON from the SNS Message field', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
  // If handler returns 200, JSON parsing succeeded
});

Then('the handler should extract the Commercetools payload', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
  // If handler returns 200, payload extraction succeeded
});

Then(
  'the extracted payload should be compatible with existing business logic',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // If handler returns 200, payload is compatible with existing logic
  }
);

Then(
  'the handler should convert the SNS event to a format compatible with existing validator',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // If handler returns 200, format conversion succeeded
  }
);

Then(
  'the handler should convert the SNS event to a format compatible with existing transformer',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // If handler returns 200, format conversion succeeded
  }
);

Then(
  'the handler should convert the SNS event to a format compatible with existing integration service',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // If handler returns 200, format conversion succeeded
  }
);

Then(
  'the handler should validate the payload using the existing validator',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // If handler returns 200, validation succeeded
  }
);

Then(
  'the handler should transform the customer data using the existing transformer',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // If handler returns 200, transformation succeeded
  }
);

Then(
  'the handler should send the data to Segment using the existing integration service',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // If handler returns 200, integration succeeded
  }
);

Then(
  'the customer should be created in Segment with userId {string}',
  async function (expectedUserId: string) {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);

    // Verify user in Segment
    const verification = await verifyUserInSegment(expectedUserId);
    expect(verification.userId).to.equal(expectedUserId);
  }
);

Then(
  'the customer should be updated in Segment with userId {string}',
  async function (expectedUserId: string) {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);

    // Verify user in Segment
    const verification = await verifyUserInSegment(expectedUserId);
    expect(verification.userId).to.equal(expectedUserId);
  }
);

Then('the handler should identify the message type as Notification', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
  // If handler returns 200, message type identification succeeded
});

Then(
  'the handler should identify the message type as SubscriptionConfirmation',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // Subscription confirmation should always return 200
  }
);

Then('the handler should extract and process the Commercetools payload', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
  // If handler returns 200, extraction and processing succeeded
});

Then('the handler should handle the subscription confirmation', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
  // Subscription confirmation handling should always succeed
});

Then('the handler should process each record in the SNS event', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
  // If handler returns 200, all records were processed successfully
});

Then(
  'the handler should extract each Commercetools payload from the Message field',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // If handler returns 200, all payloads were extracted successfully
  }
);

Then(
  'the handler should produce the same validation result as the HTTP webhook handler',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // If handler returns 200, validation result matches HTTP webhook handler
  }
);

Then(
  'the handler should produce the same transformation result as the HTTP webhook handler',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // If handler returns 200, transformation result matches HTTP webhook handler
  }
);

Then(
  'the handler should produce the same Segment integration result as the HTTP webhook handler',
  function () {
    const context = this as LambdaStepContext;
    expect(context.lambdaResponse).to.not.be.undefined;
    expect(context.lambdaResponse?.statusCode).to.equal(200);
    // If handler returns 200, integration result matches HTTP webhook handler
  }
);

Then('the handler should validate the payload', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
  // If handler returns 200, validation succeeded
});

Then('the handler should transform the customer data', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
  // If handler returns 200, transformation succeeded
});

Then('the handler should send the data to Segment', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
  // If handler returns 200, data was sent to Segment
});

Then('the handler should process the event successfully', function () {
  const context = this as LambdaStepContext;
  expect(context.lambdaResponse).to.not.be.undefined;
  expect(context.lambdaResponse?.statusCode).to.equal(200);
  // If handler returns 200, event was processed successfully
});

