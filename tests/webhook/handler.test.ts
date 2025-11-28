import { describe, it, expect, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../api/webhook.js';

/**
 * Creates a mock VercelRequest with specified method and body
 */
function createMockRequest(
  method: string,
  body?: string
): VercelRequest {
  return {
    method,
    body,
    headers: {
      'content-type': 'application/json',
    },
    query: {},
    cookies: {},
    url: '/api/webhook',
  } as VercelRequest;
}

/**
 * Creates a mock VercelResponse that captures status codes and body
 */
function createMockResponse(): VercelResponse {
  const response: {
    statusCode?: number;
    body?: string;
    headers: Record<string, string>;
    status: (code: number) => VercelResponse;
    json: (data: unknown) => VercelResponse;
    send: (data: string) => VercelResponse;
    end: () => VercelResponse;
  } = {
    headers: {},
    statusCode: undefined,
    body: undefined,
    status: function (code: number) {
      this.statusCode = code;
      return this as VercelResponse;
    },
    json: function (data: unknown) {
      this.body = JSON.stringify(data);
      return this as VercelResponse;
    },
    send: function (data: string) {
      this.body = data;
      return this as VercelResponse;
    },
    end: function () {
      return this as VercelResponse;
    },
  };
  return response as VercelResponse;
}

describe('webhook handler', () => {
  it('should return 200 status for valid POST request with customer.created payload', async () => {
    const payload = {
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
    const request = createMockRequest('POST', JSON.stringify(payload));
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(200);
  });

  it('should return 200 status for valid POST request with customer.updated payload', async () => {
    const payload = {
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
    const request = createMockRequest('POST', JSON.stringify(payload));
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(200);
  });

  it('should return 400 status for GET request', async () => {
    const request = createMockRequest('GET');
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 status for PUT request', async () => {
    const request = createMockRequest('PUT');
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 status for DELETE request', async () => {
    const request = createMockRequest('DELETE');
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 status for PATCH request', async () => {
    const request = createMockRequest('PATCH');
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 status for POST request with undefined body', async () => {
    const request = createMockRequest('POST', undefined);
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 status for POST request with invalid JSON', async () => {
    const request = createMockRequest('POST', '{ invalid json }');
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 status for POST request with malformed JSON', async () => {
    const request = createMockRequest('POST', '{"key":"value"');
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 status for POST request with missing required fields', async () => {
    const invalidPayload = {
      resource: { typeId: 'customer', id: 'customer-123' },
      // Missing: notificationType, type, projectKey, etc.
    };
    const request = createMockRequest('POST', JSON.stringify(invalidPayload));
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 status for POST request with invalid notificationType', async () => {
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
    const request = createMockRequest('POST', JSON.stringify(invalidPayload));
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 status for POST request with unrecognized event type', async () => {
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
    const request = createMockRequest('POST', JSON.stringify(invalidPayload));
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 status for POST request with empty body string', async () => {
    const request = createMockRequest('POST', '');
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 status for POST request with null body', async () => {
    const request = createMockRequest('POST', null as unknown as string);
    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(400);
  });
});

