/**
 * SNS Event Adapter
 * Extracts and converts SNS events to formats compatible with existing business logic
 */

import type { SNSEvent, SNSRecord, RequestBody } from './types.js';
import type { CommercetoolsWebhookPayload } from '../webhook/types.js';

/**
 * Type guard to check if parsed message is a Commercetools payload
 */
function isCommercetoolsPayload(
  parsed: unknown
): parsed is CommercetoolsWebhookPayload {
  return (
    typeof parsed === 'object' &&
    parsed !== null &&
    'notificationType' in parsed &&
    'type' in parsed &&
    'resource' in parsed
  );
}

/**
 * Extracts Commercetools payload from SNS event
 * @param snsEvent - SNS event from AWS Lambda
 * @returns Commercetools payload or null if extraction fails
 */
export function extractCommercetoolsPayload(
  snsEvent: SNSEvent
): CommercetoolsWebhookPayload | null {
  if (snsEvent.Records.length === 0) {
    return null;
  }

  const firstRecord = snsEvent.Records[0];
  if (!firstRecord?.Sns?.Message) {
    return null;
  }

  const parsed = parseSnsMessage(firstRecord.Sns.Message);
  if (parsed === null || !isCommercetoolsPayload(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * Parses JSON string from SNS Message field
 * @param message - JSON string from SNS Message field
 * @returns Parsed object or null if parsing fails
 */
export function parseSnsMessage(message: string): unknown {
  if (message === '') {
    return null;
  }

  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
}

/**
 * Checks if SNS record is a subscription confirmation
 * @param record - SNS record to check
 * @returns true if record is subscription confirmation, false otherwise
 */
export function isSubscriptionConfirmation(record: SNSRecord): boolean {
  return record.Sns.Type === 'SubscriptionConfirmation';
}

/**
 * Converts Commercetools payload to request body format compatible with existing validator
 * @param payload - Commercetools webhook payload
 * @returns Request body format for existing validator
 */
export function convertToRequestBody(
  payload: CommercetoolsWebhookPayload
): RequestBody {
  return {
    notificationType: payload.notificationType,
    type: payload.type,
    resource: {
      typeId: payload.resource.typeId,
      id: payload.resource.id,
    },
    projectKey: payload.projectKey,
    id: payload.id,
    version: payload.version,
    sequenceNumber: payload.sequenceNumber,
    resourceVersion: payload.resourceVersion,
    createdAt: payload.createdAt,
    lastModifiedAt: payload.lastModifiedAt,
    customer: 'customer' in payload ? payload.customer : undefined,
  };
}
