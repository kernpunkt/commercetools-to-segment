/**
 * Webhook Payload Builder Utility
 * Creates valid Commercetools webhook payloads for E2E testing
 */

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

interface WebhookPayload {
  readonly notificationType: 'Message';
  readonly type: 'CustomerCreated' | 'CustomerUpdated';
  readonly resource: {
    readonly typeId: 'customer';
    readonly id: string;
  };
  readonly projectKey: string;
  readonly id: string;
  readonly version: number;
  readonly sequenceNumber: number;
  readonly resourceVersion: number;
  readonly createdAt: string;
  readonly lastModifiedAt: string;
  readonly customer: CommercetoolsCustomer;
}

/**
 * Creates a base Commercetools customer object
 */
function createBaseCustomer(): CommercetoolsCustomer {
  return {
    email: null,
    firstName: null,
    lastName: null,
    fullName: null,
    addresses: null,
  } as const;
}

/**
 * Creates a customer with email
 */
function createCustomerWithEmail(email: string): CommercetoolsCustomer {
  return {
    ...createBaseCustomer(),
    email,
  } as const;
}

/**
 * Creates a customer from data table fields
 */
function createCustomerFromFields(fields: {
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly fullName?: string;
  readonly street?: string;
  readonly city?: string;
  readonly postalCode?: string;
  readonly country?: string;
}): CommercetoolsCustomer {
  // Build address if any address fields are provided
  const hasAddressFields =
    fields.street !== undefined ||
    fields.city !== undefined ||
    fields.postalCode !== undefined ||
    fields.country !== undefined;

  const address: CommercetoolsAddress | undefined = hasAddressFields
    ? {
        streetName: fields.street ?? null,
        streetNumber: null,
        city: fields.city ?? null,
        postalCode: fields.postalCode ?? null,
        country: fields.country ?? null,
      }
    : undefined;

  // Use immutable object construction with conditional spreading
  return {
    ...createBaseCustomer(),
    ...(fields.email !== undefined && { email: fields.email }),
    ...(fields.firstName !== undefined && { firstName: fields.firstName }),
    ...(fields.lastName !== undefined && { lastName: fields.lastName }),
    ...(fields.fullName !== undefined && { fullName: fields.fullName }),
    ...(address !== undefined && { addresses: [address] }),
  } as const;
}

/**
 * Creates a valid Commercetools customer.created webhook payload
 */
export function createCustomerCreatedPayload(
  customer?: CommercetoolsCustomer
): WebhookPayload {
  const timestamp = new Date().toISOString();
  const customerData = customer ?? createBaseCustomer();

  return {
    notificationType: 'Message',
    type: 'CustomerCreated',
    resource: {
      typeId: 'customer',
      id: `customer-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    },
    projectKey: 'test-project',
    id: `notification-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    version: 1,
    sequenceNumber: 1,
    resourceVersion: 1,
    createdAt: timestamp,
    lastModifiedAt: timestamp,
    customer: customerData,
  } as const;
}

/**
 * Creates a valid Commercetools customer.updated webhook payload
 */
export function createCustomerUpdatedPayload(
  customer?: CommercetoolsCustomer
): WebhookPayload {
  const timestamp = new Date().toISOString();
  const customerData = customer ?? createBaseCustomer();

  return {
    notificationType: 'Message',
    type: 'CustomerUpdated',
    resource: {
      typeId: 'customer',
      id: `customer-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    },
    projectKey: 'test-project',
    id: `notification-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    version: 2,
    sequenceNumber: 2,
    resourceVersion: 2,
    createdAt: timestamp,
    lastModifiedAt: timestamp,
    customer: customerData,
  } as const;
}

/**
 * Creates a customer.created payload with email
 */
export function createCustomerCreatedPayloadWithEmail(
  email: string
): WebhookPayload {
  const customer = createCustomerWithEmail(email);
  return createCustomerCreatedPayload(customer);
}

/**
 * Creates a customer.updated payload with email
 */
export function createCustomerUpdatedPayloadWithEmail(
  email: string
): WebhookPayload {
  const customer = createCustomerWithEmail(email);
  return createCustomerUpdatedPayload(customer);
}

/**
 * Creates a payload from data table fields
 */
export function createPayloadFromDataTable(fields: {
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly fullName?: string;
  readonly street?: string;
  readonly city?: string;
  readonly postalCode?: string;
  readonly country?: string;
  readonly eventType?: 'customer.created' | 'customer.updated';
}): WebhookPayload {
  const customer = createCustomerFromFields(fields);
  const eventType = fields.eventType ?? 'customer.created';

  if (eventType === 'customer.created') {
    return createCustomerCreatedPayload(customer);
  }
  return createCustomerUpdatedPayload(customer);
}

/**
 * Parses data table into fields object
 */
export function parseDataTable(
  dataTable: { rawTable: ReadonlyArray<ReadonlyArray<string>> }
): {
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly fullName?: string;
  readonly street?: string;
  readonly city?: string;
  readonly postalCode?: string;
  readonly country?: string;
} {
  const rows = dataTable.rawTable;
  if (rows.length < 2) {
    throw new Error('Data table must have header and at least one row');
  }

  const headers = rows[0];
  const isKeyValueFormat =
    headers.length === 2 && headers[0] === 'field' && headers[1] === 'value';

  const fields: {
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  } = {};

  if (isKeyValueFormat) {
    // Key-value format: iterate through rows to find values
    // Use object map for better maintainability
    const fieldMap: Readonly<Record<string, keyof typeof fields>> = {
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      fullName: 'fullName',
      street: 'street',
      city: 'city',
      postalCode: 'postalCode',
      country: 'country',
    } as const;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 2) {
        const field = row[0];
        const value = row[1];
        const mappedField = fieldMap[field];
        if (mappedField !== undefined) {
          fields[mappedField] = value;
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
    if (emailIndex >= 0) {
      fields.email = dataRow[emailIndex];
    }
    if (firstNameIndex >= 0) {
      fields.firstName = dataRow[firstNameIndex];
    }
    if (lastNameIndex >= 0) {
      fields.lastName = dataRow[lastNameIndex];
    }
    if (fullNameIndex >= 0) {
      fields.fullName = dataRow[fullNameIndex];
    }
    if (streetIndex >= 0) {
      fields.street = dataRow[streetIndex];
    }
    if (cityIndex >= 0) {
      fields.city = dataRow[cityIndex];
    }
    if (postalCodeIndex >= 0) {
      fields.postalCode = dataRow[postalCodeIndex];
    }
    if (countryIndex >= 0) {
      fields.country = dataRow[countryIndex];
    }
  }

  return fields;
}

