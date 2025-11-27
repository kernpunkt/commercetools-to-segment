/**
 * Environment Configuration Validation
 */

export interface EnvironmentConfig {
  readonly SEGMENT_WRITE_KEY: string;
}

export type EnvVar = keyof EnvironmentConfig;

export interface EnvironmentValidationResult {
  readonly isValid: boolean;
  readonly missingVars: ReadonlyArray<EnvVar>;
  readonly config?: EnvironmentConfig;
}

/**
 * Validates required environment variables
 */
export function validateEnvironment(): EnvironmentValidationResult {
  const writeKey = process.env['SEGMENT_WRITE_KEY'];
  const trimmedWriteKey = writeKey?.trim();

  if (!trimmedWriteKey || trimmedWriteKey.length === 0) {
    return {
      isValid: false,
      missingVars: ['SEGMENT_WRITE_KEY'],
    };
  }

  return {
    isValid: true,
    missingVars: [],
    config: {
      SEGMENT_WRITE_KEY: trimmedWriteKey,
    },
  };
}

/**
 * Gets environment configuration with validation
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const validationResult = validateEnvironment();

  if (!validationResult.isValid) {
    throw new Error(
      `Missing required environment variable: ${validationResult.missingVars.join(', ')}`
    );
  }

  if (!validationResult.config) {
    throw new Error('Environment configuration is invalid');
  }

  return validationResult.config;
}
