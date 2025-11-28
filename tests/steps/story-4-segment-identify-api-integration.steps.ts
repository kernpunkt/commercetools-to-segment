import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
// Import the integration service (will fail until src/integration/service.ts exists - expected in red phase)
// eslint-disable-next-line @typescript-eslint/no-require-imports
import {
  sendCustomerToSegment,
  sendCustomerToSegmentWithClient,
} from '../../src/integration/service.js';
import type { SegmentIdentifyPayload } from '../../src/transformation/types.js';
import type { SegmentClient, UserTraits } from '../../src/segment/types.js';

// Types for integration result (matching ARC memory)
type SegmentIntegrationResult =
  | { success: true }
  | { success: false; error: SegmentError };

interface SegmentError {
  readonly message: string;
  readonly code?: string;
}

// Shared context for storing integration state between steps
interface IntegrationStepContext {
  transformedPayload?: SegmentIdentifyPayload;
  integrationResult?: SegmentIntegrationResult;
  integrationError?: Error;
  mockClient?: MockSegmentClient;
  actualClient?: SegmentClient;
  identifyCalls?: ReadonlyArray<IdentifyCall>;
  apiWillError?: boolean;
}

// Track identify calls for verification
interface IdentifyCall {
  readonly userId: string;
  readonly traits: UserTraits;
}

// Mock Segment client for testing
class MockSegmentClient implements SegmentClient {
  private readonly identifyCalls: IdentifyCall[] = [];
  private shouldError = false;

  identify(params: {
    readonly userId: string;
    readonly traits: UserTraits;
  }): Promise<void> {
    if (this.shouldError) {
      return Promise.reject(new Error('Segment API error'));
    }
    this.identifyCalls.push({
      userId: params.userId,
      traits: params.traits,
    });
    return Promise.resolve();
  }

  async flush(): Promise<void> {
    // Mock flush - no-op for testing
    return Promise.resolve();
  }

  async closeAndFlush(): Promise<void> {
    // Mock closeAndFlush - no-op for testing
    return Promise.resolve();
  }

  getIdentifyCalls(): ReadonlyArray<IdentifyCall> {
    return this.identifyCalls;
  }

  setShouldError(shouldError: boolean): void {
    this.shouldError = shouldError;
  }

  reset(): void {
    this.identifyCalls.length = 0;
    this.shouldError = false;
  }
}

// Helper function to create a base SegmentIdentifyPayload
function createBasePayload(): SegmentIdentifyPayload {
  return {
    userId: '',
    traits: {
      email: '',
    },
  } as const;
}

// Helper function to create a payload with email
function createPayloadWithEmail(email: string): SegmentIdentifyPayload {
  return {
    userId: email,
    traits: {
      email,
    },
  } as const;
}

// Helper function to create a payload with email and name
function createPayloadWithName(
  email: string,
  name: string
): SegmentIdentifyPayload {
  return {
    userId: email,
    traits: {
      email,
      name,
    },
  } as const;
}

// Helper function to create a payload with email and address
function createPayloadWithAddress(
  email: string,
  street?: string,
  city?: string,
  postalCode?: string,
  country?: string
): SegmentIdentifyPayload {
  const address =
    street || city || postalCode || country
      ? {
          street,
          city,
          postalCode,
          country,
        }
      : undefined;

  return {
    userId: email,
    traits: {
      email,
      address,
    },
  } as const;
}

// Helper function to create a payload with all traits
function createPayloadWithAllTraits(
  email: string,
  name?: string,
  street?: string,
  city?: string,
  postalCode?: string,
  country?: string
): SegmentIdentifyPayload {
  const address =
    street || city || postalCode || country
      ? {
          street,
          city,
          postalCode,
          country,
        }
      : undefined;

  return {
    userId: email,
    traits: {
      email,
      name,
      address,
    },
  } as const;
}

// Background step: Segment client is initialized
Given(
  'the Segment client is initialized with write key from environment',
  function () {
    const context = this as IntegrationStepContext;
    // For BDD testing, we use a mock client to verify API calls
    // This allows us to test the integration service behavior without needing a real API key
    context.mockClient = new MockSegmentClient();
    context.actualClient = context.mockClient;
  }
);

// Background step: Transformed customer data is available
Given('transformed customer data is available', function () {
  // Transformation function is ready for testing
  // This step ensures the data can be prepared (will be set in Given steps)
});

// Given steps: Setting up transformed customer data
Given(
  'transformed customer data with email {string}',
  function (email: string) {
    const context = this as IntegrationStepContext;
    context.transformedPayload = createPayloadWithEmail(email);
  }
);

Given(
  'transformed customer data with:',
  function (dataTable: { rawTable: ReadonlyArray<ReadonlyArray<string>> }) {
    const context = this as IntegrationStepContext;
    const rows = dataTable.rawTable;
    if (rows.length < 2) {
      throw new Error('Data table must have header and at least one row');
    }
    const headers = rows[0];

    // Check if this is a key-value format (field | value)
    const isKeyValueFormat =
      headers.length === 2 && headers[0] === 'field' && headers[1] === 'value';

    let email: string | undefined;
    let name: string | undefined;
    let street: string | undefined;
    let city: string | undefined;
    let postalCode: string | undefined;
    let country: string | undefined;

    if (isKeyValueFormat) {
      // Key-value format: iterate through rows to find values
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length >= 2) {
          const field = row[0];
          const value = row[1];
          switch (field) {
            case 'email':
              email = value;
              break;
            case 'name':
              name = value;
              break;
            case 'street':
              street = value;
              break;
            case 'city':
              city = value;
              break;
            case 'postalCode':
              postalCode = value;
              break;
            case 'country':
              country = value;
              break;
          }
        }
      }
    } else {
      // Column format: find column indices
      const emailIndex = headers.indexOf('email');
      const nameIndex = headers.indexOf('name');
      const streetIndex = headers.indexOf('street');
      const cityIndex = headers.indexOf('city');
      const postalCodeIndex = headers.indexOf('postalCode');
      const countryIndex = headers.indexOf('country');

      // Extract values from first data row
      const dataRow = rows[1];
      email = emailIndex >= 0 ? dataRow[emailIndex] : undefined;
      name = nameIndex >= 0 ? dataRow[nameIndex] : undefined;
      street = streetIndex >= 0 ? dataRow[streetIndex] : undefined;
      city = cityIndex >= 0 ? dataRow[cityIndex] : undefined;
      postalCode =
        postalCodeIndex >= 0 ? dataRow[postalCodeIndex] : undefined;
      country = countryIndex >= 0 ? dataRow[countryIndex] : undefined;
    }

    if (!email) {
      throw new Error('Email is required for transformed customer data');
    }

    // Build payload based on what fields are present
    if (name && (street || city || postalCode || country)) {
      context.transformedPayload = createPayloadWithAllTraits(
        email,
        name,
        street,
        city,
        postalCode,
        country
      );
    } else if (name) {
      context.transformedPayload = createPayloadWithName(email, name);
    } else if (street || city || postalCode || country) {
      context.transformedPayload = createPayloadWithAddress(
        email,
        street,
        city,
        postalCode,
        country
      );
    } else {
      context.transformedPayload = createPayloadWithEmail(email);
    }
  }
);

Given(
  'transformed customer data from customer.created event with email {string}',
  function (email: string) {
    const context = this as IntegrationStepContext;
    // For customer.created, we just need the email
    context.transformedPayload = createPayloadWithEmail(email);
  }
);

Given(
  'transformed customer data from customer.updated event with email {string}',
  function (email: string) {
    const context = this as IntegrationStepContext;
    // For customer.updated, we just need the email
    context.transformedPayload = createPayloadWithEmail(email);
  }
);

Given('the Segment API will return an error', function () {
  const context = this as IntegrationStepContext;
  context.apiWillError = true;
  // Set up mock client to error if using mock
  if (context.mockClient) {
    context.mockClient.setShouldError(true);
  }
});

// When step: Send customer data to Segment Identify API
When('I send the customer data to Segment Identify API', async function () {
  const context = this as IntegrationStepContext;
  if (!context.transformedPayload) {
    throw new Error(
      'Transformed customer data must be set before sending to API'
    );
  }

  if (!context.mockClient) {
    throw new Error('Mock client must be initialized in Background step');
  }

  // Reset mock client state
  context.mockClient.reset();
  if (context.apiWillError) {
    context.mockClient.setShouldError(true);
  }

  try {
    // Call the integration service with injected mock client
    // This allows us to verify API calls without needing a real Segment API key
    // This will fail until sendCustomerToSegmentWithClient is implemented (expected in red phase)
    const result = await sendCustomerToSegmentWithClient(
      context.mockClient,
      context.transformedPayload
    );
    context.integrationResult = result;
    context.integrationError = undefined;

    // Track identify calls for verification
    context.identifyCalls = context.mockClient.getIdentifyCalls();
  } catch (error) {
    context.integrationError = error as Error;
    context.integrationResult = undefined;
  }
});

// Then steps: Asserting API call results
Then('the API call should succeed', function () {
  const context = this as IntegrationStepContext;
  expect(context.integrationResult).to.not.be.undefined;
  expect(context.integrationResult?.success).to.equal(true);
  expect(context.integrationError).to.be.undefined;
});

Then(
  'the customer should be identified in Segment with userId {string}',
  function (expectedUserId: string) {
    const context = this as IntegrationStepContext;
    // Verify the identify call was made with correct userId
    expect(context.mockClient).to.not.be.undefined;
    const calls = context.mockClient?.getIdentifyCalls();
    expect(calls?.length).to.be.greaterThan(0);
    expect(calls?.[0]?.userId).to.equal(expectedUserId);
  }
);

Then(
  'the API call should use email {string} as userId',
  function (expectedEmail: string) {
    const context = this as IntegrationStepContext;
    // Verify the identify call was made with email as userId
    expect(context.mockClient).to.not.be.undefined;
    const calls = context.mockClient?.getIdentifyCalls();
    expect(calls?.length).to.be.greaterThan(0);
    expect(calls?.[0]?.userId).to.equal(expectedEmail);
  }
);

Then(
  'the API call should include email {string} in traits',
  function (expectedEmail: string) {
    const context = this as IntegrationStepContext;
    // Verify the identify call was made with email in traits
    expect(context.mockClient).to.not.be.undefined;
    const calls = context.mockClient?.getIdentifyCalls();
    expect(calls?.length).to.be.greaterThan(0);
    expect(calls?.[0]?.traits.email).to.equal(expectedEmail);
  }
);

Then(
  'the API call should include name {string} in traits',
  function (expectedName: string) {
    const context = this as IntegrationStepContext;
    // Verify the identify call was made with name in traits
    expect(context.mockClient).to.not.be.undefined;
    const calls = context.mockClient?.getIdentifyCalls();
    expect(calls?.length).to.be.greaterThan(0);
    expect(calls?.[0]?.traits.name).to.equal(expectedName);
  }
);

Then(
  'the API call should include address in traits:',
  function (dataTable: { rawTable: ReadonlyArray<ReadonlyArray<string>> }) {
    const context = this as IntegrationStepContext;
    const rows = dataTable.rawTable;
    if (rows.length < 2) {
      throw new Error('Address data table must have header and at least one row');
    }
    const headers = rows[0];
    const dataRow = rows[1];

    // Extract expected address values
    const streetIndex = headers.indexOf('street');
    const cityIndex = headers.indexOf('city');
    const postalCodeIndex = headers.indexOf('postalCode');
    const countryIndex = headers.indexOf('country');

    const expectedStreet = streetIndex >= 0 ? dataRow[streetIndex] : undefined;
    const expectedCity = cityIndex >= 0 ? dataRow[cityIndex] : undefined;
    const expectedPostalCode =
      postalCodeIndex >= 0 ? dataRow[postalCodeIndex] : undefined;
    const expectedCountry =
      countryIndex >= 0 ? dataRow[countryIndex] : undefined;

    // Verify the identify call was made with address in traits
    expect(context.mockClient).to.not.be.undefined;
    const calls = context.mockClient?.getIdentifyCalls();
    expect(calls?.length).to.be.greaterThan(0);
    const address = calls?.[0]?.traits.address;
    expect(address).to.not.be.undefined;

    if (expectedStreet !== undefined) {
      expect(address?.street).to.equal(expectedStreet);
    }
    if (expectedCity !== undefined) {
      expect(address?.city).to.equal(expectedCity);
    }
    if (expectedPostalCode !== undefined) {
      expect(address?.postalCode).to.equal(expectedPostalCode);
    }
    if (expectedCountry !== undefined) {
      expect(address?.country).to.equal(expectedCountry);
    }
  }
);

Then('the function should return success status', function () {
  const context = this as IntegrationStepContext;
  expect(context.integrationResult).to.not.be.undefined;
  expect(context.integrationResult?.success).to.equal(true);
});

Then('no error should be thrown', function () {
  const context = this as IntegrationStepContext;
  expect(context.integrationError).to.be.undefined;
  expect(context.integrationResult?.success).to.equal(true);
});

Then('the function should return error status', function () {
  const context = this as IntegrationStepContext;
  expect(context.integrationResult).to.not.be.undefined;
  expect(context.integrationResult?.success).to.equal(false);
  expect(context.integrationResult).to.have.property('error');
});

Then('the error should be handled gracefully', function () {
  const context = this as IntegrationStepContext;
  // Verify error is returned as Result type, not thrown
  expect(context.integrationError).to.be.undefined;
  expect(context.integrationResult?.success).to.equal(false);
  if (context.integrationResult && !context.integrationResult.success) {
    expect(context.integrationResult.error).to.have.property('message');
  }
});

