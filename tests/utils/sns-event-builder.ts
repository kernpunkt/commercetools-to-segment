/**
 * SNS Event Builder Utility
 * Creates valid AWS SNS events for Lambda handler testing
 */

import {
  createCustomerCreatedPayload,
  createCustomerUpdatedPayload,
} from './webhook-payload-builder.js';

type WebhookPayload = ReturnType<typeof createCustomerCreatedPayload>;

// SNS Event Types (matching AWS SNS event structure)
interface SNSMessage {
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

interface SNSRecord {
  readonly EventSource: 'aws:sns';
  readonly EventVersion: string;
  readonly EventSubscriptionArn: string;
  readonly Sns: SNSMessage;
}

export interface SNSEvent {
  readonly Records: ReadonlyArray<SNSRecord>;
}

/**
 * Creates a base SNS message with default values
 */
function createBaseSnsMessage(
  type: 'Notification' | 'SubscriptionConfirmation',
  message: string
): SNSMessage {
  const timestamp = new Date().toISOString();
  return {
    Type: type,
    MessageId: `message-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    TopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
    Message: message,
    Timestamp: timestamp,
    SignatureVersion: '1',
    Signature: 'test-signature',
    SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
    UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
  } as const;
}

/**
 * Creates an SNS record with Notification type
 */
function createSnsNotificationRecord(
  payload: WebhookPayload
): SNSRecord {
  const message = JSON.stringify(payload);
  return {
    EventSource: 'aws:sns',
    EventVersion: '1.0',
    EventSubscriptionArn:
      'arn:aws:sns:us-east-1:123456789012:test-topic:subscription-id',
    Sns: createBaseSnsMessage('Notification', message),
  } as const;
}

/**
 * Creates an SNS record with SubscriptionConfirmation type
 */
function createSnsSubscriptionConfirmationRecord(): SNSRecord {
  const message = JSON.stringify({
    Type: 'SubscriptionConfirmation',
    MessageId: 'subscription-message-id',
    Token: 'subscription-token',
    TopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
    Message: 'You have chosen to subscribe to the topic',
    SubscribeURL:
      'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-east-1:123456789012:test-topic&Token=subscription-token',
    Timestamp: new Date().toISOString(),
  });
  return {
    EventSource: 'aws:sns',
    EventVersion: '1.0',
    EventSubscriptionArn:
      'arn:aws:sns:us-east-1:123456789012:test-topic:subscription-id',
    Sns: createBaseSnsMessage('SubscriptionConfirmation', message),
  } as const;
}

/**
 * Creates an SNS record with a custom message string
 */
function createSnsRecordWithMessage(
  message: string,
  type: 'Notification' | 'SubscriptionConfirmation' = 'Notification'
): SNSRecord {
  return {
    EventSource: 'aws:sns',
    EventVersion: '1.0',
    EventSubscriptionArn:
      'arn:aws:sns:us-east-1:123456789012:test-topic:subscription-id',
    Sns: createBaseSnsMessage(type, message),
  } as const;
}

/**
 * Creates an SNS event with a single record
 */
export function createSnsEvent(records: ReadonlyArray<SNSRecord>): SNSEvent {
  return {
    Records: records,
  } as const;
}

/**
 * Creates an SNS event with a customer.created payload
 */
export function createSnsEventWithCustomerCreated(
  payload: WebhookPayload
): SNSEvent {
  const record = createSnsNotificationRecord(payload);
  return createSnsEvent([record]);
}

/**
 * Creates an SNS event with a customer.updated payload
 */
export function createSnsEventWithCustomerUpdated(
  payload: ReturnType<typeof createCustomerUpdatedPayload>
): SNSEvent {
  const record = createSnsNotificationRecord(payload);
  return createSnsEvent([record]);
}

/**
 * Creates an SNS event with a subscription confirmation
 */
export function createSnsSubscriptionConfirmationEvent(): SNSEvent {
  const record = createSnsSubscriptionConfirmationRecord();
  return createSnsEvent([record]);
}

/**
 * Creates an SNS event with multiple records
 */
export function createSnsEventWithMultipleRecords(
  payloads: ReadonlyArray<WebhookPayload>
): SNSEvent {
  const records = payloads.map((payload) =>
    createSnsNotificationRecord(payload)
  );
  return createSnsEvent(records);
}

/**
 * Creates an SNS event with a custom message in the Message field
 */
export function createSnsEventWithMessage(
  message: string,
  type: 'Notification' | 'SubscriptionConfirmation' = 'Notification'
): SNSEvent {
  const record = createSnsRecordWithMessage(message, type);
  return createSnsEvent([record]);
}

/**
 * Creates an SNS event with a specific Type field
 */
export function createSnsEventWithType(
  type: 'Notification' | 'SubscriptionConfirmation',
  payload?: WebhookPayload
): SNSEvent {
  if (type === 'SubscriptionConfirmation') {
    return createSnsSubscriptionConfirmationEvent();
  }
  if (payload !== undefined) {
    return createSnsEventWithCustomerCreated(payload);
  }
  // Default to customer.created if no payload provided
  const defaultPayload = {
    notificationType: 'Message' as const,
    type: 'CustomerCreated' as const,
    resource: {
      typeId: 'customer' as const,
      id: 'test-customer-id',
    },
    projectKey: 'test-project',
    id: 'test-notification-id',
    version: 1,
    sequenceNumber: 1,
    resourceVersion: 1,
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
    customer: {
      email: 'test@example.com',
    },
  };
  return createSnsEventWithCustomerCreated(defaultPayload);
}

