/**
 * Segment Integration Service Type Definitions
 */

export type SegmentIntegrationResult =
  | { success: true }
  | { success: false; error: SegmentError };

export interface SegmentError {
  readonly message: string;
  readonly code?: string;
}

