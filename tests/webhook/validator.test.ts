import { describe, it, expect } from 'vitest';
import {
  validateMethod,
  parseJSON,
  validatePayload,
  identifyEventType,
} from '../../src/webhook/validator.js';
import type {
  CommercetoolsWebhookPayload,
  WebhookEventType,
} from '../../src/webhook/types.js';

describe('validateMethod', () => {
  it('should return true when method is POST', () => {
    const result = validateMethod('POST');
    expect(result).toBe(true);
  });

  it('should return false when method is GET', () => {
    const result = validateMethod('GET');
    expect(result).toBe(false);
  });

  it('should return false when method is PUT', () => {
    const result = validateMethod('PUT');
    expect(result).toBe(false);
  });

  it('should return false when method is DELETE', () => {
    const result = validateMethod('DELETE');
    expect(result).toBe(false);
  });

  it('should return false when method is PATCH', () => {
    const result = validateMethod('PATCH');
    expect(result).toBe(false);
  });

  it('should return false when method is undefined', () => {
    const result = validateMethod(undefined);
    expect(result).toBe(false);
  });

  it('should return false when method is empty string', () => {
    const result = validateMethod('');
    expect(result).toBe(false);
  });

  it('should return false when method is lowercase post', () => {
    const result = validateMethod('post');
    expect(result).toBe(false);
  });
});

describe('parseJSON', () => {
  it('should successfully parse valid JSON string', () => {
    const jsonString = '{"key":"value","number":123}';
    const result = parseJSON(jsonString);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ key: 'value', number: 123 });
    }
  });

  it('should successfully parse JSON with nested objects', () => {
    const jsonString = '{"nested":{"inner":"data"}}';
    const result = parseJSON(jsonString);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ nested: { inner: 'data' } });
    }
  });

  it('should successfully parse JSON array', () => {
    const jsonString = '[1,2,3]';
    const result = parseJSON(jsonString);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([1, 2, 3]);
    }
  });

  it('should return error for invalid JSON string', () => {
    const invalidJson = '{ invalid json }';
    const result = parseJSON(invalidJson);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    }
  });

  it('should return error for malformed JSON with unclosed bracket', () => {
    const invalidJson = '{"key":"value"';
    const result = parseJSON(invalidJson);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it('should return error for undefined body', () => {
    const result = parseJSON(undefined);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it('should return error for empty string', () => {
    const result = parseJSON('');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it('should successfully parse valid Commercetools payload JSON', () => {
    const payload = {
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
    const jsonString = JSON.stringify(payload);
    const result = parseJSON(jsonString);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(payload);
    }
  });
});

describe('validatePayload', () => {
  it('should return isValid true for valid customer.created payload', () => {
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

    const result = validatePayload(payload);

    expect(result.isValid).toBe(true);
    expect(result.eventType).toBe('customer.created');
    expect(result.error).toBeUndefined();
  });

  it('should return isValid true for valid customer.updated payload', () => {
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

    const result = validatePayload(payload);

    expect(result.isValid).toBe(true);
    expect(result.eventType).toBe('customer.updated');
    expect(result.error).toBeUndefined();
  });

  it('should return isValid false for payload missing notificationType', () => {
    const invalidPayload = {
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

    const result = validatePayload(invalidPayload);

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.eventType).toBeUndefined();
  });

  it('should return isValid false for payload missing type field', () => {
    const invalidPayload = {
      notificationType: 'Message',
      resource: { typeId: 'customer', id: 'customer-123' },
      projectKey: 'test-project',
      id: 'notification-123',
      version: 1,
      sequenceNumber: 1,
      resourceVersion: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModifiedAt: '2024-01-01T00:00:00.000Z',
    };

    const result = validatePayload(invalidPayload);

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.eventType).toBeUndefined();
  });

  it('should return isValid false for payload missing resource field', () => {
    const invalidPayload = {
      notificationType: 'Message',
      type: 'CustomerCreated',
      projectKey: 'test-project',
      id: 'notification-123',
      version: 1,
      sequenceNumber: 1,
      resourceVersion: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModifiedAt: '2024-01-01T00:00:00.000Z',
    };

    const result = validatePayload(invalidPayload);

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.eventType).toBeUndefined();
  });

  it('should return isValid false for payload with invalid notificationType', () => {
    const invalidPayload = {
      notificationType: 'InvalidType',
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

    const result = validatePayload(invalidPayload);

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.eventType).toBeUndefined();
  });

  it('should return isValid false for payload with unrecognized type', () => {
    const invalidPayload = {
      notificationType: 'Message',
      type: 'ProductCreated',
      resource: { typeId: 'product', id: 'product-123' },
      projectKey: 'test-project',
      id: 'notification-123',
      version: 1,
      sequenceNumber: 1,
      resourceVersion: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModifiedAt: '2024-01-01T00:00:00.000Z',
    };

    const result = validatePayload(invalidPayload);

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.eventType).toBeUndefined();
  });

  it('should return isValid false for null payload', () => {
    const result = validatePayload(null);

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.eventType).toBeUndefined();
  });

  it('should return isValid false for undefined payload', () => {
    const result = validatePayload(undefined);

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.eventType).toBeUndefined();
  });

  it('should return isValid false for empty object payload', () => {
    const result = validatePayload({});

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.eventType).toBeUndefined();
  });
});

describe('identifyEventType', () => {
  it('should return customer.created for CustomerCreated type', () => {
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

    const result = identifyEventType(payload);

    expect(result).toBe('customer.created');
  });

  it('should return customer.updated for CustomerUpdated type', () => {
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

    const result = identifyEventType(payload);

    expect(result).toBe('customer.updated');
  });

  it('should return undefined for unrecognized type', () => {
    const payload: CommercetoolsWebhookPayload = {
      notificationType: 'Message',
      type: 'ProductCreated',
      resource: { typeId: 'product', id: 'product-123' },
      projectKey: 'test-project',
      id: 'notification-123',
      version: 1,
      sequenceNumber: 1,
      resourceVersion: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModifiedAt: '2024-01-01T00:00:00.000Z',
    };

    const result = identifyEventType(payload);

    expect(result).toBeUndefined();
  });

  it('should return undefined for empty type string', () => {
    const payload: CommercetoolsWebhookPayload = {
      notificationType: 'Message',
      type: '',
      resource: { typeId: 'customer', id: 'customer-123' },
      projectKey: 'test-project',
      id: 'notification-123',
      version: 1,
      sequenceNumber: 1,
      resourceVersion: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModifiedAt: '2024-01-01T00:00:00.000Z',
    };

    const result = identifyEventType(payload);

    expect(result).toBeUndefined();
  });
});

