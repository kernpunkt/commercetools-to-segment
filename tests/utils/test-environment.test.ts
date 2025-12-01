import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getWebhookEndpoint,
  isLocalEnvironment,
  isVercelEnvironment,
  getEnvironmentName,
} from './test-environment.js';

describe('test-environment', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.WEBHOOK_ENDPOINT_URL;
    delete process.env.VERCEL;
    delete process.env.VERCEL_URL;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  describe('getWebhookEndpoint', () => {
    it('should return localhost endpoint when WEBHOOK_ENDPOINT_URL is not set', () => {
      const endpoint = getWebhookEndpoint();

      expect(endpoint).toBe('http://localhost:3000/api/webhook');
    });

    it('should return WEBHOOK_ENDPOINT_URL when set without trailing path', () => {
      process.env.WEBHOOK_ENDPOINT_URL = 'https://example.com';

      const endpoint = getWebhookEndpoint();

      expect(endpoint).toBe('https://example.com/api/webhook');
    });

    it('should return WEBHOOK_ENDPOINT_URL when set with /api/webhook path', () => {
      process.env.WEBHOOK_ENDPOINT_URL = 'https://example.com/api/webhook';

      const endpoint = getWebhookEndpoint();

      expect(endpoint).toBe('https://example.com/api/webhook');
    });

    it('should append /api/webhook when URL does not end with it', () => {
      process.env.WEBHOOK_ENDPOINT_URL = 'https://example.vercel.app';

      const endpoint = getWebhookEndpoint();

      expect(endpoint).toBe('https://example.vercel.app/api/webhook');
    });

    it('should not append /api/webhook when URL already ends with it', () => {
      process.env.WEBHOOK_ENDPOINT_URL = 'https://example.vercel.app/api/webhook';

      const endpoint = getWebhookEndpoint();

      expect(endpoint).toBe('https://example.vercel.app/api/webhook');
    });

    it('should handle URLs with trailing slash', () => {
      process.env.WEBHOOK_ENDPOINT_URL = 'https://example.com/';

      const endpoint = getWebhookEndpoint();

      // Should remove trailing slash before appending /api/webhook
      expect(endpoint).toBe('https://example.com/api/webhook');
    });

    it('should handle different protocol URLs', () => {
      process.env.WEBHOOK_ENDPOINT_URL = 'http://localhost:8080';

      const endpoint = getWebhookEndpoint();

      expect(endpoint).toBe('http://localhost:8080/api/webhook');
    });
  });

  describe('isLocalEnvironment', () => {
    it('should return true when NODE_ENV is not production and VERCEL is not set', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.VERCEL;
      delete process.env.VERCEL_URL;

      const result = isLocalEnvironment();

      expect(result).toBe(true);
    });

    it('should return false when VERCEL is set to 1', () => {
      process.env.NODE_ENV = 'development';
      process.env.VERCEL = '1';

      const result = isLocalEnvironment();

      expect(result).toBe(false);
    });

    it('should return false when VERCEL_URL is set', () => {
      process.env.NODE_ENV = 'development';
      process.env.VERCEL_URL = 'https://example.vercel.app';

      const result = isLocalEnvironment();

      expect(result).toBe(false);
    });

    it('should return false when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.VERCEL;
      delete process.env.VERCEL_URL;

      const result = isLocalEnvironment();

      expect(result).toBe(false);
    });

    it('should return true when all Vercel indicators are missing', () => {
      delete process.env.NODE_ENV;
      delete process.env.VERCEL;
      delete process.env.VERCEL_URL;

      const result = isLocalEnvironment();

      expect(result).toBe(true);
    });

    it('should return false when both VERCEL and VERCEL_URL are set', () => {
      process.env.VERCEL = '1';
      process.env.VERCEL_URL = 'https://example.vercel.app';

      const result = isLocalEnvironment();

      expect(result).toBe(false);
    });
  });

  describe('isVercelEnvironment', () => {
    it('should return true when VERCEL is set to 1', () => {
      process.env.VERCEL = '1';

      const result = isVercelEnvironment();

      expect(result).toBe(true);
    });

    it('should return true when VERCEL_URL is set', () => {
      process.env.VERCEL_URL = 'https://example.vercel.app';

      const result = isVercelEnvironment();

      expect(result).toBe(true);
    });

    it('should return true when WEBHOOK_ENDPOINT_URL contains vercel.app', () => {
      process.env.WEBHOOK_ENDPOINT_URL = 'https://example.vercel.app/api/webhook';

      const result = isVercelEnvironment();

      expect(result).toBe(true);
    });

    it('should return false when no Vercel indicators are set', () => {
      delete process.env.VERCEL;
      delete process.env.VERCEL_URL;
      delete process.env.WEBHOOK_ENDPOINT_URL;

      const result = isVercelEnvironment();

      expect(result).toBe(false);
    });

    it('should return true when VERCEL is set even if VERCEL_URL is not', () => {
      process.env.VERCEL = '1';
      delete process.env.VERCEL_URL;

      const result = isVercelEnvironment();

      expect(result).toBe(true);
    });

    it('should return true when VERCEL_URL is set even if VERCEL is not', () => {
      delete process.env.VERCEL;
      process.env.VERCEL_URL = 'https://example.vercel.app';

      const result = isVercelEnvironment();

      expect(result).toBe(true);
    });

    it('should return true when WEBHOOK_ENDPOINT_URL contains vercel.app even if VERCEL is not set', () => {
      delete process.env.VERCEL;
      delete process.env.VERCEL_URL;
      process.env.WEBHOOK_ENDPOINT_URL = 'https://my-app.vercel.app/api/webhook';

      const result = isVercelEnvironment();

      expect(result).toBe(true);
    });

    it('should return false when WEBHOOK_ENDPOINT_URL does not contain vercel.app', () => {
      process.env.WEBHOOK_ENDPOINT_URL = 'https://example.com/api/webhook';

      const result = isVercelEnvironment();

      expect(result).toBe(false);
    });
  });

  describe('getEnvironmentName', () => {
    it('should return "Vercel" when isVercelEnvironment returns true', () => {
      process.env.VERCEL = '1';

      const result = getEnvironmentName();

      expect(result).toBe('Vercel');
    });

    it('should return "Local" when isLocalEnvironment returns true', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.VERCEL;
      delete process.env.VERCEL_URL;

      const result = getEnvironmentName();

      expect(result).toBe('Local');
    });

    it('should return "Unknown" when neither Vercel nor Local conditions are met', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.VERCEL;
      delete process.env.VERCEL_URL;

      const result = getEnvironmentName();

      expect(result).toBe('Unknown');
    });

    it('should return "Vercel" when VERCEL_URL is set', () => {
      process.env.VERCEL_URL = 'https://example.vercel.app';

      const result = getEnvironmentName();

      expect(result).toBe('Vercel');
    });

    it('should return "Local" when NODE_ENV is development and no Vercel indicators', () => {
      process.env.NODE_ENV = 'development';

      const result = getEnvironmentName();

      expect(result).toBe('Local');
    });

    it('should prioritize Vercel over Local', () => {
      process.env.VERCEL = '1';
      process.env.NODE_ENV = 'development';

      const result = getEnvironmentName();

      expect(result).toBe('Vercel');
    });
  });
});

