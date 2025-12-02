import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'aws-lambda';
import handler from '../../src/lambda/handler.js';
import type { SNSEvent, LambdaResponse } from '../../src/lambda/types.js';
import {
  createSnsEventWithCustomerCreated,
  createSnsEventWithCustomerUpdated,
  createSnsSubscriptionConfirmationEvent,
  createSnsEventWithMultipleRecords,
  type SNSEvent as TestSNSEvent,
} from '../utils/sns-event-builder.js';
import {
  createCustomerCreatedPayload,
  createCustomerUpdatedPayload,
} from '../utils/webhook-payload-builder.js';
import { validatePayload } from '../../src/webhook/validator.js';
import { transformCustomerToSegment } from '../../src/transformation/transformer.js';
import { sendCustomerToSegment } from '../../src/integration/service.js';

// Mock dependencies
vi.mock('../../src/webhook/validator.js', () => ({
  validatePayload: vi.fn(),
}));

vi.mock('../../src/transformation/transformer.js', () => ({
  transformCustomerToSegment: vi.fn(),
}));

vi.mock('../../src/integration/service.js', () => ({
  sendCustomerToSegment: vi.fn(),
}));

vi.mock('../../src/logger.js', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

describe('handler', () => {
  let mockContext: Context;
  let mockValidatePayload: ReturnType<typeof vi.fn>;
  let mockTransformCustomerToSegment: ReturnType<typeof vi.fn>;
  let mockSendCustomerToSegment: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create mock Lambda context
    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'test-lambda-handler',
      functionVersion: '$LATEST',
      invokedFunctionArn:
        'arn:aws:lambda:us-east-1:123456789012:function:test-lambda-handler',
      memoryLimitInMB: '128',
      awsRequestId: `test-request-${Date.now()}`,
      logGroupName: '/aws/lambda/test-lambda-handler',
      logStreamName: '2024/01/01/[$LATEST]test-stream',
      getRemainingTimeInMillis: () => 30000,
      done: () => {
        // No-op
      },
      fail: () => {
        // No-op
      },
      succeed: () => {
        // No-op
      },
    } as Context;

    // Get mocked functions
    mockValidatePayload = vi.mocked(validatePayload);
    mockTransformCustomerToSegment = vi.mocked(transformCustomerToSegment);
    mockSendCustomerToSegment = vi.mocked(sendCustomerToSegment);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Processing SNS events with customer.created payload', () => {
    it('should return 200 status code when processing customer.created event successfully', async () => {
      const payload = createCustomerCreatedPayload();
      const snsEvent = createSnsEventWithCustomerCreated(payload);

      mockValidatePayload.mockReturnValue({
        isValid: true,
        eventType: 'customer.created',
      });
      mockTransformCustomerToSegment.mockReturnValue({
        userId: 'test@example.com',
        traits: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
      mockSendCustomerToSegment.mockResolvedValue({ success: true });

      const result = await handler(snsEvent as SNSEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBeDefined();
    });

    it('should extract Commercetools payload from SNS Message field', async () => {
      const payload = createCustomerCreatedPayload();
      const snsEvent = createSnsEventWithCustomerCreated(payload);

      mockValidatePayload.mockReturnValue({
        isValid: true,
        eventType: 'customer.created',
      });
      mockTransformCustomerToSegment.mockReturnValue({
        userId: 'test@example.com',
        traits: { email: 'test@example.com' },
      });
      mockSendCustomerToSegment.mockResolvedValue({ success: true });

      await handler(snsEvent as SNSEvent, mockContext);

      expect(mockValidatePayload).toHaveBeenCalled();
      const validateCall = mockValidatePayload.mock.calls[0];
      expect(validateCall).toBeDefined();
      if (validateCall) {
        const validatedPayload = validateCall[0];
        expect(validatedPayload).toBeDefined();
      }
    });

    it('should validate payload using existing validator', async () => {
      const payload = createCustomerCreatedPayload();
      const snsEvent = createSnsEventWithCustomerCreated(payload);

      mockValidatePayload.mockReturnValue({
        isValid: true,
        eventType: 'customer.created',
      });
      mockTransformCustomerToSegment.mockReturnValue({
        userId: 'test@example.com',
        traits: { email: 'test@example.com' },
      });
      mockSendCustomerToSegment.mockResolvedValue({ success: true });

      await handler(snsEvent as SNSEvent, mockContext);

      expect(mockValidatePayload).toHaveBeenCalledTimes(1);
    });

    it('should transform customer data using existing transformer', async () => {
      const payload = createCustomerCreatedPayload();
      const snsEvent = createSnsEventWithCustomerCreated(payload);

      mockValidatePayload.mockReturnValue({
        isValid: true,
        eventType: 'customer.created',
      });
      mockTransformCustomerToSegment.mockReturnValue({
        userId: 'test@example.com',
        traits: { email: 'test@example.com' },
      });
      mockSendCustomerToSegment.mockResolvedValue({ success: true });

      await handler(snsEvent as SNSEvent, mockContext);

      expect(mockTransformCustomerToSegment).toHaveBeenCalledTimes(1);
    });

    it('should send data to Segment using existing integration service', async () => {
      const payload = createCustomerCreatedPayload();
      const snsEvent = createSnsEventWithCustomerCreated(payload);
      const segmentPayload = {
        userId: 'test@example.com',
        traits: { email: 'test@example.com' },
      };

      mockValidatePayload.mockReturnValue({
        isValid: true,
        eventType: 'customer.created',
      });
      mockTransformCustomerToSegment.mockReturnValue(segmentPayload);
      mockSendCustomerToSegment.mockResolvedValue({ success: true });

      await handler(snsEvent as SNSEvent, mockContext);

      expect(mockSendCustomerToSegment).toHaveBeenCalledTimes(1);
      expect(mockSendCustomerToSegment).toHaveBeenCalledWith(segmentPayload);
    });
  });

  describe('Processing SNS events with customer.updated payload', () => {
    it('should return 200 status code when processing customer.updated event successfully', async () => {
      const payload = createCustomerUpdatedPayload();
      const snsEvent = createSnsEventWithCustomerUpdated(payload);

      mockValidatePayload.mockReturnValue({
        isValid: true,
        eventType: 'customer.updated',
      });
      mockTransformCustomerToSegment.mockReturnValue({
        userId: 'update@example.com',
        traits: { email: 'update@example.com' },
      });
      mockSendCustomerToSegment.mockResolvedValue({ success: true });

      const result = await handler(snsEvent as SNSEvent, mockContext);

      expect(result.statusCode).toBe(200);
    });

    it('should process customer.updated event through complete flow', async () => {
      const payload = createCustomerUpdatedPayload();
      const snsEvent = createSnsEventWithCustomerUpdated(payload);

      mockValidatePayload.mockReturnValue({
        isValid: true,
        eventType: 'customer.updated',
      });
      mockTransformCustomerToSegment.mockReturnValue({
        userId: 'update@example.com',
        traits: { email: 'update@example.com', name: 'Updated User' },
      });
      mockSendCustomerToSegment.mockResolvedValue({ success: true });

      await handler(snsEvent as SNSEvent, mockContext);

      expect(mockValidatePayload).toHaveBeenCalledTimes(1);
      expect(mockTransformCustomerToSegment).toHaveBeenCalledTimes(1);
      expect(mockSendCustomerToSegment).toHaveBeenCalledTimes(1);
    });
  });

  describe('Processing SNS subscription confirmation events', () => {
    it('should return 200 status code for subscription confirmation', async () => {
      const snsEvent = createSnsSubscriptionConfirmationEvent();

      const result = await handler(snsEvent as SNSEvent, mockContext);

      expect(result.statusCode).toBe(200);
    });

    it('should identify subscription confirmation event type', async () => {
      const snsEvent = createSnsSubscriptionConfirmationEvent();

      await handler(snsEvent as SNSEvent, mockContext);

      // Subscription confirmation should not call validator
      expect(mockValidatePayload).not.toHaveBeenCalled();
    });

    it('should handle subscription confirmation without processing business logic', async () => {
      const snsEvent = createSnsSubscriptionConfirmationEvent();

      await handler(snsEvent as SNSEvent, mockContext);

      expect(mockValidatePayload).not.toHaveBeenCalled();
      expect(mockTransformCustomerToSegment).not.toHaveBeenCalled();
      expect(mockSendCustomerToSegment).not.toHaveBeenCalled();
    });
  });

  describe('Processing SNS events with multiple records', () => {
    it('should process each record in SNS event', async () => {
      const payload1 = createCustomerCreatedPayload();
      const payload2 = createCustomerUpdatedPayload();
      const snsEvent = createSnsEventWithMultipleRecords([payload1, payload2]);

      mockValidatePayload
        .mockReturnValueOnce({
          isValid: true,
          eventType: 'customer.created',
        })
        .mockReturnValueOnce({
          isValid: true,
          eventType: 'customer.updated',
        });
      mockTransformCustomerToSegment
        .mockReturnValueOnce({
          userId: 'test1@example.com',
          traits: { email: 'test1@example.com' },
        })
        .mockReturnValueOnce({
          userId: 'test2@example.com',
          traits: { email: 'test2@example.com' },
        });
      mockSendCustomerToSegment
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true });

      const result = await handler(snsEvent as SNSEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockValidatePayload).toHaveBeenCalledTimes(2);
      expect(mockTransformCustomerToSegment).toHaveBeenCalledTimes(2);
      expect(mockSendCustomerToSegment).toHaveBeenCalledTimes(2);
    });

    it('should extract Commercetools payload from each record Message field', async () => {
      const payload1 = createCustomerCreatedPayload();
      const payload2 = createCustomerUpdatedPayload();
      const snsEvent = createSnsEventWithMultipleRecords([payload1, payload2]);

      mockValidatePayload
        .mockReturnValueOnce({
          isValid: true,
          eventType: 'customer.created',
        })
        .mockReturnValueOnce({
          isValid: true,
          eventType: 'customer.updated',
        });
      mockTransformCustomerToSegment
        .mockReturnValueOnce({
          userId: 'test1@example.com',
          traits: { email: 'test1@example.com' },
        })
        .mockReturnValueOnce({
          userId: 'test2@example.com',
          traits: { email: 'test2@example.com' },
        });
      mockSendCustomerToSegment
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true });

      await handler(snsEvent as SNSEvent, mockContext);

      expect(mockValidatePayload).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling', () => {
    it('should return 400 status code when payload validation fails', async () => {
      const payload = createCustomerCreatedPayload();
      const snsEvent = createSnsEventWithCustomerCreated(payload);

      mockValidatePayload.mockReturnValue({
        isValid: false,
        error: 'Invalid payload structure',
      });

      const result = await handler(snsEvent as SNSEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(result.body).toContain('error');
    });

    it('should return 400 status code when customer data is missing from payload', async () => {
      // Create payload without customer field
      const payload = {
        notificationType: 'Message' as const,
        type: 'CustomerCreated',
        resource: {
          typeId: 'customer' as const,
          id: 'test-customer-id',
        },
        projectKey: 'test-project',
        id: 'notification-id',
        version: 1,
        sequenceNumber: 1,
        resourceVersion: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastModifiedAt: '2024-01-01T00:00:00.000Z',
      };
      const snsEvent = createSnsEventWithCustomerCreated(payload);

      mockValidatePayload.mockReturnValue({
        isValid: true,
        eventType: 'customer.created',
      });
      // extractCustomerFromPayload would return null because customer field is missing

      const result = await handler(snsEvent as SNSEvent, mockContext);

      expect(result.statusCode).toBe(400);
    });

    it('should return 500 status code when Segment integration fails', async () => {
      const payload = createCustomerCreatedPayload();
      const snsEvent = createSnsEventWithCustomerCreated(payload);

      mockValidatePayload.mockReturnValue({
        isValid: true,
        eventType: 'customer.created',
      });
      mockTransformCustomerToSegment.mockReturnValue({
        userId: 'test@example.com',
        traits: { email: 'test@example.com' },
      });
      mockSendCustomerToSegment.mockResolvedValue({
        success: false,
        error: { message: 'Segment API error' },
      });

      const result = await handler(snsEvent as SNSEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(result.body).toContain('error');
    });

    it('should return 400 status code when email is missing from transformed payload', async () => {
      const payload = createCustomerCreatedPayload();
      const snsEvent = createSnsEventWithCustomerCreated(payload);

      mockValidatePayload.mockReturnValue({
        isValid: true,
        eventType: 'customer.created',
      });
      mockTransformCustomerToSegment.mockReturnValue({
        userId: '',
        traits: { email: '' },
      });

      const result = await handler(snsEvent as SNSEvent, mockContext);

      expect(result.statusCode).toBe(400);
    });

    it('should handle JSON parse errors from SNS Message field', async () => {
      const invalidSnsEvent: SNSEvent = {
        Records: [
          {
            EventSource: 'aws:sns',
            EventVersion: '1.0',
            EventSubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:test-topic:subscription-id',
            Sns: {
              Type: 'Notification',
              MessageId: 'test-message-id',
              TopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
              Message: 'invalid json {',
              Timestamp: new Date().toISOString(),
              SignatureVersion: '1',
              Signature: 'test-signature',
              SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/cert.pem',
              UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
            },
          },
        ],
      };

      const result = await handler(invalidSnsEvent, mockContext);

      expect(result.statusCode).toBe(400);
    });
  });

  describe('Response format', () => {
    it('should return response with statusCode, body, and optional headers', async () => {
      const payload = createCustomerCreatedPayload();
      const snsEvent = createSnsEventWithCustomerCreated(payload);

      mockValidatePayload.mockReturnValue({
        isValid: true,
        eventType: 'customer.created',
      });
      mockTransformCustomerToSegment.mockReturnValue({
        userId: 'test@example.com',
        traits: { email: 'test@example.com' },
      });
      mockSendCustomerToSegment.mockResolvedValue({ success: true });

      const result = await handler(snsEvent as SNSEvent, mockContext);

      expect(result).toHaveProperty('statusCode');
      expect(result).toHaveProperty('body');
      expect(typeof result.statusCode).toBe('number');
      expect(typeof result.body).toBe('string');
    });

    it('should return JSON body in response', async () => {
      const payload = createCustomerCreatedPayload();
      const snsEvent = createSnsEventWithCustomerCreated(payload);

      mockValidatePayload.mockReturnValue({
        isValid: true,
        eventType: 'customer.created',
      });
      mockTransformCustomerToSegment.mockReturnValue({
        userId: 'test@example.com',
        traits: { email: 'test@example.com' },
      });
      mockSendCustomerToSegment.mockResolvedValue({ success: true });

      const result = await handler(snsEvent as SNSEvent, mockContext);

      expect(() => JSON.parse(result.body)).not.toThrow();
    });
  });
});

