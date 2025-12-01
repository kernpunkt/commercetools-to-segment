/**
 * Vercel serverless function handler for Commercetools webhook endpoint
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateMethod,
  parseJSON,
  validatePayload
} from '../src/webhook/validator.js';
import { transformCustomerToSegment } from '../src/transformation/transformer.js';
import { sendCustomerToSegment } from '../src/integration/service.js';
import { logError, logInfo } from '../src/logger.js';
import type { CommercetoolsCustomer } from '../src/transformation/types.js';

/**
 * Extracts customer data from webhook payload
 */
function extractCustomerFromPayload(
  payload: unknown
): CommercetoolsCustomer | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const customerData = record['customer'];

  if (typeof customerData !== 'object' || customerData === null) {
    return null;
  }

  const customerRecord = customerData as Record<string, unknown>;

  const email = customerRecord['email'];
  const firstName = customerRecord['firstName'];
  const lastName = customerRecord['lastName'];
  const fullName = customerRecord['fullName'];
  const addresses = customerRecord['addresses'];

  // Helper to extract string or null value (never undefined)
  function extractStringOrNull(value: unknown): string | null {
    if (value === undefined) {
      return null; // Treat undefined as null for optional fields
    }
    return typeof value === 'string' ? value : null;
  }

  // Extract address from address record
  function extractAddress(
    addrRecord: Record<string, unknown>
  ): {
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

  // Build customer object immutably using conditional spreading
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
      addresses:
        addresses === null
          ? null
          : Array.isArray(addresses)
            ? (addresses.map((addr) => {
                if (typeof addr !== 'object' || addr === null) {
                  return {} as const;
                }
                return extractAddress(addr as Record<string, unknown>);
              }) as ReadonlyArray<{
                readonly streetName?: string | null;
                readonly streetNumber?: string | null;
                readonly city?: string | null;
                readonly postalCode?: string | null;
                readonly country?: string | null;
              }>)
            : (null as null),
    }),
  };

  return customer;
}

/**
 * Default export handler for Vercel serverless function
 * Validates webhook requests, transforms customer data, and sends to Segment
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (!validateMethod(req.method)) {
    res.status(400).json({ error: 'Method not allowed. Only POST is supported.' });
    return;
  }

  const parseResult = parseJSON(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error });
    return;
  }

  const validationResult = validatePayload(parseResult.data);
  if (!validationResult.isValid) {
    res.status(400).json({ error: validationResult.error });
    return;
  }

  // Extract customer data from payload
  const customer = extractCustomerFromPayload(parseResult.data);
  if (!customer) {
    logError('Customer data not found in webhook payload', undefined, {
      eventType: validationResult.eventType,
    });
    res.status(400).json({ error: 'Customer data not found in payload' });
    return;
  }

  // Transform customer data to Segment format
  const segmentPayload = transformCustomerToSegment(customer);

  // Validate that we have a userId (email is required)
  if (!segmentPayload.userId || segmentPayload.userId.trim() === '') {
    logError('Customer email is required but missing', undefined, {
      eventType: validationResult.eventType,
    });
    res.status(400).json({ error: 'Customer email is required' });
    return;
  }

  // Send to Segment
  logInfo('Sending customer data to Segment', {
    eventType: validationResult.eventType,
    userId: segmentPayload.userId,
  });

  const segmentResult = await sendCustomerToSegment(segmentPayload);

  if (!segmentResult.success) {
    logError('Failed to send customer data to Segment', undefined, {
      eventType: validationResult.eventType,
      userId: segmentPayload.userId,
      error: segmentResult.error?.message,
    });
    res.status(500).json({
      error: 'Failed to send data to Segment',
      details: segmentResult.error?.message,
    });
    return;
  }

  logInfo('Successfully sent customer data to Segment', {
    eventType: validationResult.eventType,
    userId: segmentPayload.userId,
  });

  res.status(200).json({
    eventType: validationResult.eventType,
    success: true,
  });
}

