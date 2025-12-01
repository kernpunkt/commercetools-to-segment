/**
 * Vercel serverless function handler for Commercetools webhook endpoint
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateMethod,
  parseJSON,
  validatePayload
} from '../src/webhook/validator.js';

/**
 * Default export handler for Vercel serverless function
 * Validates webhook requests and returns appropriate HTTP status codes
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (!validateMethod(req.method)) {
    res.status(400).json({ error: 'Method not allowed. Only POST is supported.' });
    return;
  }

  const parseResult = parseJSON(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error });
    return;
  }

  const validationResult = validatePayload(parseResult.data);
  if (!validationResult.isValid) {
    res.status(400).json({ error: validationResult.error });
    return;
  }

  res.status(200).json({ eventType: validationResult.eventType });
}

