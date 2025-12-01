import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendWebhookRequest, parseJsonResponse } from './http-client.js';

// Mock global fetch
global.fetch = vi.fn();

describe('http-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendWebhookRequest', () => {
    it('should send POST request with JSON payload to URL', async () => {
      const url = 'http://localhost:3000/api/webhook';
      const payload = {
        type: 'CustomerCreated',
        customer: { email: 'test@example.com' },
      };

      const mockResponse = {
        status: 200,
        text: async () => '{"success": true}',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

      const result = await sendWebhookRequest(url, payload);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      expect(result.statusCode).toBe(200);
    });

    it('should return response with status code 200 for successful request', async () => {
      const url = 'http://localhost:3000/api/webhook';
      const payload = { type: 'CustomerCreated' };

      const mockResponse = {
        status: 200,
        text: async () => '{"success": true}',
        headers: new Headers(),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

      const result = await sendWebhookRequest(url, payload);

      expect(result.statusCode).toBe(200);
    });

    it('should return response with status code 400 for bad request', async () => {
      const url = 'http://localhost:3000/api/webhook';
      const payload = { invalid: 'payload' };

      const mockResponse = {
        status: 400,
        text: async () => '{"error": "Bad Request"}',
        headers: new Headers(),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

      const result = await sendWebhookRequest(url, payload);

      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('{"error": "Bad Request"}');
    });

    it('should return response with status code 500 for server error', async () => {
      const url = 'http://localhost:3000/api/webhook';
      const payload = { type: 'CustomerCreated' };

      const mockResponse = {
        status: 500,
        text: async () => '{"error": "Internal Server Error"}',
        headers: new Headers(),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

      const result = await sendWebhookRequest(url, payload);

      expect(result.statusCode).toBe(500);
    });

    it('should return response body as string', async () => {
      const url = 'http://localhost:3000/api/webhook';
      const payload = { type: 'CustomerCreated' };
      const responseBody = '{"eventType": "customer.created", "success": true}';

      const mockResponse = {
        status: 200,
        text: async () => responseBody,
        headers: new Headers(),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

      const result = await sendWebhookRequest(url, payload);

      expect(result.body).toBe(responseBody);
    });

    it('should return response headers as object', async () => {
      const url = 'http://localhost:3000/api/webhook';
      const payload = { type: 'CustomerCreated' };

      const mockHeaders = new Headers();
      mockHeaders.set('Content-Type', 'application/json');
      mockHeaders.set('X-Custom-Header', 'custom-value');

      const mockResponse = {
        status: 200,
        text: async () => '{}',
        headers: mockHeaders,
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

      const result = await sendWebhookRequest(url, payload);

      expect(result.headers['content-type']).toBe('application/json');
      expect(result.headers['x-custom-header']).toBe('custom-value');
    });

    it('should stringify payload as JSON in request body', async () => {
      const url = 'http://localhost:3000/api/webhook';
      const payload = {
        type: 'CustomerCreated',
        customer: {
          email: 'test@example.com',
          firstName: 'John',
        },
      };

      const mockResponse = {
        status: 200,
        text: async () => '{}',
        headers: new Headers(),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

      await sendWebhookRequest(url, payload);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const requestInit = callArgs[1] as RequestInit;
      const bodyString = requestInit.body as string;

      expect(JSON.parse(bodyString)).toEqual(payload);
    });

    it('should handle network errors', async () => {
      const url = 'http://localhost:3000/api/webhook';
      const payload = { type: 'CustomerCreated' };

      vi.mocked(global.fetch).mockRejectedValue(new Error('fetch failed'));

      await expect(sendWebhookRequest(url, payload)).rejects.toThrow(
        'Network error while sending webhook'
      );
    });

    it('should handle timeout errors', async () => {
      const url = 'http://localhost:3000/api/webhook';
      const payload = { type: 'CustomerCreated' };

      // Mock a fetch that never resolves (simulating timeout)
      vi.mocked(global.fetch).mockImplementation(
        () =>
          new Promise(() => {
            // Never resolves, will timeout
          })
      );

      await expect(
        sendWebhookRequest(url, payload, { timeout: 10 })
      ).rejects.toThrow('timed out');
    });

    it('should validate URL format and reject invalid URLs', async () => {
      const invalidUrl = 'not-a-valid-url';
      const payload = { type: 'CustomerCreated' };

      await expect(sendWebhookRequest(invalidUrl, payload)).rejects.toThrow(
        'Invalid URL format'
      );
    });

    it('should reject URLs with invalid protocols', async () => {
      const invalidUrl = 'file:///etc/passwd';
      const payload = { type: 'CustomerCreated' };

      await expect(sendWebhookRequest(invalidUrl, payload)).rejects.toThrow(
        'Invalid protocol'
      );
    });

    it('should accept custom timeout configuration', async () => {
      const url = 'http://localhost:3000/api/webhook';
      const payload = { type: 'CustomerCreated' };

      const mockResponse = {
        status: 200,
        text: async () => '{}',
        headers: new Headers(),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

      const result = await sendWebhookRequest(url, payload, { timeout: 5000 });

      expect(result.statusCode).toBe(200);
    });

    it('should send request to different URLs', async () => {
      const url1 = 'http://localhost:3000/api/webhook';
      const url2 = 'https://example.vercel.app/api/webhook';
      const payload = { type: 'CustomerCreated' };

      const mockResponse = {
        status: 200,
        text: async () => '{}',
        headers: new Headers(),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

      await sendWebhookRequest(url1, payload);
      await sendWebhookRequest(url2, payload);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(vi.mocked(global.fetch).mock.calls[0][0]).toBe(url1);
      expect(vi.mocked(global.fetch).mock.calls[1][0]).toBe(url2);
    });
  });

  describe('parseJsonResponse', () => {
    it('should parse valid JSON string', () => {
      const jsonString = '{"success": true, "eventType": "customer.created"}';

      const result = parseJsonResponse(jsonString);

      expect(result).toEqual({
        success: true,
        eventType: 'customer.created',
      });
    });

    it('should parse JSON with nested objects', () => {
      const jsonString =
        '{"success": true, "data": {"userId": "user@example.com", "traits": {"email": "user@example.com"}}}';

      const result = parseJsonResponse(jsonString);

      expect(result).toEqual({
        success: true,
        data: {
          userId: 'user@example.com',
          traits: {
            email: 'user@example.com',
          },
        },
      });
    });

    it('should parse JSON with arrays', () => {
      const jsonString = '{"items": [1, 2, 3], "names": ["John", "Jane"]}';

      const result = parseJsonResponse(jsonString);

      expect(result).toEqual({
        items: [1, 2, 3],
        names: ['John', 'Jane'],
      });
    });

    it('should parse empty JSON object', () => {
      const jsonString = '{}';

      const result = parseJsonResponse(jsonString);

      expect(result).toEqual({});
    });

    it('should parse JSON with null values', () => {
      const jsonString = '{"value": null, "other": "test"}';

      const result = parseJsonResponse(jsonString);

      expect(result).toEqual({
        value: null,
        other: 'test',
      });
    });

    it('should throw error for invalid JSON string', () => {
      const invalidJson = '{invalid json}';

      expect(() => parseJsonResponse(invalidJson)).toThrow('Failed to parse JSON response');
    });

    it('should throw error with message containing original error', () => {
      const invalidJson = '{invalid json}';

      try {
        parseJsonResponse(invalidJson);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain('Failed to parse JSON response');
        }
      }
    });

    it('should throw error for empty string', () => {
      expect(() => parseJsonResponse('')).toThrow('Failed to parse JSON response');
    });

    it('should throw error for malformed JSON with missing quotes', () => {
      const malformedJson = '{key: value}';

      expect(() => parseJsonResponse(malformedJson)).toThrow('Failed to parse JSON response');
    });

    it('should parse JSON with special characters', () => {
      const jsonString = '{"message": "Hello, \\"world\\"!", "path": "/api/webhook"}';

      const result = parseJsonResponse(jsonString);

      expect(result).toEqual({
        message: 'Hello, "world"!',
        path: '/api/webhook',
      });
    });
  });
});

