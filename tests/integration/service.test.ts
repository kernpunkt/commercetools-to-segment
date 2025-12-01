import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendCustomerToSegment,
  sendCustomerToSegmentWithClient,
} from '../../src/integration/service.js';
import type { SegmentClient } from '../../src/segment/types.js';
import type { SegmentIdentifyPayload } from '../../src/transformation/types.js';
import type { SegmentIntegrationResult } from '../../src/integration/types.js';
import { getSegmentClientFromEnvironment } from '../../src/segment/client.js';

// Mock the Segment client module
vi.mock('../../src/segment/client.js', () => ({
  getSegmentClientFromEnvironment: vi.fn(),
}));

describe('sendCustomerToSegmentWithClient', () => {
  let mockClient: SegmentClient;
  let payload: SegmentIdentifyPayload;

  beforeEach(() => {
    // Create a fresh mock client for each test
    mockClient = {
      identify: vi.fn().mockResolvedValue(undefined),
      flush: vi.fn().mockResolvedValue(undefined),
      closeAndFlush: vi.fn().mockResolvedValue(undefined),
    };

    // Create a valid payload for testing
    payload = {
      userId: 'user@example.com',
      traits: {
        email: 'user@example.com',
        name: 'John Doe',
      },
    };
  });

  describe('Success paths', () => {
    it('should return success result when identify and flush succeed', async () => {
      mockClient.identify = vi.fn().mockResolvedValue(undefined);
      mockClient.flush = vi.fn().mockResolvedValue(undefined);

      const result = await sendCustomerToSegmentWithClient(mockClient, payload);

      expect(result).toEqual({ success: true });
      expect(mockClient.identify).toHaveBeenCalledTimes(1);
      expect(mockClient.identify).toHaveBeenCalledWith({
        userId: 'user@example.com',
        traits: {
          email: 'user@example.com',
          name: 'John Doe',
        },
      });
      expect(mockClient.flush).toHaveBeenCalledTimes(1);
    });

    it('should call identify with correct userId from payload', async () => {
      const payloadWithUserId: SegmentIdentifyPayload = {
        userId: 'test-user-123',
        traits: {
          email: 'test@example.com',
        },
      };

      await sendCustomerToSegmentWithClient(mockClient, payloadWithUserId);

      expect(mockClient.identify).toHaveBeenCalledWith({
        userId: 'test-user-123',
        traits: {
          email: 'test@example.com',
        },
      });
    });

    it('should call identify with all traits from payload', async () => {
      const payloadWithAllTraits: SegmentIdentifyPayload = {
        userId: 'user@example.com',
        traits: {
          email: 'user@example.com',
          name: 'Jane Smith',
          address: {
            street: '123 Main St',
            city: 'New York',
            postalCode: '10001',
            country: 'US',
          },
        },
      };

      await sendCustomerToSegmentWithClient(mockClient, payloadWithAllTraits);

      expect(mockClient.identify).toHaveBeenCalledWith({
        userId: 'user@example.com',
        traits: {
          email: 'user@example.com',
          name: 'Jane Smith',
          address: {
            street: '123 Main St',
            city: 'New York',
            postalCode: '10001',
            country: 'US',
          },
        },
      });
    });

    it('should call flush after identify completes', async () => {
      let identifyResolved = false;
      mockClient.identify = vi.fn().mockImplementation(async () => {
        identifyResolved = true;
      });
      mockClient.flush = vi.fn().mockImplementation(async () => {
        expect(identifyResolved).toBe(true);
      });

      await sendCustomerToSegmentWithClient(mockClient, payload);

      // Verify both were called and identify was called first
      expect(mockClient.identify).toHaveBeenCalledTimes(1);
      expect(mockClient.flush).toHaveBeenCalledTimes(1);
      expect(identifyResolved).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should return error result when identify throws error', async () => {
      const errorMessage = 'Segment API error';
      mockClient.identify = vi
        .fn()
        .mockRejectedValue(new Error(errorMessage));

      const result = await sendCustomerToSegmentWithClient(mockClient, payload);

      expect(result).toEqual({
        success: false,
        error: {
          message: errorMessage,
        },
      });
      expect(mockClient.flush).not.toHaveBeenCalled();
    });

    it('should wrap identify error in SegmentError with message', async () => {
      const originalError = new Error('Network timeout');
      mockClient.identify = vi.fn().mockRejectedValue(originalError);

      const result = await sendCustomerToSegmentWithClient(mockClient, payload);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Network timeout');
      }
    });

    it('should return error result when flush throws error', async () => {
      const errorMessage = 'Flush failed';
      mockClient.identify = vi.fn().mockResolvedValue(undefined);
      mockClient.flush = vi.fn().mockRejectedValue(new Error(errorMessage));

      const result = await sendCustomerToSegmentWithClient(mockClient, payload);

      expect(result).toEqual({
        success: false,
        error: {
          message: errorMessage,
        },
      });
    });

    it('should preserve error message from identify error', async () => {
      const customErrorMessage = 'Invalid userId provided';
      mockClient.identify = vi
        .fn()
        .mockRejectedValue(new Error(customErrorMessage));

      const result = await sendCustomerToSegmentWithClient(mockClient, payload);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(customErrorMessage);
      }
    });

    it('should handle non-Error objects thrown by identify', async () => {
      const errorString = 'String error';
      mockClient.identify = vi.fn().mockRejectedValue(errorString);

      const result = await sendCustomerToSegmentWithClient(mockClient, payload);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(String(errorString));
      }
    });

    it('should not throw exceptions, only return error results', async () => {
      mockClient.identify = vi
        .fn()
        .mockRejectedValue(new Error('Should be caught'));

      await expect(
        sendCustomerToSegmentWithClient(mockClient, payload)
      ).resolves.toBeDefined();

      const result = await sendCustomerToSegmentWithClient(mockClient, payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Client injection', () => {
    it('should use provided client instead of environment client', async () => {
      const injectedClient: SegmentClient = {
        identify: vi.fn().mockResolvedValue(undefined),
        flush: vi.fn().mockResolvedValue(undefined),
        closeAndFlush: vi.fn().mockResolvedValue(undefined),
      };

      await sendCustomerToSegmentWithClient(injectedClient, payload);

      expect(injectedClient.identify).toHaveBeenCalledTimes(1);
      expect(injectedClient.flush).toHaveBeenCalledTimes(1);
    });

    it('should work with different client instances', async () => {
      const client1: SegmentClient = {
        identify: vi.fn().mockResolvedValue(undefined),
        flush: vi.fn().mockResolvedValue(undefined),
        closeAndFlush: vi.fn().mockResolvedValue(undefined),
      };
      const client2: SegmentClient = {
        identify: vi.fn().mockResolvedValue(undefined),
        flush: vi.fn().mockResolvedValue(undefined),
        closeAndFlush: vi.fn().mockResolvedValue(undefined),
      };

      await sendCustomerToSegmentWithClient(client1, payload);
      await sendCustomerToSegmentWithClient(client2, payload);

      expect(client1.identify).toHaveBeenCalledTimes(1);
      expect(client2.identify).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle payload with minimal traits (email only)', async () => {
      const minimalPayload: SegmentIdentifyPayload = {
        userId: 'user@example.com',
        traits: {
          email: 'user@example.com',
        },
      };

      await sendCustomerToSegmentWithClient(mockClient, minimalPayload);

      expect(mockClient.identify).toHaveBeenCalledWith({
        userId: 'user@example.com',
        traits: {
          email: 'user@example.com',
        },
      });
    });

    it('should handle payload with empty userId string', async () => {
      const payloadWithEmptyUserId: SegmentIdentifyPayload = {
        userId: '',
        traits: {
          email: 'user@example.com',
        },
      };

      await sendCustomerToSegmentWithClient(
        mockClient,
        payloadWithEmptyUserId
      );

      expect(mockClient.identify).toHaveBeenCalledWith({
        userId: '',
        traits: {
          email: 'user@example.com',
        },
      });
    });

    it('should handle payload with address but no name', async () => {
      const payloadWithAddress: SegmentIdentifyPayload = {
        userId: 'user@example.com',
        traits: {
          email: 'user@example.com',
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            postalCode: '90001',
            country: 'US',
          },
        },
      };

      await sendCustomerToSegmentWithClient(mockClient, payloadWithAddress);

      expect(mockClient.identify).toHaveBeenCalledWith({
        userId: 'user@example.com',
        traits: {
          email: 'user@example.com',
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            postalCode: '90001',
            country: 'US',
          },
        },
      });
    });
  });
});

describe('sendCustomerToSegment', () => {
  let mockClient: SegmentClient;
  let payload: SegmentIdentifyPayload;

  beforeEach(() => {
    // Clear mock call history before each test
    vi.mocked(getSegmentClientFromEnvironment).mockClear();

    // Create a fresh mock client for each test
    mockClient = {
      identify: vi.fn().mockResolvedValue(undefined),
      flush: vi.fn().mockResolvedValue(undefined),
      closeAndFlush: vi.fn().mockResolvedValue(undefined),
    };

    // Mock getSegmentClientFromEnvironment to return our mock client
    vi.mocked(getSegmentClientFromEnvironment).mockReturnValue(mockClient);

    // Create a valid payload for testing
    payload = {
      userId: 'user@example.com',
      traits: {
        email: 'user@example.com',
        name: 'John Doe',
      },
    };
  });

  describe('Success paths', () => {
    it('should return success result when identify and flush succeed', async () => {
      mockClient.identify = vi.fn().mockResolvedValue(undefined);
      mockClient.flush = vi.fn().mockResolvedValue(undefined);

      const result = await sendCustomerToSegment(payload);

      expect(result).toEqual({ success: true });
      expect(getSegmentClientFromEnvironment).toHaveBeenCalledTimes(1);
      expect(mockClient.identify).toHaveBeenCalledTimes(1);
      expect(mockClient.flush).toHaveBeenCalledTimes(1);
    });

    it('should get client from environment before calling identify', async () => {
      await sendCustomerToSegment(payload);

      // Verify both were called
      expect(getSegmentClientFromEnvironment).toHaveBeenCalledTimes(1);
      expect(mockClient.identify).toHaveBeenCalledTimes(1);
    });

    it('should call identify with payload data', async () => {
      await sendCustomerToSegment(payload);

      expect(mockClient.identify).toHaveBeenCalledWith({
        userId: 'user@example.com',
        traits: {
          email: 'user@example.com',
          name: 'John Doe',
        },
      });
    });
  });

  describe('Error handling', () => {
    it('should return error result when getSegmentClientFromEnvironment throws', async () => {
      const errorMessage = 'Missing SEGMENT_WRITE_KEY';
      vi.mocked(getSegmentClientFromEnvironment).mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const result = await sendCustomerToSegment(payload);

      expect(result).toEqual({
        success: false,
        error: {
          message: errorMessage,
        },
      });
    });

    it('should return error result when identify throws error', async () => {
      const errorMessage = 'Segment API error';
      mockClient.identify = vi
        .fn()
        .mockRejectedValue(new Error(errorMessage));

      const result = await sendCustomerToSegment(payload);

      expect(result).toEqual({
        success: false,
        error: {
          message: errorMessage,
        },
      });
    });

    it('should return error result when flush throws error', async () => {
      const errorMessage = 'Flush failed';
      mockClient.identify = vi.fn().mockResolvedValue(undefined);
      mockClient.flush = vi.fn().mockRejectedValue(new Error(errorMessage));

      const result = await sendCustomerToSegment(payload);

      expect(result).toEqual({
        success: false,
        error: {
          message: errorMessage,
        },
      });
    });

    it('should wrap errors in SegmentError with message', async () => {
      const originalError = new Error('Network timeout');
      mockClient.identify = vi.fn().mockRejectedValue(originalError);

      const result = await sendCustomerToSegment(payload);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Network timeout');
      }
    });

    it('should not throw exceptions, only return error results', async () => {
      mockClient.identify = vi
        .fn()
        .mockRejectedValue(new Error('Should be caught'));

      await expect(sendCustomerToSegment(payload)).resolves.toBeDefined();

      const result = await sendCustomerToSegment(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Client initialization', () => {
    it('should call getSegmentClientFromEnvironment once per call', async () => {
      await sendCustomerToSegment(payload);
      await sendCustomerToSegment(payload);

      expect(getSegmentClientFromEnvironment).toHaveBeenCalledTimes(2);
    });

    it('should use client from environment for each call', async () => {
      const client1: SegmentClient = {
        identify: vi.fn().mockResolvedValue(undefined),
        flush: vi.fn().mockResolvedValue(undefined),
        closeAndFlush: vi.fn().mockResolvedValue(undefined),
      };
      const client2: SegmentClient = {
        identify: vi.fn().mockResolvedValue(undefined),
        flush: vi.fn().mockResolvedValue(undefined),
        closeAndFlush: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(getSegmentClientFromEnvironment)
        .mockReturnValueOnce(client1)
        .mockReturnValueOnce(client2);

      await sendCustomerToSegment(payload);
      await sendCustomerToSegment(payload);

      expect(client1.identify).toHaveBeenCalledTimes(1);
      expect(client2.identify).toHaveBeenCalledTimes(1);
    });
  });
});

