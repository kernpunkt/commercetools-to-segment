/**
 * Customer extraction utilities for Lambda handler
 * Extracts customer data from webhook payloads
 */

import type { CommercetoolsCustomer } from '../transformation/types.js';

/**
 * Type guard to check if value is a record
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Helper to extract string or null value (never undefined)
 */
function extractStringOrNull(value: unknown): string | null {
  if (value === undefined) {
    return null;
  }
  return typeof value === 'string' ? value : null;
}

/**
 * Extract address from address record
 */
function extractAddress(addrRecord: Record<string, unknown>): {
  readonly streetName?: string | null;
  readonly streetNumber?: string | null;
  readonly city?: string | null;
  readonly postalCode?: string | null;
  readonly country?: string | null;
} {
  const addr: {
    streetName?: string | null;
    streetNumber?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
  } = {};

  if (addrRecord['streetName'] !== undefined) {
    addr.streetName = extractStringOrNull(addrRecord['streetName']);
  }

  if (addrRecord['streetNumber'] !== undefined) {
    addr.streetNumber = extractStringOrNull(addrRecord['streetNumber']);
  }

  if (addrRecord['city'] !== undefined) {
    addr.city = extractStringOrNull(addrRecord['city']);
  }

  if (addrRecord['postalCode'] !== undefined) {
    addr.postalCode = extractStringOrNull(addrRecord['postalCode']);
  }

  if (addrRecord['country'] !== undefined) {
    addr.country = extractStringOrNull(addrRecord['country']);
  }

  return addr;
}

/**
 * Extract addresses array from customer record
 */
function extractAddresses(addresses: unknown): ReadonlyArray<{
  readonly streetName?: string | null;
  readonly streetNumber?: string | null;
  readonly city?: string | null;
  readonly postalCode?: string | null;
  readonly country?: string | null;
}> | null {
  if (addresses === null) {
    return null;
  }

  if (!Array.isArray(addresses)) {
    return null;
  }

  return addresses.map(addr => {
    if (!isRecord(addr)) {
      return {} as const;
    }
    return extractAddress(addr);
  });
}

/**
 * Extracts customer data from webhook payload
 * Reused from webhook handler for consistency
 */
export function extractCustomerFromPayload(
  payload: unknown
): CommercetoolsCustomer | null {
  if (!isRecord(payload)) {
    return null;
  }

  const customerData = payload['customer'];
  if (!isRecord(customerData)) {
    return null;
  }

  const email = customerData['email'];
  const firstName = customerData['firstName'];
  const lastName = customerData['lastName'];
  const fullName = customerData['fullName'];
  const addresses = customerData['addresses'];

  const customer: CommercetoolsCustomer = {
    ...(email !== undefined && {
      email: extractStringOrNull(email),
    }),
    ...(firstName !== undefined && {
      firstName: extractStringOrNull(firstName),
    }),
    ...(lastName !== undefined && {
      lastName: extractStringOrNull(lastName),
    }),
    ...(fullName !== undefined && {
      fullName: extractStringOrNull(fullName),
    }),
    ...(addresses !== undefined && {
      addresses: extractAddresses(addresses),
    }),
  };

  return customer;
}

