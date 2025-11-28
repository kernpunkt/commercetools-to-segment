import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import the handler (will fail until api/webhook.ts exists - expected in red phase)
// eslint-disable-next-line @typescript-eslint/no-require-imports
import handler from '../../api/webhook.js';

// Shared context for storing request/response data between steps
interface WebhookStepContext {
  request?: Partial<VercelRequest>;
  response?: {
    statusCode?: number;
    body?: string;
    headers?: Record<string, string>;
  };
  eventType?: string;
}

// Helper function to create a valid Commercetools customer.created payload
function createCustomerCreatedPayload(): Readonly<Record<string, unknown>> {
  return {
    notificationType: 'Message',
    type: 'CustomerCreated',
    resource: {
      typeId: 'customer',
      id: 'test-customer-id-123',
    },
    projectKey: 'test-project',
    id: 'test-notification-id',
    version: 1,
    sequenceNumber: 1,
    resourceVersion: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    lastModifiedAt: '2024-01-01T00:00:00.000Z',
  } as const;
}

// Helper function to create a valid Commercetools customer.updated payload
function createCustomerUpdatedPayload(): Readonly<Record<string, unknown>> {
  return {
    notificationType: 'Message',
    type: 'CustomerUpdated',
    resource: {
      typeId: 'customer',
      id: 'test-customer-id-456',
    },
    projectKey: 'test-project',
    id: 'test-notification-id-2',
    version: 2,
    sequenceNumber: 2,
    resourceVersion: 2,
    createdAt: '2024-01-01T00:00:00.000Z',
    lastModifiedAt: '2024-01-02T00:00:00.000Z',
  } as const;
}

// Helper function to create a mock VercelRequest
function createMockRequest(
  method: string,
  body?: string | Readonly<Record<string, unknown>>
): VercelRequest {
  const requestBody =
    body === undefined
      ? undefined
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);
  return {
    method,
    body: requestBody,
    headers: {
      'content-type': 'application/json',
    },
    query: {},
    cookies: {},
    url: '/api/webhook',
  } as VercelRequest;
}

// Helper function to create a mock VercelResponse
function createMockResponse(): VercelResponse {
  const response: {
    statusCode?: number;
    body?: string;
    headers: Record<string, string>;
    status: (code: number) => VercelResponse;
    json: (data: unknown) => VercelResponse;
    send: (data: string) => VercelResponse;
    end: () => VercelResponse;
  } = {
    headers: {},
    statusCode: undefined,
    body: undefined,
    status: function (code: number) {
      this.statusCode = code;
      return this as VercelResponse;
    },
    json: function (data: unknown) {
      this.body = JSON.stringify(data);
      return this as VercelResponse;
    },
    send: function (data: string) {
      this.body = data;
      return this as VercelResponse;
    },
    end: function () {
      return this as VercelResponse;
    },
  };
  return response as VercelResponse;
}

// Background step: Webhook endpoint is available
Given('the webhook endpoint is available at {string}', function (endpoint: string) {
  // Store endpoint in context for reference
  (this as WebhookStepContext).request = {
    url: endpoint,
  };
});

// Given steps: Setting up payloads
Given('a valid Commercetools customer.created webhook payload', function () {
  const payload = createCustomerCreatedPayload();
  (this as WebhookStepContext).request = {
    ...(this as WebhookStepContext).request,
    body: JSON.stringify(payload),
  };
});

Given('a valid Commercetools customer.updated webhook payload', function () {
  const payload = createCustomerUpdatedPayload();
  (this as WebhookStepContext).request = {
    ...(this as WebhookStepContext).request,
    body: JSON.stringify(payload),
  };
});

Given('a valid Commercetools webhook payload', function () {
  // Use customer.created as default valid payload
  const payload = createCustomerCreatedPayload();
  (this as WebhookStepContext).request = {
    ...(this as WebhookStepContext).request,
    body: JSON.stringify(payload),
  };
});

Given('no request body is provided', function () {
  (this as WebhookStepContext).request = {
    ...(this as WebhookStepContext).request,
    body: undefined,
  };
});

Given('an invalid JSON payload', function () {
  (this as WebhookStepContext).request = {
    ...(this as WebhookStepContext).request,
    body: '{ invalid json }',
  };
});

Given('a JSON payload with missing required fields', function () {
  // Create a payload missing required fields like 'type' or 'notificationType'
  const invalidPayload = {
    resource: {
      typeId: 'customer',
      id: 'test-customer-id',
    },
    // Missing: notificationType, type, projectKey, etc.
  };
  (this as WebhookStepContext).request = {
    ...(this as WebhookStepContext).request,
    body: JSON.stringify(invalidPayload),
  };
});

// When steps: Sending requests - using regex to handle all HTTP methods
// When step with parameter for Scenario Outline - using regex for flexible matching
When(
  /^I send a (GET|POST|PUT|DELETE|PATCH) request to the webhook endpoint$/,
  async function (method: string) {
    const context = this as WebhookStepContext;
    const request = createMockRequest(method, context.request?.body);
    const response = createMockResponse();

    await handler(request, response);

    context.response = {
      statusCode: response.statusCode,
      body: response.body,
      headers: response.headers,
    };
  }
);

// Then steps: Asserting responses
Then('the endpoint should return HTTP status {int}', function (expectedStatus: number) {
  const context = this as WebhookStepContext;
  expect(context.response).to.not.be.undefined;
  expect(context.response?.statusCode).to.equal(expectedStatus);
});

// Step definition for event type identification - using regex for flexible matching
Then(/^the endpoint should identify the event as (customer\.created|customer\.updated)$/, function (expectedEventType: string) {
  const context = this as WebhookStepContext;
  expect(context.response).to.not.be.undefined;
  expect(context.response?.statusCode).to.equal(200);
  
  // Parse the response body and validate the event type
  expect(context.response?.body).to.not.be.undefined;
  const responseBody = JSON.parse(context.response?.body as string);
  expect(responseBody.eventType).to.equal(expectedEventType);
  
  // Store event type for potential future assertions
  context.eventType = expectedEventType;
});


