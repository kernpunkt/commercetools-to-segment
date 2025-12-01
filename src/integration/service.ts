/**
 * Segment Integration Service
 */

import { getSegmentClientFromEnvironment } from '../segment/client.js';
import type { SegmentClient } from '../segment/types.js';
import type { SegmentIdentifyPayload } from '../transformation/types.js';
import type { SegmentIntegrationResult } from './types.js';

/**
 * Sends customer data to Segment Identify API using provided client
 */
export async function sendCustomerToSegmentWithClient(
  client: Readonly<SegmentClient>,
  payload: Readonly<SegmentIdentifyPayload>
): Promise<SegmentIntegrationResult> {
  try {
    console.log('Calling client.identify...');
    await client.identify({
      userId: payload.userId,
      traits: payload.traits,
    });
    console.log('client.identify completed, calling flush...');

    // Add timeout to flush
    const flushPromise = client.flush();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Flush operation timed out after 5 seconds'));
      }, 5000);
    });

    await Promise.race([flushPromise, timeoutPromise]);
    console.log('flush completed');
    return { success: true };
  } catch (error) {
    console.error('Error in sendCustomerToSegmentWithClient:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Sends customer data to Segment Identify API using client from environment
 */
export async function sendCustomerToSegment(
  payload: Readonly<SegmentIdentifyPayload>
): Promise<SegmentIntegrationResult> {
  try {
    const client = getSegmentClientFromEnvironment();
    return await sendCustomerToSegmentWithClient(client, payload);
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
