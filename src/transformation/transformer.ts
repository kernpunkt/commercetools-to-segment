/**
 * Customer Data Transformation
 * Transforms Commercetools customer data to Segment Identify API format
 */

import type { UserTraits, Address } from '../segment/types.js';
import type {
  CommercetoolsAddress,
  CommercetoolsCustomer,
  SegmentIdentifyPayload,
} from './types.js';

/**
 * Transforms a Commercetools customer to Segment Identify API format
 *
 * @param customer - Commercetools customer resource data
 * @returns Segment Identify API payload with userId and traits
 * @remarks If email is missing, userId will be an empty string
 */
export function transformCustomerToSegment(
  customer: CommercetoolsCustomer
): SegmentIdentifyPayload {
  // Handle missing email gracefully - use empty string as placeholder
  // This allows transformation to complete even when email is missing
  const email = customer.email?.trim() ?? '';
  const userId = email; // userId is the email (or empty string if missing)

  // Extract name with priority: fullName > firstName+lastName > firstName > lastName
  const name = extractName(customer);

  // Extract address from first address if available
  const address = extractAddress(customer.addresses);

  // Build traits object
  const traits: UserTraits = {
    email,
    ...(name !== undefined && { name }),
    ...(address !== undefined && { address }),
  };

  return {
    userId,
    traits,
  };
}

/**
 * Extracts name from customer with priority: fullName > firstName+lastName > firstName > lastName
 *
 * @param customer - Commercetools customer data
 * @returns Name string or undefined if no name fields are available
 */
function extractName(customer: CommercetoolsCustomer): string | undefined {
  // Priority 1: fullName
  if (customer.fullName && customer.fullName.trim() !== '') {
    return customer.fullName.trim();
  }

  // Priority 2-4: Extract and combine firstName and lastName
  return extractNameFromFirstAndLast(customer.firstName, customer.lastName);
}

/**
 * Extracts name from firstName and lastName with priority: both > firstName > lastName
 *
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Name string or undefined if no name fields are available
 */
function extractNameFromFirstAndLast(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string | undefined {
  const first = firstName?.trim() ?? '';
  const last = lastName?.trim() ?? '';

  if (first && last) {
    return `${first} ${last}`;
  }

  if (first) {
    return first;
  }

  if (last) {
    return last;
  }

  return undefined;
}

/**
 * Extracts address from first address in addresses array
 *
 * @param addresses - Array of Commercetools addresses
 * @returns Address object or undefined if no addresses available
 */
function extractAddress(
  addresses: ReadonlyArray<CommercetoolsAddress> | null | undefined
): Address | undefined {
  // Return undefined if addresses is null, undefined, or empty
  if (!addresses || addresses.length === 0) {
    return undefined;
  }

  const firstAddress = addresses[0];
  if (!firstAddress) {
    return undefined;
  }

  // Combine streetName and streetNumber into street field
  const street = combineStreetNameAndNumber(
    firstAddress.streetName,
    firstAddress.streetNumber
  );

  // Build address object with only defined fields
  return buildAddressObject({
    street,
    city: firstAddress.city,
    postalCode: firstAddress.postalCode,
    country: firstAddress.country,
  });
}

/**
 * Address fields for building address object
 */
interface AddressFields {
  readonly street?: string | undefined;
  readonly city?: string | null | undefined;
  readonly postalCode?: string | null | undefined;
  readonly country?: string | null | undefined;
}

/**
 * Builds an address object from address fields
 *
 * @param fields - Address fields object
 * @returns Address object or undefined if all fields are empty
 */
function buildAddressObject(fields: AddressFields): Address | undefined {
  const addressParts = extractAddressParts(fields);

  if (!hasAnyAddressField(addressParts)) {
    return undefined;
  }

  return buildAddressFromParts(addressParts);
}

/**
 * Extracts and processes address parts from fields
 */
function extractAddressParts(fields: AddressFields): {
  readonly street?: string;
  readonly city?: string;
  readonly postalCode?: string;
  readonly country?: string;
} {
  const parts: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  } = {};

  if (fields.street !== undefined) {
    parts.street = fields.street;
  }

  const city = trimIfString(fields.city);
  if (city !== undefined) {
    parts.city = city;
  }

  const postalCode = trimIfString(fields.postalCode);
  if (postalCode !== undefined) {
    parts.postalCode = postalCode;
  }

  const country = trimIfString(fields.country);
  if (country !== undefined) {
    parts.country = country;
  }

  return parts;
}

/**
 * Checks if any address field is present
 */
function hasAnyAddressField(parts: {
  readonly street?: string;
  readonly city?: string;
  readonly postalCode?: string;
  readonly country?: string;
}): boolean {
  return (
    parts.street !== undefined ||
    parts.city !== undefined ||
    parts.postalCode !== undefined ||
    parts.country !== undefined
  );
}

/**
 * Builds readonly address object from parts
 */
function buildAddressFromParts(parts: {
  readonly street?: string;
  readonly city?: string;
  readonly postalCode?: string;
  readonly country?: string;
}): Address {
  return {
    ...(parts.street !== undefined && { street: parts.street }),
    ...(parts.city !== undefined && { city: parts.city }),
    ...(parts.postalCode !== undefined && {
      postalCode: parts.postalCode,
    }),
    ...(parts.country !== undefined && { country: parts.country }),
  };
}

/**
 * Trims a string value if it's a non-empty string
 *
 * @param value - String value to trim
 * @returns Trimmed string or undefined if value is null, undefined, or empty
 */
function trimIfString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed !== '' ? trimmed : undefined;
}

/**
 * Combines streetName and streetNumber into a single street string
 *
 * @param streetName - Street name
 * @param streetNumber - Street number
 * @returns Combined street string or undefined if both are missing
 */
function combineStreetNameAndNumber(
  streetName: string | null | undefined,
  streetNumber: string | null | undefined
): string | undefined {
  const name = streetName?.trim() ?? '';
  const number = streetNumber?.trim() ?? '';

  if (name && number) {
    return `${name} ${number}`;
  }

  if (name) {
    return name;
  }

  if (number) {
    return number;
  }

  return undefined;
}
