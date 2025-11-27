import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createSegmentClient,
  getSegmentClientFromEnvironment,
  type SegmentClient,
} from '../../src/segment/client.js';
import type { UserTraits } from '../../src/segment/types.js';

describe('Segment Client Factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createSegmentClient', () => {
    it('should create client with valid write key', () => {
      const writeKey = 'test-write-key-abc123';

      const client: SegmentClient = createSegmentClient(writeKey);

      expect(client).toBeDefined();
      expect(typeof client.identify).toBe('function');
      expect(typeof client.flush).toBe('function');
      expect(typeof client.closeAndFlush).toBe('function');
    });

    it('should throw error when write key is empty string', () => {
      const writeKey = '';

      expect(() => createSegmentClient(writeKey)).toThrow();
    });

    it('should throw error when write key is whitespace only', () => {
      const writeKey = '   ';

      expect(() => createSegmentClient(writeKey)).toThrow();
    });

    it('should create client that can identify user', async () => {
      const writeKey = 'test-write-key-xyz789';
      const client: SegmentClient = createSegmentClient(writeKey);
      const traits: UserTraits = {
        email: 'user@example.com',
        name: 'Test User',
      };

      await expect(
        client.identify({ userId: 'user-123', traits }),
      ).resolves.toBeUndefined();
    });

    it('should create client that can flush events', async () => {
      const writeKey = 'test-write-key-flush';
      const client: SegmentClient = createSegmentClient(writeKey);

      await expect(client.flush()).resolves.toBeUndefined();
    });

    it('should create client that can close and flush', async () => {
      const writeKey = 'test-write-key-close';
      const client: SegmentClient = createSegmentClient(writeKey);

      await expect(client.closeAndFlush()).resolves.toBeUndefined();
    });

    it('should create client that handles identify with address', async () => {
      const writeKey = 'test-write-key-address';
      const client: SegmentClient = createSegmentClient(writeKey);
      const traits: UserTraits = {
        email: 'user@example.com',
        name: 'Test User',
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          country: 'USA',
          postalCode: '94102',
        },
      };

      await expect(
        client.identify({ userId: 'user-456', traits }),
      ).resolves.toBeUndefined();
    });
  });

  describe('getSegmentClientFromEnvironment', () => {
    it('should create client from SEGMENT_WRITE_KEY env var', () => {
      process.env.SEGMENT_WRITE_KEY = 'env-write-key-123';

      const client: SegmentClient = getSegmentClientFromEnvironment();

      expect(client).toBeDefined();
      expect(typeof client.identify).toBe('function');
      expect(typeof client.flush).toBe('function');
      expect(typeof client.closeAndFlush).toBe('function');
    });

    it('should throw error when SEGMENT_WRITE_KEY is missing', () => {
      delete process.env.SEGMENT_WRITE_KEY;

      expect(() => getSegmentClientFromEnvironment()).toThrow();
    });

    it('should throw error when SEGMENT_WRITE_KEY is empty', () => {
      process.env.SEGMENT_WRITE_KEY = '';

      expect(() => getSegmentClientFromEnvironment()).toThrow();
    });

    it('should create client that works with environment key', async () => {
      process.env.SEGMENT_WRITE_KEY = 'env-key-functional';
      const client: SegmentClient = getSegmentClientFromEnvironment();
      const traits: UserTraits = {
        email: 'env-user@example.com',
      };

      await expect(
        client.identify({ userId: 'env-user-789', traits }),
      ).resolves.toBeUndefined();
    });
  });
});

