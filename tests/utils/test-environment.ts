/**
 * Test Environment Utilities
 * Detects and manages test environment configuration
 */

/**
 * Gets the webhook endpoint URL based on environment
 */
export function getWebhookEndpoint(): string {
  const baseUrl = process.env.WEBHOOK_ENDPOINT_URL;
  if (baseUrl) {
    // Use URL constructor for safer URL handling
    try {
      const url = new URL(baseUrl);
      // If baseUrl already ends with /api/webhook, return as-is
      if (url.pathname.endsWith('/api/webhook')) {
        return baseUrl;
      }
      // Remove trailing slash from pathname if present
      const cleanPathname = url.pathname.endsWith('/')
        ? url.pathname.slice(0, -1)
        : url.pathname;
      // Construct new URL with /api/webhook path
      url.pathname = `${cleanPathname}/api/webhook`;
      return url.toString();
    } catch {
      // Fallback to string manipulation if URL constructor fails
      const trimmedBaseUrl = baseUrl.trim();
      if (trimmedBaseUrl.endsWith('/api/webhook')) {
        return trimmedBaseUrl;
      }
      // Remove trailing slash before appending /api/webhook
      const cleanBaseUrl = trimmedBaseUrl.endsWith('/')
        ? trimmedBaseUrl.slice(0, -1)
        : trimmedBaseUrl;
      return `${cleanBaseUrl}/api/webhook`;
    }
  }

  // Default to local development
  return 'http://localhost:3000/api/webhook';
}

/**
 * Checks if running in local environment
 */
export function isLocalEnvironment(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    !process.env.VERCEL &&
    !process.env.VERCEL_URL
  );
}

/**
 * Checks if running in Vercel environment
 */
export function isVercelEnvironment(): boolean {
  return (
    process.env.VERCEL === '1' ||
    process.env.VERCEL_URL !== undefined ||
    (process.env.WEBHOOK_ENDPOINT_URL !== undefined &&
      process.env.WEBHOOK_ENDPOINT_URL.includes('vercel.app'))
  );
}

/**
 * Gets environment name for logging
 */
export function getEnvironmentName(): string {
  if (isVercelEnvironment()) {
    return 'Vercel';
  }
  if (isLocalEnvironment()) {
    return 'Local';
  }
  return 'Unknown';
}

