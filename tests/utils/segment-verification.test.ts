import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  verifyUserInSegment,
  verifyUserTraits,
  isSegmentApiVerificationAvailable,
} from './segment-verification.js';

describe('segment-verification', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.SEGMENT_API_KEY;
  });

  describe('verifyUserInSegment', () => {
    it('should return verification object with userId when email provided', async () => {
      const userId = 'user@example.com';

      const result = await verifyUserInSegment(userId);

      expect(result.userId).toBe(userId);
      expect(result.traits).toBeDefined();
      expect(result.traits.email).toBe(userId);
    });

    it('should return verification object with different userIds', async () => {
      const userId1 = 'user1@example.com';
      const userId2 = 'user2@example.com';

      const result1 = await verifyUserInSegment(userId1);
      const result2 = await verifyUserInSegment(userId2);

      expect(result1.userId).toBe(userId1);
      expect(result2.userId).toBe(userId2);
    });

    it('should return verification object with email in traits matching userId', async () => {
      const userId = 'test@example.com';

      const result = await verifyUserInSegment(userId);

      expect(result.traits.email).toBe(userId);
    });

    it('should return verification object structure', async () => {
      const userId = 'user@example.com';

      const result = await verifyUserInSegment(userId);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('traits');
      expect(typeof result.userId).toBe('string');
      expect(typeof result.traits).toBe('object');
      expect(result.traits).toHaveProperty('email');
    });

    it('should handle userId with special characters', async () => {
      const userId = 'user+test@example.com';

      const result = await verifyUserInSegment(userId);

      expect(result.userId).toBe(userId);
      expect(result.traits.email).toBe(userId);
    });

    it('should handle empty userId string', async () => {
      const userId = '';

      const result = await verifyUserInSegment(userId);

      expect(result.userId).toBe('');
      expect(result.traits.email).toBe('');
    });
  });

  describe('verifyUserTraits', () => {
    it('should return true when verifying email trait', async () => {
      const userId = 'user@example.com';
      const expectedTraits = {
        email: 'user@example.com',
      };

      const result = await verifyUserTraits(userId, expectedTraits);

      expect(result).toBe(true);
    });

    it('should return true when verifying email and name traits', async () => {
      const userId = 'user@example.com';
      const expectedTraits = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const result = await verifyUserTraits(userId, expectedTraits);

      expect(result).toBe(true);
    });

    it('should return true when verifying email, name, and address traits', async () => {
      const userId = 'user@example.com';
      const expectedTraits = {
        email: 'user@example.com',
        name: 'John Doe',
        address: {
          street: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'US',
        },
      };

      const result = await verifyUserTraits(userId, expectedTraits);

      expect(result).toBe(true);
    });

    it('should return true when verifying partial address traits', async () => {
      const userId = 'user@example.com';
      const expectedTraits = {
        email: 'user@example.com',
        address: {
          street: '123 Main St',
          city: 'New York',
        },
      };

      const result = await verifyUserTraits(userId, expectedTraits);

      expect(result).toBe(true);
    });

    it('should return true when verifying only email trait', async () => {
      const userId = 'minimal@example.com';
      const expectedTraits = {
        email: 'minimal@example.com',
      };

      const result = await verifyUserTraits(userId, expectedTraits);

      expect(result).toBe(true);
    });

    it('should return true for different userId values', async () => {
      const userId1 = 'user1@example.com';
      const userId2 = 'user2@example.com';
      const traits1 = { email: 'user1@example.com' };
      const traits2 = { email: 'user2@example.com' };

      const result1 = await verifyUserTraits(userId1, traits1);
      const result2 = await verifyUserTraits(userId2, traits2);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should handle userId with special characters', async () => {
      const userId = 'user+test@example.com';
      const expectedTraits = {
        email: 'user+test@example.com',
      };

      const result = await verifyUserTraits(userId, expectedTraits);

      expect(result).toBe(true);
    });

    it('should return true even when address has undefined fields', async () => {
      const userId = 'user@example.com';
      const expectedTraits = {
        email: 'user@example.com',
        address: {
          street: '123 Main St',
          city: undefined,
          postalCode: undefined,
          country: undefined,
        },
      };

      const result = await verifyUserTraits(userId, expectedTraits);

      expect(result).toBe(true);
    });
  });

  describe('isSegmentApiVerificationAvailable', () => {
    it('should return false when SEGMENT_API_KEY is not set', () => {
      delete process.env.SEGMENT_API_KEY;

      const result = isSegmentApiVerificationAvailable();

      expect(result).toBe(false);
    });

    it('should return true when SEGMENT_API_KEY is set', () => {
      process.env.SEGMENT_API_KEY = 'test-api-key';

      const result = isSegmentApiVerificationAvailable();

      expect(result).toBe(true);
    });

    it('should return false when SEGMENT_API_KEY is empty string', () => {
      process.env.SEGMENT_API_KEY = '';

      const result = isSegmentApiVerificationAvailable();

      expect(result).toBe(false);
    });

    it('should return false after SEGMENT_API_KEY is deleted', () => {
      process.env.SEGMENT_API_KEY = 'test-key';
      expect(isSegmentApiVerificationAvailable()).toBe(true);

      delete process.env.SEGMENT_API_KEY;

      const result = isSegmentApiVerificationAvailable();

      expect(result).toBe(false);
    });
  });
});

