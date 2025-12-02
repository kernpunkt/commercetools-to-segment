import { describe, it, expect } from 'vitest';
import {
  extractCommercetoolsPayload,
  parseSnsMessage,
  isSubscriptionConfirmation,
  convertToRequestBody,
} from '../../src/lambda/adapter.js';
import type { SNSEvent, SNSRecord } from '../../src/lambda/types.js';
import type { CommercetoolsWebhookPayload } from '../../src/webhook/types.js';
import {
  createSnsEventWithCustomerCreated,
  createSnsEventWithCustomerUpdated,
  createSnsSubscriptionConfirmationEvent,
  createSnsEventWithMessage,
  type SNSEvent as TestSNSEvent,
} from '../utils/sns-event-builder.js';
import { createCustomerCreatedPayload } from '../utils/webhook-payload-builder.js';

describe('extractCommercetoolsPayload', () => {
  it('should extract Commercetools payload from SNS event with customer.created', () => {
    const payload = createCustomerCreatedPayload();
    const snsEvent = createSnsEventWithCustomerCreated(payload);

    const result = extractCommercetoolsPayload(snsEvent as SNSEvent);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.notificationType).toBe('Message');
      expect(result.type).toBe('CustomerCreated');
      expect(result.resource.typeId).toBe('customer');
      expect(result.resource.id).toBe(payload.resource.id);
    }
  });

  it('should extract Commercetools payload from SNS event with customer.updated', () => {
    const payload = {
      notificationType: 'Message' as const,
      type: 'CustomerUpdated',
      resource: {
        typeId: 'customer' as const,
        id: 'updated-customer-id',
      },
      projectKey: 'test-project',
      id: 'notification-456',
      version: 2,
      sequenceNumber: 2,
      resourceVersion: 2,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModifiedAt: '2024-01-02T00:00:00.000Z',
    };
    const snsEvent = createSnsEventWithCustomerUpdated(payload);

    const result = extractCommercetoolsPayload(snsEvent as SNSEvent);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.type).toBe('CustomerUpdated');
      expect(result.resource.id).toBe('updated-customer-id');
    }
  });

  it('should return null when SNS event has no records', () => {
    const snsEvent: SNSEvent = {
      Records: [],
    };

    const result = extractCommercetoolsPayload(snsEvent);

    expect(result).toBeNull();
  });

  it('should return null when SNS Message field contains invalid JSON', () => {
    const snsEvent = createSnsEventWithMessage('invalid json {', 'Notification');

    const result = extractCommercetoolsPayload(snsEvent as SNSEvent);

    expect(result).toBeNull();
  });

  it('should return null when SNS Message field is empty', () => {
    const snsEvent = createSnsEventWithMessage('', 'Notification');

    const result = extractCommercetoolsPayload(snsEvent as SNSEvent);

    expect(result).toBeNull();
  });

  it('should extract payload from first record when multiple records exist', () => {
    const payload1 = createCustomerCreatedPayload();
    const payload2 = {
      notificationType: 'Message' as const,
      type: 'CustomerUpdated',
      resource: {
        typeId: 'customer' as const,
        id: 'second-customer-id',
      },
      projectKey: 'test-project',
      id: 'notification-789',
      version: 1,
      sequenceNumber: 1,
      resourceVersion: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModifiedAt: '2024-01-01T00:00:00.000Z',
    };
    const snsEvent1 = createSnsEventWithCustomerCreated(payload1);
    const snsEvent2 = createSnsEventWithCustomerUpdated(payload2);
    const snsEvent: SNSEvent = {
      Records: [
        ...(snsEvent1 as SNSEvent).Records,
        ...(snsEvent2 as SNSEvent).Records,
      ],
    };

    const result = extractCommercetoolsPayload(snsEvent);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.type).toBe('CustomerCreated');
      expect(result.resource.id).toBe(payload1.resource.id);
    }
  });

  it('should return null when SNS Message contains non-Commercetools payload', () => {
    const nonCommercetoolsPayload = {
      someOtherService: 'data',
      value: 123,
    };
    const message = JSON.stringify(nonCommercetoolsPayload);
    const snsEvent = createSnsEventWithMessage(message, 'Notification');

    const result = extractCommercetoolsPayload(snsEvent as SNSEvent);

    expect(result).toBeNull();
  });
});

describe('parseSnsMessage', () => {
  it('should parse valid JSON string from SNS Message field', () => {
    const payload = {
      notificationType: 'Message',
      type: 'CustomerCreated',
      resource: { typeId: 'customer', id: 'test-id' },
    };
    const message = JSON.stringify(payload);

    const result = parseSnsMessage(message);

    expect(result).toEqual(payload);
  });

  it('should parse JSON with nested objects', () => {
    const payload = {
      nested: {
        inner: {
          value: 'test',
        },
      },
    };
    const message = JSON.stringify(payload);

    const result = parseSnsMessage(message);

    expect(result).toEqual(payload);
  });

  it('should parse JSON array', () => {
    const payload = [1, 2, 3];
    const message = JSON.stringify(payload);

    const result = parseSnsMessage(message);

    expect(result).toEqual(payload);
  });

  it('should return null when message is invalid JSON', () => {
    const invalidJson = '{ invalid json }';

    const result = parseSnsMessage(invalidJson);

    expect(result).toBeNull();
  });

  it('should return null when message is empty string', () => {
    const result = parseSnsMessage('');

    expect(result).toBeNull();
  });

  it('should return null when message has unclosed bracket', () => {
    const invalidJson = '{"key":"value"';

    const result = parseSnsMessage(invalidJson);

    expect(result).toBeNull();
  });

  it('should parse valid Commercetools payload JSON', () => {
    const payload: CommercetoolsWebhookPayload = {
      notificationType: 'Message',
      type: 'CustomerCreated',
      resource: { typeId: 'customer', id: 'test-id' },
      projectKey: 'test-project',
      id: 'notification-id',
      version: 1,
      sequenceNumber: 1,
      resourceVersion: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModifiedAt: '2024-01-01T00:00:00.000Z',
    };
    const message = JSON.stringify(payload);

    const result = parseSnsMessage(message);

    expect(result).toEqual(payload);
  });
});

describe('isSubscriptionConfirmation', () => {
  it('should return true when SNS record has Type SubscriptionConfirmation', () => {
    const snsEvent = createSnsSubscriptionConfirmationEvent();
    const record = (snsEvent as SNSEvent).Records[0];

    if (!record) {
      throw new Error('Record should exist');
    }

    const result = isSubscriptionConfirmation(record);

    expect(result).toBe(true);
  });

  it('should return false when SNS record has Type Notification', () => {
    const payload = createCustomerCreatedPayload();
    const snsEvent = createSnsEventWithCustomerCreated(payload);
    const record = (snsEvent as SNSEvent).Records[0];

    if (!record) {
      throw new Error('Record should exist');
    }

    const result = isSubscriptionConfirmation(record);

    expect(result).toBe(false);
  });

  it('should return false when SNS record Type is Notification with customer.updated payload', () => {
    const payload = {
      notificationType: 'Message' as const,
      type: 'CustomerUpdated',
      resource: {
        typeId: 'customer' as const,
        id: 'test-id',
      },
      projectKey: 'test-project',
      id: 'notification-id',
      version: 1,
      sequenceNumber: 1,
      resourceVersion: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModifiedAt: '2024-01-01T00:00:00.000Z',
    };
    const snsEvent = createSnsEventWithCustomerUpdated(payload);
    const record = (snsEvent as SNSEvent).Records[0];

    if (!record) {
      throw new Error('Record should exist');
    }

    const result = isSubscriptionConfirmation(record);

    expect(result).toBe(false);
  });
});

describe('convertToRequestBody', () => {
  it('should convert Commercetools payload to request body format', () => {
    const payload: CommercetoolsWebhookPayload = {
      notificationType: 'Message',
      type: 'CustomerCreated',
      resource: { typeId: 'customer', id: 'customer-123' },
      projectKey: 'test-project',
      id: 'notification-123',
      version: 1,
      sequenceNumber: 1,
      resourceVersion: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModifiedAt: '2024-01-01T00:00:00.000Z',
    };

    const result = convertToRequestBody(payload);

    expect(result.notificationType).toBe('Message');
    expect(result.type).toBe('CustomerCreated');
    expect(result.resource.typeId).toBe('customer');
    expect(result.resource.id).toBe('customer-123');
    expect(result.projectKey).toBe('test-project');
    expect(result.id).toBe('notification-123');
    expect(result.version).toBe(1);
    expect(result.sequenceNumber).toBe(1);
    expect(result.resourceVersion).toBe(1);
    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(result.lastModifiedAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should convert customer.updated payload to request body format', () => {
    const payload: CommercetoolsWebhookPayload = {
      notificationType: 'Message',
      type: 'CustomerUpdated',
      resource: { typeId: 'customer', id: 'customer-456' },
      projectKey: 'test-project',
      id: 'notification-456',
      version: 2,
      sequenceNumber: 2,
      resourceVersion: 2,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModifiedAt: '2024-01-02T00:00:00.000Z',
    };

    const result = convertToRequestBody(payload);

    expect(result.type).toBe('CustomerUpdated');
    expect(result.resource.id).toBe('customer-456');
    expect(result.version).toBe(2);
    expect(result.sequenceNumber).toBe(2);
  });

  it('should preserve all required fields in request body format', () => {
    const payload: CommercetoolsWebhookPayload = {
      notificationType: 'Message',
      type: 'CustomerCreated',
      resource: { typeId: 'customer', id: 'test-id' },
      projectKey: 'my-project',
      id: 'my-notification',
      version: 5,
      sequenceNumber: 10,
      resourceVersion: 3,
      createdAt: '2024-12-01T12:00:00.000Z',
      lastModifiedAt: '2024-12-01T13:00:00.000Z',
    };

    const result = convertToRequestBody(payload);

    expect(result).toEqual({
      notificationType: 'Message',
      type: 'CustomerCreated',
      resource: { typeId: 'customer', id: 'test-id' },
      projectKey: 'my-project',
      id: 'my-notification',
      version: 5,
      sequenceNumber: 10,
      resourceVersion: 3,
      createdAt: '2024-12-01T12:00:00.000Z',
      lastModifiedAt: '2024-12-01T13:00:00.000Z',
    });
  });
});

