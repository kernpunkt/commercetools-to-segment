import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
// Import the transformation function (will fail until src/transformation/transformer.ts exists - expected in red phase)
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { transformCustomerToSegment } from '../../src/transformation/transformer.js';
import type { UserTraits } from '../../src/segment/types.js';

// Types for Commercetools customer structure (matching ARC memory)
interface CommercetoolsAddress {
  readonly streetName?: string | null;
  readonly streetNumber?: string | null;
  readonly city?: string | null;
  readonly postalCode?: string | null;
  readonly country?: string | null;
}

interface CommercetoolsCustomer {
  readonly email?: string | null;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly fullName?: string | null;
  readonly addresses?: ReadonlyArray<CommercetoolsAddress> | null;
}

interface SegmentIdentifyPayload {
  readonly userId: string;
  readonly traits: UserTraits;
}

// Shared context for storing customer payload and transformed result between steps
interface TransformationStepContext {
  customerPayload?: CommercetoolsCustomer;
  transformedResult?: SegmentIdentifyPayload;
  transformationError?: Error;
}

// Helper function to create a base Commercetools customer payload
function createBaseCustomerPayload(): CommercetoolsCustomer {
  return {
    email: null,
    firstName: null,
    lastName: null,
    fullName: null,
    addresses: null,
  } as const;
}

// Helper function to create a customer payload with email
function createCustomerWithEmail(email: string): CommercetoolsCustomer {
  return {
    ...createBaseCustomerPayload(),
    email,
  } as const;
}

// Helper function to create a customer payload with name fields
function createCustomerWithName(
  firstName?: string | null,
  lastName?: string | null,
  fullName?: string | null
): CommercetoolsCustomer {
  return {
    ...createBaseCustomerPayload(),
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    fullName: fullName ?? null,
  } as const;
}

// Helper function to create a customer payload with address
function createCustomerWithAddress(
  streetName?: string | null,
  streetNumber?: string | null,
  city?: string | null,
  postalCode?: string | null,
  country?: string | null
): CommercetoolsCustomer {
  const address: CommercetoolsAddress = {
    streetName: streetName ?? null,
    streetNumber: streetNumber ?? null,
    city: city ?? null,
    postalCode: postalCode ?? null,
    country: country ?? null,
  };
  return {
    ...createBaseCustomerPayload(),
    addresses: [address],
  } as const;
}

// Helper function to combine street name and number into a single street field
function combineStreetNameAndNumber(
  streetName?: string | null,
  streetNumber?: string | null
): string | undefined {
  if (!streetName && !streetNumber) {
    return undefined;
  }
  if (streetName && streetNumber) {
    return `${streetName} ${streetNumber}`;
  }
  return streetName ?? streetNumber ?? undefined;
}

// Background step: Transformation function is available
Given('a transformation function is available', function () {
  // Transformation function is ready for testing
  // This step ensures the function exists (will fail in red phase until implementation)
  expect(transformCustomerToSegment).to.be.a('function');
});

// Given steps: Setting up customer payloads
Given(
  'a Commercetools customer payload with email {string}',
  function (email: string) {
    const context = this as TransformationStepContext;
    context.customerPayload = createCustomerWithEmail(email);
  }
);

Given(
  'a Commercetools customer payload with first name {string} and last name {string}',
  function (firstName: string, lastName: string) {
    const context = this as TransformationStepContext;
    context.customerPayload = createCustomerWithName(firstName, lastName, null);
  }
);

Given(
  'a Commercetools customer payload with full name {string}',
  function (fullName: string) {
    const context = this as TransformationStepContext;
    context.customerPayload = createCustomerWithName(null, null, fullName);
  }
);

Given(
  'a Commercetools customer payload with address:',
  function (dataTable: { rawTable: ReadonlyArray<ReadonlyArray<string>> }) {
    const context = this as TransformationStepContext;
    const rows = dataTable.rawTable;
    if (rows.length < 2) {
      throw new Error('Address data table must have header and at least one row');
    }
    const headers = rows[0];
    const dataRow = rows[1];

    // Find column indices
    const streetIndex = headers.indexOf('street');
    const cityIndex = headers.indexOf('city');
    const postalCodeIndex = headers.indexOf('postalCode');
    const countryIndex = headers.indexOf('country');

    // Extract values (handle missing columns gracefully)
    const street = streetIndex >= 0 ? dataRow[streetIndex] : undefined;
    const city = cityIndex >= 0 ? dataRow[cityIndex] : undefined;
    const postalCode =
      postalCodeIndex >= 0 ? dataRow[postalCodeIndex] : undefined;
    const country = countryIndex >= 0 ? dataRow[countryIndex] : undefined;

    // Split street into streetName and streetNumber if needed
    // For simplicity, assume the street field contains the full street address
    // In real Commercetools, this would be streetName + streetNumber
    const streetName = street;
    const streetNumber = undefined;

    context.customerPayload = createCustomerWithAddress(
      streetName,
      streetNumber,
      city,
      postalCode,
      country
    );
  }
);

Given(
  'a Commercetools customer payload with:',
  function (dataTable: { rawTable: ReadonlyArray<ReadonlyArray<string>> }) {
    const context = this as TransformationStepContext;
    const rows = dataTable.rawTable;
    if (rows.length < 2) {
      throw new Error('Data table must have header and at least one row');
    }
    const headers = rows[0];

    // Check if this is a key-value format (field | value) or column format
    const isKeyValueFormat = headers.length === 2 && headers[0] === 'field' && headers[1] === 'value';

    let email: string | undefined;
    let firstName: string | undefined;
    let lastName: string | undefined;
    let fullName: string | undefined;
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
            case 'firstName':
              firstName = value;
              break;
            case 'lastName':
              lastName = value;
              break;
            case 'fullName':
              fullName = value;
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
      const firstNameIndex = headers.indexOf('firstName');
      const lastNameIndex = headers.indexOf('lastName');
      const fullNameIndex = headers.indexOf('fullName');
      const streetIndex = headers.indexOf('street');
      const cityIndex = headers.indexOf('city');
      const postalCodeIndex = headers.indexOf('postalCode');
      const countryIndex = headers.indexOf('country');

      // Extract values from first data row
      const dataRow = rows[1];
      email = emailIndex >= 0 ? dataRow[emailIndex] : undefined;
      firstName = firstNameIndex >= 0 ? dataRow[firstNameIndex] : undefined;
      lastName = lastNameIndex >= 0 ? dataRow[lastNameIndex] : undefined;
      fullName = fullNameIndex >= 0 ? dataRow[fullNameIndex] : undefined;
      street = streetIndex >= 0 ? dataRow[streetIndex] : undefined;
      city = cityIndex >= 0 ? dataRow[cityIndex] : undefined;
      postalCode = postalCodeIndex >= 0 ? dataRow[postalCodeIndex] : undefined;
      country = countryIndex >= 0 ? dataRow[countryIndex] : undefined;
    }

    // Build customer payload
    const customer: CommercetoolsCustomer = {
      email: email ?? null,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      fullName: fullName ?? null,
      addresses:
        street || city || postalCode || country
          ? [
              {
                streetName: street ?? null,
                streetNumber: null,
                city: city ?? null,
                postalCode: postalCode ?? null,
                country: country ?? null,
              },
            ]
          : null,
    };

    context.customerPayload = customer;
  }
);

Given('a Commercetools customer payload without email', function () {
  const context = this as TransformationStepContext;
  context.customerPayload = createBaseCustomerPayload();
});

Given('a Commercetools customer payload without name fields', function () {
  const context = this as TransformationStepContext;
  context.customerPayload = createBaseCustomerPayload();
});

Given('a Commercetools customer payload without address fields', function () {
  const context = this as TransformationStepContext;
  context.customerPayload = createBaseCustomerPayload();
});

Given('a Commercetools customer payload with null email', function () {
  const context = this as TransformationStepContext;
  context.customerPayload = {
    ...createBaseCustomerPayload(),
    email: null,
  } as const;
});

Given('a Commercetools customer payload with null name fields', function () {
  const context = this as TransformationStepContext;
  context.customerPayload = {
    ...createBaseCustomerPayload(),
    firstName: null,
    lastName: null,
    fullName: null,
  } as const;
});

Given('a Commercetools customer payload with null address fields', function () {
  const context = this as TransformationStepContext;
  context.customerPayload = {
    ...createBaseCustomerPayload(),
    addresses: null,
  } as const;
});

Given(
  'a Commercetools customer payload with partial address:',
  function (dataTable: { rawTable: ReadonlyArray<ReadonlyArray<string>> }) {
    const context = this as TransformationStepContext;
    const rows = dataTable.rawTable;
    if (rows.length < 2) {
      throw new Error('Address data table must have header and at least one row');
    }
    const headers = rows[0];
    const dataRow = rows[1];

    const streetIndex = headers.indexOf('street');
    const cityIndex = headers.indexOf('city');

    const street = streetIndex >= 0 ? dataRow[streetIndex] : undefined;
    const city = cityIndex >= 0 ? dataRow[cityIndex] : undefined;

    context.customerPayload = createCustomerWithAddress(
      street,
      null,
      city,
      null,
      null
    );
  }
);

// When step: Transform the customer data
When('I transform the customer data to Segment format', function () {
  const context = this as TransformationStepContext;
  if (!context.customerPayload) {
    throw new Error('Customer payload must be set before transformation');
  }

  try {
    context.transformedResult = transformCustomerToSegment(
      context.customerPayload
    );
    context.transformationError = undefined;
  } catch (error) {
    context.transformationError = error as Error;
    context.transformedResult = undefined;
  }
});

// Then steps: Asserting transformed results
Then(
  'the transformed data should have userId {string}',
  function (expectedUserId: string) {
    const context = this as TransformationStepContext;
    expect(context.transformedResult).to.not.be.undefined;
    expect(context.transformedResult?.userId).to.equal(expectedUserId);
  }
);

Then(
  'the transformed data should have email {string} in traits',
  function (expectedEmail: string) {
    const context = this as TransformationStepContext;
    expect(context.transformedResult).to.not.be.undefined;
    expect(context.transformedResult?.traits.email).to.equal(expectedEmail);
  }
);

Then(
  'the transformed data should have name {string} in traits',
  function (expectedName: string) {
    const context = this as TransformationStepContext;
    expect(context.transformedResult).to.not.be.undefined;
    expect(context.transformedResult?.traits.name).to.equal(expectedName);
  }
);

Then(
  'the transformed data should have address in traits:',
  function (dataTable: { rawTable: ReadonlyArray<ReadonlyArray<string>> }) {
    const context = this as TransformationStepContext;
    expect(context.transformedResult).to.not.be.undefined;
    expect(context.transformedResult?.traits.address).to.not.be.undefined;

    const rows = dataTable.rawTable;
    if (rows.length < 2) {
      throw new Error('Address data table must have header and at least one row');
    }
    const headers = rows[0];
    const dataRow = rows[1];

    const address = context.transformedResult?.traits.address;
    expect(address).to.not.be.undefined;

    // Check each field in the data table
    const streetIndex = headers.indexOf('street');
    const cityIndex = headers.indexOf('city');
    const postalCodeIndex = headers.indexOf('postalCode');
    const countryIndex = headers.indexOf('country');

    if (streetIndex >= 0) {
      const expectedStreet = dataRow[streetIndex];
      expect(address?.street).to.equal(expectedStreet);
    }
    if (cityIndex >= 0) {
      const expectedCity = dataRow[cityIndex];
      expect(address?.city).to.equal(expectedCity);
    }
    if (postalCodeIndex >= 0) {
      const expectedPostalCode = dataRow[postalCodeIndex];
      expect(address?.postalCode).to.equal(expectedPostalCode);
    }
    if (countryIndex >= 0) {
      const expectedCountry = dataRow[countryIndex];
      expect(address?.country).to.equal(expectedCountry);
    }
  }
);

Then('the transformation should complete without error', function () {
  const context = this as TransformationStepContext;
  expect(context.transformationError).to.be.undefined;
  expect(context.transformedResult).to.not.be.undefined;
});

Then('the transformed data should not have email in traits', function () {
  const context = this as TransformationStepContext;
  expect(context.transformedResult).to.not.be.undefined;
  // Note: UserTraits type requires email, but the feature expects graceful handling
  // The implementation will need to handle missing email (e.g., make email optional in output,
  // use placeholder, or return partial result). For BDD, we check that email is not meaningful.
  // If the transformation handles missing email gracefully, email might be empty string or undefined.
  // The actual implementation will determine how to handle this type mismatch.
  const email = context.transformedResult?.traits.email;
  // Check that email is either undefined, null, or empty (not a meaningful email value)
  if (email !== undefined && email !== null && email !== '') {
    // If email has a value but shouldn't, that's unexpected
    // This will need to be resolved in the implementation phase
    throw new Error(
      'Email is present in traits but should not be. Implementation needs to handle missing email case.'
    );
  }
});

Then('the transformed data should not have name in traits', function () {
  const context = this as TransformationStepContext;
  expect(context.transformedResult).to.not.be.undefined;
  expect(context.transformedResult?.traits.name).to.be.undefined;
});

Then('the transformed data should not have address in traits', function () {
  const context = this as TransformationStepContext;
  expect(context.transformedResult).to.not.be.undefined;
  expect(context.transformedResult?.traits.address).to.be.undefined;
});

Then(
  'the transformed data address should not have postalCode',
  function () {
    const context = this as TransformationStepContext;
    expect(context.transformedResult).to.not.be.undefined;
    expect(context.transformedResult?.traits.address).to.not.be.undefined;
    expect(context.transformedResult?.traits.address?.postalCode).to.be
      .undefined;
  }
);

Then('the transformed data address should not have country', function () {
  const context = this as TransformationStepContext;
  expect(context.transformedResult).to.not.be.undefined;
  expect(context.transformedResult?.traits.address).to.not.be.undefined;
  expect(context.transformedResult?.traits.address?.country).to.be.undefined;
});

Then(
  'the transformed data should have structure compatible with Segment Identify API',
  function () {
    const context = this as TransformationStepContext;
    expect(context.transformedResult).to.not.be.undefined;
    expect(context.transformedResult).to.have.property('userId');
    expect(context.transformedResult).to.have.property('traits');
    expect(context.transformedResult?.traits).to.have.property('email');
  }
);

Then('the transformed data should have userId field', function () {
  const context = this as TransformationStepContext;
  expect(context.transformedResult).to.not.be.undefined;
  expect(context.transformedResult).to.have.property('userId');
  expect(context.transformedResult?.userId).to.be.a('string');
});

Then('the transformed data should have traits field', function () {
  const context = this as TransformationStepContext;
  expect(context.transformedResult).to.not.be.undefined;
  expect(context.transformedResult).to.have.property('traits');
  expect(context.transformedResult?.traits).to.be.an('object');
});

Then('the transformed data traits should have email field', function () {
  const context = this as TransformationStepContext;
  expect(context.transformedResult).to.not.be.undefined;
  expect(context.transformedResult?.traits).to.have.property('email');
  expect(context.transformedResult?.traits.email).to.be.a('string');
});

