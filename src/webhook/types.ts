/**
 * Type definitions for Commercetools webhook payloads and validation
 */

export interface CommercetoolsWebhookPayload {
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
}

export type WebhookEventType = 'customer.created' | 'customer.updated';

export interface WebhookValidationResult {
  readonly isValid: boolean;
  readonly eventType?: WebhookEventType;
  readonly error?: string;
}
