/**
 * Webhook request validation functions
 */

import type {
  CommercetoolsWebhookPayload,
  WebhookEventType,
  WebhookValidationResult,
} from './types.js';

/**
 * Validates that the HTTP method is POST
 * @param method - HTTP method string
 * @returns true if method is POST, false otherwise
 */
export function validateMethod(method: string | undefined): boolean {
  return method === 'POST';
}

/**
 * Parses JSON string and returns result or error
 * @param body - JSON string to parse
 * @returns Object with parsed data or error
 */
export function parseJSON(
  body: string | undefined
): { success: true; data: unknown } | { success: false; error: string } {
  if (body === undefined || body === null || body === '') {
    return { success: false, error: 'Request body is required' };
  }

  try {
    const data: unknown = JSON.parse(body);
    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Invalid JSON format';
    return { success: false, error: errorMessage };
  }
}

/**
 * Type guard to check if value is a record (object)
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Validates notificationType field
 */
function validateNotificationType(
  payload: Record<string, unknown>
): { isValid: false; error: string } | { isValid: true } {
  if (payload['notificationType'] !== 'Message') {
    return {
      isValid: false,
      error: 'Invalid notificationType: must be "Message"',
    };
  }
  return { isValid: true };
}

/**
 * Validates type field
 */
function validateTypeField(
  payload: Record<string, unknown>
): { isValid: false; error: string } | { isValid: true; type: string } {
  if (typeof payload['type'] !== 'string' || payload['type'] === '') {
    return { isValid: false, error: 'Missing or invalid type field' };
  }
  return { isValid: true, type: payload['type'] as string };
}

/**
 * Validates resource field
 */
function validateResourceField(
  payload: Record<string, unknown>
): { isValid: false; error: string } | { isValid: true; resource: { typeId: string; id: string } } {
  const resource = payload['resource'];
  if (!isRecord(resource)) {
    return { isValid: false, error: 'Missing or invalid resource field' };
  }
  if (
    typeof resource['typeId'] !== 'string' ||
    typeof resource['id'] !== 'string'
  ) {
    return {
      isValid: false,
      error: 'Resource must have typeId and id fields',
    };
  }
  return { 
    isValid: true, 
    resource: {
      typeId: resource['typeId'] as string,
      id: resource['id'] as string,
    }
  };
}

/**
 * Validates all required fields and returns typed payload
 */
function validateAndExtractPayload(
  payload: Record<string, unknown>,
  type: string,
  resource: { typeId: string; id: string }
): { isValid: false; error: string } | { isValid: true; payload: CommercetoolsWebhookPayload } {
  if (typeof payload['projectKey'] !== 'string') {
    return { isValid: false, error: 'Missing or invalid projectKey field' };
  }
  if (typeof payload['id'] !== 'string') {
    return { isValid: false, error: 'Missing or invalid id field' };
  }
  if (typeof payload['version'] !== 'number') {
    return { isValid: false, error: 'Missing or invalid version field' };
  }
  if (typeof payload['sequenceNumber'] !== 'number') {
    return { isValid: false, error: 'Missing or invalid sequenceNumber field' };
  }
  if (typeof payload['resourceVersion'] !== 'number') {
    return { isValid: false, error: 'Missing or invalid resourceVersion field' };
  }
  if (typeof payload['createdAt'] !== 'string') {
    return { isValid: false, error: 'Missing or invalid createdAt field' };
  }
  if (typeof payload['lastModifiedAt'] !== 'string') {
    return { isValid: false, error: 'Missing or invalid lastModifiedAt field' };
  }

  const commercetoolsPayload: CommercetoolsWebhookPayload = {
    notificationType: 'Message',
    type,
    resource,
    projectKey: payload['projectKey'] as string,
    id: payload['id'] as string,
    version: payload['version'] as number,
    sequenceNumber: payload['sequenceNumber'] as number,
    resourceVersion: payload['resourceVersion'] as number,
    createdAt: payload['createdAt'] as string,
    lastModifiedAt: payload['lastModifiedAt'] as string,
  };

  return { isValid: true, payload: commercetoolsPayload };
}

/**
 * Validates payload structure against Commercetools webhook format
 * @param payload - Parsed JSON payload
 * @returns Validation result with isValid flag and optional eventType or error
 */
export function validatePayload(payload: unknown): WebhookValidationResult {
  if (payload === null || payload === undefined) {
    return { isValid: false, error: 'Payload is required' };
  }

  if (!isRecord(payload)) {
    return { isValid: false, error: 'Payload must be an object' };
  }

  const notificationTypeResult = validateNotificationType(payload);
  if (!notificationTypeResult.isValid) {
    return notificationTypeResult;
  }

  const typeResult = validateTypeField(payload);
  if (!typeResult.isValid) {
    return typeResult;
  }

  const resourceResult = validateResourceField(payload);
  if (!resourceResult.isValid) {
    return resourceResult;
  }

  // Validate and extract all required fields
  const payloadResult = validateAndExtractPayload(
    payload,
    typeResult.type,
    resourceResult.resource
  );
  if (!payloadResult.isValid) {
    return payloadResult;
  }

  const eventType = identifyEventType(payloadResult.payload);

  if (eventType === undefined) {
    return {
      isValid: false,
      error: `Unrecognized event type: ${typeResult.type}`,
    };
  }

  return { isValid: true, eventType };
}

/**
 * Identifies event type from validated payload
 * Maps Commercetools type field to WebhookEventType
 * @param payload - Validated Commercetools webhook payload
 * @returns Event type string or undefined if not recognized
 */
export function identifyEventType(
  payload: CommercetoolsWebhookPayload
): WebhookEventType | undefined {
  if (payload.type === 'CustomerCreated') {
    return 'customer.created';
  }
  if (payload.type === 'CustomerUpdated') {
    return 'customer.updated';
  }
  return undefined;
}
