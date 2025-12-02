/**
 * Type definitions for AWS Lambda handler and SNS event processing
 */

import type { Context } from 'aws-lambda';

/**
 * SNS Message structure
 */
export interface SNSMessage {
  readonly Type: 'Notification' | 'SubscriptionConfirmation';
  readonly MessageId: string;
  readonly TopicArn: string;
  readonly Subject?: string;
  readonly Message: string; // JSON string containing Commercetools payload
  readonly Timestamp: string;
  readonly SignatureVersion: string;
  readonly Signature: string;
  readonly SigningCertUrl: string;
  readonly UnsubscribeUrl: string;
  readonly MessageAttributes?: Record<string, unknown>;
}

/**
 * SNS Record structure
 */
export interface SNSRecord {
  readonly EventSource: 'aws:sns';
  readonly EventVersion: string;
  readonly EventSubscriptionArn: string;
  readonly Sns: SNSMessage;
}

/**
 * SNS Event structure (AWS Lambda event format)
 */
export interface SNSEvent {
  readonly Records: ReadonlyArray<SNSRecord>;
}

/**
 * Lambda response structure
 */
export interface LambdaResponse {
  readonly statusCode: number;
  readonly body: string;
  readonly headers?: Record<string, string>;
}

/**
 * Lambda context type (re-exported from aws-lambda)
 */
export type LambdaContext = Context;

/**
 * Processing result for a single SNS record
 */
export interface ProcessingResult {
  readonly success: boolean;
  readonly statusCode: number;
  readonly error?: string;
}

/**
 * Request body format for existing validator (compatible with webhook handler)
 */
export interface RequestBody {
  readonly notificationType: 'Message';
  readonly type: string;
  readonly resource: {
    readonly typeId: string;
    readonly id: string;
  };
  readonly projectKey: string;
  readonly id: string;
  readonly version: number;
  readonly sequenceNumber: number;
  readonly resourceVersion: number;
  readonly createdAt: string;
  readonly lastModifiedAt: string;
  readonly customer?: unknown;
}
