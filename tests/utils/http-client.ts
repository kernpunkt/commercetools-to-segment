/**
 * HTTP Client Utility
 * Sends HTTP requests to webhook endpoint for E2E testing
 */

interface HttpResponse {
  readonly statusCode: number;
  readonly body: string;
  readonly headers: Record<string, string>;
}

interface HttpClientConfig {
  readonly timeout?: number;
}

const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Validates URL format to prevent SSRF attacks
 */
function validateUrl(url: string): void {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      throw new Error(`Invalid protocol: ${urlObj.protocol}. Only http and https are allowed.`);
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Invalid URL format: ${url}`);
    }
    throw error;
  }
}

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

/**
 * Checks if URL is a Vercel preview deployment
 */
function isVercelPreviewUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('vercel.app') || urlObj.hostname.includes('vercel.dev');
  } catch {
    return false;
  }
}

/**
 * Sends a webhook request to the endpoint
 * @param url - The webhook endpoint URL
 * @param payload - The webhook payload to send
 * @param config - Optional configuration (timeout)
 * @throws {Error} If URL is invalid, network error occurs, or request times out
 */
export async function sendWebhookRequest(
  url: string,
  payload: Readonly<Record<string, unknown>>,
  config?: HttpClientConfig
): Promise<HttpResponse> {
  // Validate URL format before making request
  validateUrl(url);

  const timeoutMs = config?.timeout ?? DEFAULT_TIMEOUT_MS;

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Vercel protection bypass header if needed
  if (isVercelPreviewUrl(url)) {
    const bypassSecret = process.env.VERCEL_PROTECTION_BYPASS_SECRET;
    if (bypassSecret) {
      headers['x-vercel-protection-bypass'] = bypassSecret;
    }
  }

  try {
    // Create timeout promise and fetch promise
    const fetchPromise = fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    // Race between fetch and timeout
    const response = await Promise.race([
      fetchPromise,
      createTimeoutPromise(timeoutMs),
    ]);

    const body = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      statusCode: response.status,
      body,
      headers: responseHeaders,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw with more context
      if (error.message.includes('timeout')) {
        throw new Error(`Webhook request to ${url} timed out after ${timeoutMs}ms`);
      }
      if (error.message.includes('fetch failed') || error.message.includes('network')) {
        throw new Error(`Network error while sending webhook to ${url}: ${error.message}`);
      }
      throw new Error(`Failed to send webhook request to ${url}: ${error.message}`);
    }
    throw new Error(`Failed to send webhook request to ${url}: ${String(error)}`);
  }
}

/**
 * Parses JSON response body
 */
export function parseJsonResponse(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${String(error)}`);
  }
}

