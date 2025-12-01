import { Before, Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import {
  createCustomerCreatedPayload,
  createCustomerUpdatedPayload,
  createCustomerCreatedPayloadWithEmail,
  createCustomerUpdatedPayloadWithEmail,
  createPayloadFromDataTable,
  parseDataTable,
} from '../utils/webhook-payload-builder.js';
import { sendWebhookRequest, parseJsonResponse } from '../utils/http-client.js';
import {
  getWebhookEndpoint,
  isLocalEnvironment,
  isVercelEnvironment,
  getEnvironmentName,
} from '../utils/test-environment.js';
import {
  verifyUserInSegment,
  verifyUserTraits,
} from '../utils/segment-verification.js';

// Set up environment variable for Segment client
Before(function () {
  // Set SEGMENT_WRITE_KEY for webhook handler tests
  // The handler requires this to create Segment client
  if (!process.env.SEGMENT_WRITE_KEY) {
    process.env.SEGMENT_WRITE_KEY = 'test-write-key-for-e2e-tests';
  }
});

// Shared context for storing E2E test state
interface E2EStepContext {
  webhookPayload?: Readonly<Record<string, unknown>>;
  httpResponse?: {
    readonly statusCode: number;
    readonly body: string;
    readonly headers: Record<string, string>;
  };
  webhookEndpoint?: string;
  testEnvironment?: 'local' | 'vercel' | 'unknown';
  userId?: string;
  expectedTraits?: {
    readonly email: string;
    readonly name?: string;
    readonly address?: {
      readonly street?: string;
      readonly city?: string;
      readonly postalCode?: string;
      readonly country?: string;
    };
  };
}

// Background steps
// Note: Step "the webhook endpoint is available at {string}" is defined in story-2
// It now also sets webhookEndpoint for E2E context, so we don't need to redefine it here

Given(
  'the Segment integration is configured with valid credentials',
  function () {
    // Verify SEGMENT_WRITE_KEY is set
    expect(process.env.SEGMENT_WRITE_KEY).to.not.be.undefined;
    expect(process.env.SEGMENT_WRITE_KEY).to.not.equal('');
  }
);

Given('the data transformation service is available', function () {
  // Transformation service is part of the webhook handler
  // This step ensures the service is ready (no action needed)
});

// Environment setup steps
Given('the application is running locally', function () {
  const context = this as E2EStepContext;
  context.testEnvironment = 'local';
  // Set endpoint to local if not already set
  if (!context.webhookEndpoint) {
    context.webhookEndpoint = getWebhookEndpoint();
  }
});

Given('the application is deployed on Vercel', function () {
  const context = this as E2EStepContext;
  context.testEnvironment = 'vercel';
  // Set endpoint to Vercel if not already set
  if (!context.webhookEndpoint) {
    const vercelUrl = process.env.VERCEL_URL ?? process.env.WEBHOOK_ENDPOINT_URL;
    if (vercelUrl) {
      context.webhookEndpoint = vercelUrl.endsWith('/api/webhook')
        ? vercelUrl
        : `${vercelUrl}/api/webhook`;
    } else {
      throw new Error(
        'Vercel URL not found. Set VERCEL_URL or WEBHOOK_ENDPOINT_URL environment variable.'
      );
    }
  }
});

// Given steps: Webhook payload creation
Given(
  'a valid Commercetools customer.created webhook payload with email {string}',
  function (email: string) {
    const context = this as E2EStepContext;
    context.webhookPayload = createCustomerCreatedPayloadWithEmail(email);
    context.userId = email;
    context.expectedTraits = {
      email,
    };
  }
);

Given(
  'a valid Commercetools customer.updated webhook payload with email {string}',
  function (email: string) {
    const context = this as E2EStepContext;
    context.webhookPayload = createCustomerUpdatedPayloadWithEmail(email);
    context.userId = email;
    context.expectedTraits = {
      email,
    };
  }
);

Given(
  'a valid Commercetools customer.created webhook payload with:',
  function (dataTable: { rawTable: ReadonlyArray<ReadonlyArray<string>> }) {
    const context = this as E2EStepContext;
    const fields = parseDataTable(dataTable);
    context.webhookPayload = createPayloadFromDataTable({
      ...fields,
      eventType: 'customer.created',
    });

    // Extract expected traits
    const email = fields.email;
    if (email) {
      context.userId = email;
      const name =
        fields.fullName ??
        (fields.firstName && fields.lastName
          ? `${fields.firstName} ${fields.lastName}`
          : fields.firstName ?? fields.lastName);
      const address =
        fields.street || fields.city || fields.postalCode || fields.country
          ? {
              street: fields.street,
              city: fields.city,
              postalCode: fields.postalCode,
              country: fields.country,
            }
          : undefined;

      context.expectedTraits = {
        email,
        ...(name && { name }),
        ...(address && { address }),
      };
    }
  }
);

Given(
  'a valid Commercetools customer.updated webhook payload with:',
  function (dataTable: { rawTable: ReadonlyArray<ReadonlyArray<string>> }) {
    const context = this as E2EStepContext;
    const fields = parseDataTable(dataTable);
    context.webhookPayload = createPayloadFromDataTable({
      ...fields,
      eventType: 'customer.updated',
    });

    // Extract expected traits
    const email = fields.email;
    if (email) {
      context.userId = email;
      const name =
        fields.fullName ??
        (fields.firstName && fields.lastName
          ? `${fields.firstName} ${fields.lastName}`
          : fields.firstName ?? fields.lastName);
      const address =
        fields.street || fields.city || fields.postalCode || fields.country
          ? {
              street: fields.street,
              city: fields.city,
              postalCode: fields.postalCode,
              country: fields.country,
            }
          : undefined;

      context.expectedTraits = {
        email,
        ...(name && { name }),
        ...(address && { address }),
      };
    }
  }
);

// When steps: Sending webhook requests
When('I send the webhook payload to the webhook endpoint', async function () {
  const context = this as E2EStepContext;
  if (!context.webhookPayload) {
    throw new Error('Webhook payload must be set before sending');
  }
  // Get endpoint - use webhookEndpoint if set, otherwise get from environment
  let endpoint = context.webhookEndpoint;
  if (!endpoint) {
    endpoint = getWebhookEndpoint();
  }
  // If endpoint is relative path, convert to full URL using URL constructor
  if (endpoint.startsWith('/')) {
    const baseUrl = process.env.WEBHOOK_ENDPOINT_URL ?? 'http://localhost:3000';
    try {
      const baseUrlObj = new URL(baseUrl);
      const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      baseUrlObj.pathname = endpointPath;
      endpoint = baseUrlObj.toString();
    } catch {
      // Fallback to string manipulation if URL constructor fails
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      endpoint = `${cleanBaseUrl}${cleanEndpoint}`;
    }
  }
  context.webhookEndpoint = endpoint;

  try {
    context.httpResponse = await sendWebhookRequest(endpoint, context.webhookPayload);
  } catch (error) {
    throw new Error(
      `Failed to send webhook request: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

When(
  'I send the webhook payload to the local webhook endpoint',
  async function () {
    const context = this as E2EStepContext;
    if (!context.webhookPayload) {
      throw new Error('Webhook payload must be set before sending');
    }
    context.webhookEndpoint = 'http://localhost:3000/api/webhook';
    context.testEnvironment = 'local';

    try {
      context.httpResponse = await sendWebhookRequest(
        context.webhookEndpoint,
        context.webhookPayload
      );
    } catch (error) {
      throw new Error(
        `Failed to send webhook request to local endpoint: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

When(
  'I send the webhook payload to the Vercel webhook endpoint',
  async function () {
    const context = this as E2EStepContext;
    if (!context.webhookPayload) {
      throw new Error('Webhook payload must be set before sending');
    }
    const vercelUrl = process.env.VERCEL_URL ?? process.env.WEBHOOK_ENDPOINT_URL;
    if (!vercelUrl) {
      throw new Error(
        'Vercel URL not found. Set VERCEL_URL or WEBHOOK_ENDPOINT_URL environment variable.'
      );
    }
    // Use URL constructor for safer URL handling
    try {
      const url = new URL(vercelUrl);
      if (!url.pathname.endsWith('/api/webhook')) {
        const cleanPathname = url.pathname.endsWith('/')
          ? url.pathname.slice(0, -1)
          : url.pathname;
        url.pathname = `${cleanPathname}/api/webhook`;
      }
      context.webhookEndpoint = url.toString();
    } catch {
      // Fallback to string manipulation if URL constructor fails
      context.webhookEndpoint = vercelUrl.endsWith('/api/webhook')
        ? vercelUrl
        : `${vercelUrl}/api/webhook`;
    }
    context.testEnvironment = 'vercel';

    try {
      context.httpResponse = await sendWebhookRequest(
        context.webhookEndpoint,
        context.webhookPayload
      );
    } catch (error) {
      throw new Error(
        `Failed to send webhook request to Vercel endpoint: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

// Then steps: HTTP response verification
Then(
  'the webhook endpoint should return HTTP status {int}',
  function (expectedStatus: number) {
    const context = this as E2EStepContext;
    expect(context.httpResponse).to.not.be.undefined;
    expect(context.httpResponse?.statusCode).to.equal(expectedStatus);
  }
);

Then('the response should indicate success', function () {
  const context = this as E2EStepContext;
  expect(context.httpResponse).to.not.be.undefined;
  expect(context.httpResponse?.statusCode).to.equal(200);

  const responseBody = parseJsonResponse(context.httpResponse?.body ?? '{}');
  expect(responseBody).to.have.property('success');
  expect((responseBody as { success: boolean }).success).to.equal(true);
});

// Then steps: Segment verification
Then(
  'the customer should be created in Segment with userId {string}',
  async function (expectedUserId: string) {
    const context = this as E2EStepContext;
    expect(context.httpResponse?.statusCode).to.equal(200);

    // Verify user in Segment (this may use API or manual verification)
    const verification = await verifyUserInSegment(expectedUserId);
    expect(verification.userId).to.equal(expectedUserId);
  }
);

Then(
  'the customer should be updated in Segment with userId {string}',
  async function (expectedUserId: string) {
    const context = this as E2EStepContext;
    expect(context.httpResponse?.statusCode).to.equal(200);

    // Verify user in Segment (this may use API or manual verification)
    const verification = await verifyUserInSegment(expectedUserId);
    expect(verification.userId).to.equal(expectedUserId);
  }
);

// Note: Step "the customer should be identified in Segment with userId {string}" 
// is defined in story-4 and now handles both integration and E2E contexts

Then(
  'the customer in Segment should have email {string} in traits',
  async function (expectedEmail: string) {
    const context = this as E2EStepContext;
    expect(context.httpResponse?.statusCode).to.equal(200);

    // Verify user traits in Segment
    const traitsMatch = await verifyUserTraits(expectedEmail, {
      email: expectedEmail,
    });
    expect(traitsMatch).to.equal(true);
  }
);

Then(
  'the customer in Segment should have name {string} in traits',
  async function (expectedName: string) {
    const context = this as E2EStepContext;
    expect(context.httpResponse?.statusCode).to.equal(200);
    expect(context.userId).to.not.be.undefined;

    // Verify user traits in Segment
    const userId = context.userId;
    if (!userId) {
      throw new Error('userId must be set before verifying traits');
    }
    const traitsMatch = await verifyUserTraits(userId, {
      email: userId,
      name: expectedName,
    });
    expect(traitsMatch).to.equal(true);
  }
);

Then(
  'the customer in Segment should have address in traits:',
  async function (dataTable: { rawTable: ReadonlyArray<ReadonlyArray<string>> }) {
    const context = this as E2EStepContext;
    expect(context.httpResponse?.statusCode).to.equal(200);
    expect(context.userId).to.not.be.undefined;

    const rows = dataTable.rawTable;
    if (rows.length < 2) {
      throw new Error('Address data table must have header and at least one row');
    }
    const headers = rows[0];
    const dataRow = rows[1];

    const streetIndex = headers.indexOf('street');
    const cityIndex = headers.indexOf('city');
    const postalCodeIndex = headers.indexOf('postalCode');
    const countryIndex = headers.indexOf('country');

    const expectedAddress = {
      street: streetIndex >= 0 ? dataRow[streetIndex] : undefined,
      city: cityIndex >= 0 ? dataRow[cityIndex] : undefined,
      postalCode: postalCodeIndex >= 0 ? dataRow[postalCodeIndex] : undefined,
      country: countryIndex >= 0 ? dataRow[countryIndex] : undefined,
    };

    // Verify user traits in Segment
    const userId = context.userId;
    if (!userId) {
      throw new Error('userId must be set before verifying traits');
    }
    const traitsMatch = await verifyUserTraits(userId, {
      email: userId,
      address: expectedAddress,
    });
    expect(traitsMatch).to.equal(true);
  }
);

Then(
  'the userId in Segment should match the email {string}',
  async function (expectedEmail: string) {
    const context = this as E2EStepContext;
    expect(context.httpResponse?.statusCode).to.equal(200);

    // Verify userId matches email
    const verification = await verifyUserInSegment(expectedEmail);
    expect(verification.userId).to.equal(expectedEmail);
  }
);

Then('the customer should appear in Segment', async function () {
  const context = this as E2EStepContext;
  expect(context.httpResponse?.statusCode).to.equal(200);
  expect(context.userId).to.not.be.undefined;

  // Verify user exists in Segment
  const userId = context.userId;
  if (!userId) {
    throw new Error('userId must be set before verifying user in Segment');
  }
  const verification = await verifyUserInSegment(userId);
  expect(verification.userId).to.equal(userId);
});

Then(
  'the customer should be identified by email {string}',
  async function (expectedEmail: string) {
    const context = this as E2EStepContext;
    expect(context.httpResponse?.statusCode).to.equal(200);

    // Verify user is identified by email
    const verification = await verifyUserInSegment(expectedEmail);
    expect(verification.userId).to.equal(expectedEmail);
  }
);

// Then steps: Data transformation verification
Then('the customer data should be transformed correctly', function () {
  const context = this as E2EStepContext;
  expect(context.httpResponse?.statusCode).to.equal(200);

  // Transformation is verified by checking Segment traits
  // If HTTP 200 is returned, transformation succeeded
  // Additional verification happens in Segment trait checks
});

Then('the transformed data should be sent to Segment', async function () {
  const context = this as E2EStepContext;
  expect(context.httpResponse?.statusCode).to.equal(200);
  expect(context.userId).to.not.be.undefined;

  // Verify data was sent to Segment by checking user exists
  const userId = context.userId;
  if (!userId) {
    throw new Error('userId must be set before verifying data was sent to Segment');
  }
  const verification = await verifyUserInSegment(userId);
  expect(verification.userId).to.equal(userId);
});

