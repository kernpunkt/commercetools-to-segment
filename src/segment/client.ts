/**
 * Segment Analytics Client Factory
 */

import { Analytics } from '@segment/analytics-node';
import { getEnvironmentConfig } from '../config/environment.js';
import type { SegmentClient, UserTraits } from './types.js';

/**
 * Creates a Segment Analytics client instance
 */
export function createSegmentClient(writeKey: string): SegmentClient {
  const trimmedWriteKey = writeKey.trim();

  if (!trimmedWriteKey || trimmedWriteKey.length === 0) {
    throw new Error('Write key cannot be empty or whitespace only');
  }

  const analytics = new Analytics({ writeKey: trimmedWriteKey });

  return {
    identify(params: {
      readonly userId: string;
      readonly traits: UserTraits;
    }): Promise<void> {
      analytics.identify({
        userId: params.userId,
        traits: params.traits,
      });
      return Promise.resolve();
    },
    async flush(): Promise<void> {
      await analytics.flush();
    },
    async closeAndFlush(): Promise<void> {
      await analytics.closeAndFlush();
    },
  };
}

/**
 * Gets Segment client from environment configuration
 */
export function getSegmentClientFromEnvironment(): SegmentClient {
  const config = getEnvironmentConfig();
  return createSegmentClient(config.SEGMENT_WRITE_KEY);
}
