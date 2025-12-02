# Commercetools Subscription Setup Guide

This guide explains how to create a webhook subscription in Commercetools to send customer events to your Segment integration via AWS SNS and Lambda.

## Overview

**Important**: Commercetools Subscriptions do **NOT** support direct HTTP webhook destinations. You must use an intermediary messaging service. This guide uses **AWS SNS** with **AWS Lambda** for processing events.

The flow will be: **Commercetools → AWS SNS → AWS Lambda → Segment**

Lambda functions are automatically subscribed to the SNS topic and process events directly without HTTP overhead.

## Prerequisites

- Commercetools project with API access
- Client credentials (Client ID and Client Secret) with subscription management permissions
- AWS account with SNS and Lambda access
- Deployed Lambda function for processing Commercetools events

## Step 1: Set Up AWS SNS and Lambda

1. **Create an SNS Topic** using AWS CDK:
   - The CDK stack automatically creates an SNS topic with environment-aware naming
   - Topic name format: `commercetools-webhook-{environment}` (e.g., `commercetools-webhook-dev`)
   - Topic ARN is exported as a stack output: `SnsTopicArn`

2. **Deploy Lambda Function**:
   - Deploy your Lambda function using AWS CDK or AWS Console
   - The Lambda function should handle Commercetools event processing
   - Lambda function ARN is exported as a stack output: `LambdaFunctionArn`

3. **Create Lambda Subscription** (Automatic):
   - When you provide a Lambda function to the CDK stack, it automatically:
     - Creates a Lambda subscription to the SNS topic
     - Grants SNS permission to invoke the Lambda function
     - Configures proper IAM permissions (least privilege)
   - No manual subscription setup required

4. **Grant Commercetools Permission**:
   - The CDK stack automatically adds a resource policy to the SNS topic
   - This allows the Commercetools IAM user to publish messages
   - Default IAM user ARN: `arn:aws:iam::362576667341:user/subscriptions`
   - You can override this via the `commercetoolsIamUserArn` prop in CDK stack

## Step 2: Create Commercetools Subscription

Use the following payload to create a subscription via the Commercetools API:

```json
{
  "key": "segment-customer-sync",
  "destination": {
    "type": "SNS",
    "topicArn": "arn:aws:sns:YOUR_REGION:YOUR_ACCOUNT_ID:commercetools-webhook",
    "authenticationMode": "IAM"
  },
  "messages": [
    {
      "resourceTypeId": "customer",
      "types": [
        "CustomerCreated",
        "CustomerUpdated"
      ]
    }
  ],
  "format": {
    "type": "Platform"
  }
}
```

## Creating the Subscription

### Using Commercetools API

1. **Get an access token:**

```bash
curl -X POST https://auth.commercetools.com/oauth/token \
  -u "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&scope=manage_project:YOUR_PROJECT_KEY"
```

2. **Create the subscription:**

```bash
curl -X POST https://api.commercetools.com/YOUR_PROJECT_KEY/subscriptions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @commercetools-subscription-payload.json
```

Replace:
- `YOUR_CLIENT_ID`: Your Commercetools client ID
- `YOUR_CLIENT_SECRET`: Your Commercetools client secret
- `YOUR_PROJECT_KEY`: Your Commercetools project key
- `YOUR_ACCESS_TOKEN`: Access token from step 1
- `YOUR_REGION`: Your AWS region (e.g., `us-east-1`)
- `YOUR_ACCOUNT_ID`: Your AWS account ID
- `commercetools-webhook`: Your SNS topic name

## Important: Lambda Event Format

When SNS invokes your Lambda function, the event structure contains the Commercetools message. Lambda automatically parses the SNS message format.

**Lambda Event Structure (SNS-triggered):**
```json
{
  "Records": [
    {
      "EventSource": "aws:sns",
      "EventVersion": "1.0",
      "EventSubscriptionArn": "arn:aws:sns:...",
      "Sns": {
        "Type": "Notification",
        "MessageId": "...",
        "TopicArn": "arn:aws:sns:...",
        "Message": "{\"notificationType\":\"Message\",\"type\":\"CustomerCreated\",...}",
        "Timestamp": "2024-01-01T00:00:00.000Z",
        "SignatureVersion": "1",
        "Signature": "...",
        "SigningCertURL": "..."
      }
    }
  ]
}
```

**Note**: Your Lambda function should extract the `Message` field from `event.Records[0].Sns.Message` and parse it as JSON to get the Commercetools payload.

## Subscription Configuration Details

### Key Fields

- **`key`**: Unique identifier for the subscription (e.g., `segment-customer-sync`)
- **`destination.type`**: Must be `SNS` (not `HTTP` or `HttpDestination`)
- **`destination.topicArn`**: AWS SNS Topic ARN
- **`destination.authenticationMode`**: Use `IAM` (recommended) or `Credentials`
- **`messages[].resourceTypeId`**: Resource type to subscribe to (`customer`)
- **`messages[].types`**: Event types to receive (`CustomerCreated`, `CustomerUpdated`)
- **`format.type`**: Use `Platform` format (default)

### Supported Event Types

The webhook endpoint supports the following Commercetools event types:

- **`CustomerCreated`**: Triggered when a new customer is created
- **`CustomerUpdated`**: Triggered when an existing customer is updated

## Verifying the Subscription

After creating the subscription:

1. **Check Lambda subscription**: Verify in AWS SNS Console that Lambda subscription is active
2. **Check Commercetools subscription status**: Verify the subscription is "Healthy" in Commercetools
3. **Test the integration**: Create or update a customer in Commercetools
4. **Check SNS delivery**: Verify messages are being delivered in AWS SNS Console
5. **Check Lambda logs**: Verify events are being processed in AWS CloudWatch Logs
6. **Verify Segment**: Confirm customer data is being synced

## Troubleshooting

### Subscription Not Receiving Events

- **Verify Lambda subscription is active**: Check AWS SNS Console that Lambda subscription exists
- **Check SNS topic permissions**: Ensure Commercetools IAM user has `sns:Publish` permission
- **Check Lambda permissions**: Verify SNS has permission to invoke Lambda (auto-granted by CDK)
- **Check Commercetools subscription status**: Should be "Healthy" - if not, check error messages
- **Review SNS delivery logs**: Check AWS CloudWatch logs for SNS delivery failures
- **Review Lambda execution logs**: Check AWS CloudWatch Logs for Lambda function errors
- **Review Commercetools subscription logs**: Check for delivery errors in Commercetools

### Lambda Function Errors

- **Check Lambda logs**: Review AWS CloudWatch Logs for your Lambda function
- **Verify environment variables**: Ensure `SEGMENT_WRITE_KEY` and other required variables are set
- **Check Lambda timeout**: Ensure Lambda timeout is sufficient for processing
- **Verify IAM permissions**: Lambda needs permissions to call Segment API
- **Review error handling**: Check Lambda function error handling and retry logic

### Common Issues

1. **Lambda not invoked**: Check SNS subscription status and Lambda permissions
2. **Lambda timeout**: Increase Lambda timeout if processing takes too long
3. **400 Bad Request**: Payload format doesn't match expected structure
4. **500 Internal Server Error**: Check Lambda CloudWatch logs for details
5. **Permission denied**: Verify IAM permissions for Lambda to call Segment API

## Updating the Subscription

To update an existing subscription:

```bash
curl -X POST https://api.commercetools.com/YOUR_PROJECT_KEY/subscriptions/key=segment-customer-sync \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @commercetools-subscription-payload.json
```

## Deleting the Subscription

To remove the subscription:

```bash
curl -X DELETE https://api.commercetools.com/YOUR_PROJECT_KEY/subscriptions/key=segment-customer-sync \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Lambda Function Implementation

Your Lambda function should handle SNS-triggered events and process Commercetools messages:

**Example Lambda Handler:**
```typescript
import { SNSEvent, SNSRecord } from 'aws-lambda';
import { extractCustomerFromPayload } from './customer-extractor';
import { identifyCustomer } from './segment-client';

export async function handler(event: SNSEvent): Promise<void> {
  for (const record of event.Records) {
    try {
      // Parse SNS message
      const snsMessage = JSON.parse(record.Sns.Message);
      
      // Extract Commercetools payload
      const commercetoolsPayload = snsMessage;
      
      // Extract customer data
      const customer = extractCustomerFromPayload(commercetoolsPayload);
      if (customer) {
        // Send to Segment
        await identifyCustomer(customer);
      }
    } catch (error) {
      console.error('Error processing SNS record:', error);
      // Consider implementing retry logic or dead-letter queue
      throw error;
    }
  }
}
```

**Key Points:**
- Lambda receives SNS events in `event.Records` array
- Each record contains `Sns.Message` which is a JSON string
- Parse the message to get Commercetools payload
- Handle errors appropriately (retry, DLQ, etc.)

## Additional Resources

- [Commercetools Subscriptions API Documentation](https://docs.commercetools.com/api/projects/subscriptions)
- [AWS SNS Lambda Subscriptions](https://docs.aws.amazon.com/sns/latest/dg/sns-lambda.html)
- [AWS SNS Message Format](https://docs.aws.amazon.com/sns/latest/dg/sns-message-and-json-formats.html)
- [AWS Lambda with SNS](https://docs.aws.amazon.com/lambda/latest/dg/with-sns.html)
- [AWS CDK Lambda Subscription](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_sns_subscriptions.LambdaSubscription.html)

