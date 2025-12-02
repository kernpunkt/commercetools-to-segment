/**
 * AWS Lambda handler for processing SNS events containing Commercetools webhook payloads
 */

import type { Context } from 'aws-lambda';
import type { SNSEvent, LambdaResponse, ProcessingResult } from './types.js';
import type { CommercetoolsCustomer } from '../transformation/types.js';
import {
  extractCommercetoolsPayload,
  isSubscriptionConfirmation,
  convertToRequestBody,
} from './adapter.js';
import { extractCustomerFromPayload } from './customer-extractor.js';
import { validatePayload } from '../webhook/validator.js';
import { transformCustomerToSegment } from '../transformation/transformer.js';
import { sendCustomerToSegment } from '../integration/service.js';
import { logError, logInfo } from '../logger.js';

/**
 * Processes a single SNS record
 * @param record - SNS record to process
 * @returns Processing result
 */
async function processSnsRecord(
  record: SNSEvent['Records'][number]
): Promise<ProcessingResult> {
  if (isSubscriptionConfirmation(record)) {
    return handleSubscriptionConfirmation(record);
  }
  return await handleNotification(record);
}

/**
 * Validates and extracts customer from payload
 */
function validateAndExtractCustomer(
  requestBody: ReturnType<typeof convertToRequestBody>
): { customer: CommercetoolsCustomer; eventType: string } | null {
  const validationResult = validatePayload(requestBody);
  if (!validationResult.isValid) {
    logError('Payload validation failed', undefined, {
      error: validationResult.error,
    });
    return null;
  }

  const customer = extractCustomerFromPayload(requestBody);
  if (customer === null) {
    logError('Customer data not found in webhook payload', undefined, {
      eventType: validationResult.eventType,
    });
    return null;
  }

  return { customer, eventType: validationResult.eventType };
}

/**
 * Sends customer data to Segment
 */
async function sendToSegment(
  customer: CommercetoolsCustomer,
  eventType: string
): Promise<ProcessingResult> {
  const segmentPayload = transformCustomerToSegment(customer);

  if (!segmentPayload.userId || segmentPayload.userId.trim() === '') {
    logError('Customer email is required but missing', undefined, {
      eventType,
    });
    return {
      success: false,
      statusCode: 400,
      error: 'Customer email is required',
    };
  }

  logInfo('Sending customer data to Segment', {
    eventType,
    userId: segmentPayload.userId,
  });

  const segmentResult = await sendCustomerToSegment(segmentPayload);

  if (!segmentResult.success) {
    logError('Failed to send customer data to Segment', undefined, {
      eventType,
      userId: segmentPayload.userId,
      error: segmentResult.error?.message,
    });
    return {
      success: false,
      statusCode: 500,
      error: segmentResult.error?.message ?? 'Failed to send data to Segment',
    };
  }

  logInfo('Successfully sent customer data to Segment', {
    eventType,
    userId: segmentPayload.userId,
  });

  return {
    success: true,
    statusCode: 200,
  };
}

/**
 * Handles SNS notification (Commercetools webhook payload)
 * @param record - SNS record with Notification type
 * @returns Processing result
 */
async function handleNotification(
  record: SNSEvent['Records'][number]
): Promise<ProcessingResult> {
  const payload = extractCommercetoolsPayload({
    Records: [record],
  });

  if (payload === null) {
    logError(
      'Failed to extract Commercetools payload from SNS Message',
      undefined
    );
    return {
      success: false,
      statusCode: 400,
      error: 'Failed to parse SNS Message as Commercetools payload',
    };
  }

  const requestBody = convertToRequestBody(payload);
  const customerResult = validateAndExtractCustomer(requestBody);

  if (customerResult === null) {
    return {
      success: false,
      statusCode: 400,
      error: 'Invalid payload or customer data not found',
    };
  }

  return await sendToSegment(customerResult.customer, customerResult.eventType);
}

/**
 * Handles SNS subscription confirmation
 * @param record - SNS record with SubscriptionConfirmation type
 * @returns Processing result
 */
function handleSubscriptionConfirmation(
  record: SNSEvent['Records'][number]
): ProcessingResult {
  logInfo('Handling SNS subscription confirmation', {
    messageId: record.Sns.MessageId,
    topicArn: record.Sns.TopicArn,
  });
  return {
    success: true,
    statusCode: 200,
  };
}

/**
 * Main Lambda handler for SNS events
 * @param event - SNS event from AWS Lambda
 * @param context - Lambda context
 * @returns Lambda response
 */
export default async function handler(
  event: SNSEvent,
  _context: Context
): Promise<LambdaResponse> {
  try {
    // Process each record in the SNS event
    const results = await Promise.all(
      event.Records.map(record => processSnsRecord(record))
    );

    // Determine final status code
    // If all succeed, return 200
    // If any fail, return the first error status code (400 or 500)
    const allSucceeded = results.every(result => result.success);
    if (allSucceeded) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          processed: results.length,
        }),
      };
    }

    // Find first failure
    const firstFailure = results.find(result => !result.success);
    if (firstFailure) {
      return {
        statusCode: firstFailure.statusCode,
        body: JSON.stringify({
          success: false,
          error: firstFailure.error ?? 'Processing failed',
          processed: results.length,
        }),
      };
    }

    // Fallback (should not happen)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Unknown error',
      }),
    };
  } catch (error) {
    logError('Unexpected error in Lambda handler', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    };
  }
}
