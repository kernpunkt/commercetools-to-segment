import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateEnvironment,
  getEnvironmentConfig,
  type EnvironmentConfig,
  type EnvironmentValidationResult,
} from '../../src/config/environment.js';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    it('should return valid result when SEGMENT_WRITE_KEY is set', () => {
      process.env.SEGMENT_WRITE_KEY = 'test-write-key-123';

      const result: EnvironmentValidationResult = validateEnvironment();

      expect(result.isValid).toBe(true);
      expect(result.missingVars).toEqual([]);
      expect(result.config).toEqual({
        SEGMENT_WRITE_KEY: 'test-write-key-123',
      });
    });

    it('should return invalid result when SEGMENT_WRITE_KEY is missing', () => {
      delete process.env.SEGMENT_WRITE_KEY;

      const result: EnvironmentValidationResult = validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.missingVars).toContain('SEGMENT_WRITE_KEY');
      expect(result.config).toBeUndefined();
    });

    it('should return invalid result when SEGMENT_WRITE_KEY is empty string', () => {
      process.env.SEGMENT_WRITE_KEY = '';

      const result: EnvironmentValidationResult = validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.missingVars).toContain('SEGMENT_WRITE_KEY');
      expect(result.config).toBeUndefined();
    });

    it('should return invalid result when SEGMENT_WRITE_KEY is whitespace only', () => {
      process.env.SEGMENT_WRITE_KEY = '   ';

      const result: EnvironmentValidationResult = validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.missingVars).toContain('SEGMENT_WRITE_KEY');
      expect(result.config).toBeUndefined();
    });

    it('should return valid result with trimmed write key', () => {
      process.env.SEGMENT_WRITE_KEY = '  test-write-key-456  ';

      const result: EnvironmentValidationResult = validateEnvironment();

      expect(result.isValid).toBe(true);
      expect(result.config?.SEGMENT_WRITE_KEY).toBe('test-write-key-456');
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return config when SEGMENT_WRITE_KEY is set', () => {
      process.env.SEGMENT_WRITE_KEY = 'test-write-key-789';

      const config: EnvironmentConfig = getEnvironmentConfig();

      expect(config.SEGMENT_WRITE_KEY).toBe('test-write-key-789');
    });

    it('should throw error when SEGMENT_WRITE_KEY is missing', () => {
      delete process.env.SEGMENT_WRITE_KEY;

      expect(() => getEnvironmentConfig()).toThrow();
    });

    it('should throw error when SEGMENT_WRITE_KEY is empty', () => {
      process.env.SEGMENT_WRITE_KEY = '';

      expect(() => getEnvironmentConfig()).toThrow();
    });

    it('should return trimmed write key', () => {
      process.env.SEGMENT_WRITE_KEY = '  trimmed-key  ';

      const config: EnvironmentConfig = getEnvironmentConfig();

      expect(config.SEGMENT_WRITE_KEY).toBe('trimmed-key');
    });
  });
});

