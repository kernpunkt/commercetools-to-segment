# Commercetools Subscription Setup Guide

This guide explains how to create a webhook subscription in Commercetools to send customer events to your Segment integration endpoint.

## Overview

**Important**: Commercetools Subscriptions do **NOT** support direct HTTP webhook destinations. You must use an intermediary messaging service. This guide uses **AWS SNS** which can push messages to HTTP endpoints (webhooks).

The flow will be: **Commercetools → AWS SNS → Your Webhook Endpoint**

Your webhook endpoint at `/api/webhook` will still receive HTTP POST requests - they'll just be routed through SNS instead of coming directly from Commercetools.

## Prerequisites

- Commercetools project with API access
- Client credentials (Client ID and Client Secret) with subscription management permissions
- AWS account with SNS access
- Deployed webhook endpoint URL (e.g., `https://your-project-name.vercel.app/api/webhook`)

## Step 1: Set Up AWS SNS

1. **Create an SNS Topic** in AWS Console:
   - Go to AWS SNS Console
   - Create a new topic (e.g., `commercetools-webhook`)
   - Note the Topic ARN (format: `arn:aws:sns:REGION:ACCOUNT_ID:TOPIC_NAME`)

2. **Create an HTTP/HTTPS Subscription**:
   - In your SNS topic, click "Create subscription"
   - Protocol: **HTTPS**
   - Endpoint: Your webhook URL (e.g., `https://your-project-name.vercel.app/api/webhook`)
   - Click "Create subscription"
   - **Important**: SNS will send a confirmation request to your endpoint. Your endpoint must return a `200 OK` response to confirm the subscription.

3. **Grant Commercetools Permission**:
   - In SNS topic settings, go to "Access policy"
   - Add the following statement to allow Commercetools to publish:
   ```json
   {
     "Sid": "AllowCommercetoolsPublish",
     "Effect": "Allow",
     "Principal": {
       "AWS": "arn:aws:iam::362576667341:user/subscriptions"
     },
     "Action": "SNS:Publish",
     "Resource": "arn:aws:sns:YOUR_REGION:YOUR_ACCOUNT_ID:YOUR_TOPIC_NAME"
   }
   ```

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

## Important: SNS Message Format

When SNS delivers messages to your HTTP endpoint, the payload structure is different from direct Commercetools webhooks. SNS wraps the Commercetools message in an SNS envelope.

Your webhook endpoint needs to handle the SNS message format. The actual Commercetools payload will be in the `Message` field of the SNS notification, and it will be a JSON string that needs to be parsed.

**SNS Message Structure:**
```json
{
  "Type": "Notification",
  "MessageId": "...",
  "TopicArn": "arn:aws:sns:...",
  "Message": "{\"notificationType\":\"Message\",\"type\":\"CustomerCreated\",...}",
  "Timestamp": "2024-01-01T00:00:00.000Z",
  "SignatureVersion": "1",
  "Signature": "...",
  "SigningCertURL": "..."
}
```

**Note**: You may need to update your webhook handler to extract the `Message` field from SNS notifications and parse it as JSON.

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

1. **Confirm SNS subscription**: Check AWS SNS Console that your HTTP endpoint subscription is confirmed
2. **Check Commercetools subscription status**: Verify the subscription is "Healthy" in Commercetools
3. **Test the webhook**: Create or update a customer in Commercetools
4. **Check SNS delivery**: Verify messages are being delivered in AWS SNS Console
5. **Check Vercel function logs**: Verify webhook events are being received
6. **Verify Segment**: Confirm customer data is being synced

## Troubleshooting

### Subscription Not Receiving Events

- **Verify SNS subscription is confirmed**: SNS sends a confirmation request that must be acknowledged
- **Check SNS topic permissions**: Ensure Commercetools IAM user has `sns:Publish` permission
- **Verify webhook URL is correct**: Check the SNS subscription endpoint matches your webhook URL
- **Check Commercetools subscription status**: Should be "Healthy" - if not, check error messages
- **Review SNS delivery logs**: Check AWS CloudWatch logs for SNS delivery failures
- **Review Commercetools subscription logs**: Check for delivery errors in Commercetools

### SNS Subscription Confirmation

When you create an HTTPS subscription in SNS, SNS will send a confirmation request to your endpoint. Your webhook must:
1. Handle the `SubscriptionConfirmation` message type
2. Extract the `SubscribeURL` from the message
3. Make an HTTP GET request to that URL to confirm the subscription

**Example SNS Confirmation Message:**
```json
{
  "Type": "SubscriptionConfirmation",
  "MessageId": "...",
  "Token": "...",
  "TopicArn": "arn:aws:sns:...",
  "Message": "You have chosen to subscribe...",
  "SubscribeURL": "https://sns.region.amazonaws.com/?Action=ConfirmSubscription&Token=...",
  "Timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Webhook Endpoint Errors

- Check Vercel function logs for error details
- Verify `SEGMENT_WRITE_KEY` environment variable is set
- Ensure the webhook payload matches expected format
- Review webhook validation errors in function logs

### Common Issues

1. **404 Not Found**: Webhook URL is incorrect or endpoint doesn't exist
2. **401 Unauthorized**: Authentication issues (if using protected endpoints)
3. **400 Bad Request**: Payload format doesn't match expected structure
4. **500 Internal Server Error**: Check Vercel function logs for details

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

## Alternative: Azure Event Grid

If you prefer Azure over AWS, you can use **Azure Event Grid** instead of SNS:

```json
{
  "key": "segment-customer-sync",
  "destination": {
    "type": "EventGrid",
    "uri": "https://YOUR_TOPIC_NAME.region.eventgrid.azure.net/api/events",
    "accessKey": "YOUR_ACCESS_KEY"
  },
  "messages": [
    {
      "resourceTypeId": "customer",
      "types": ["CustomerCreated", "CustomerUpdated"]
    }
  ],
  "format": {
    "type": "CloudEvents",
    "cloudEventsVersion": "1.0"
  }
}
```

Azure Event Grid can also push directly to HTTP endpoints (webhooks) and supports CloudEvents format.

## Updating Your Webhook Handler

Your current webhook handler expects direct Commercetools payloads. When using SNS, you'll need to:

1. **Extract the SNS message**: Parse the SNS notification envelope
2. **Handle subscription confirmations**: Respond to SNS subscription confirmation requests
3. **Parse the inner message**: Extract and parse the JSON string from the `Message` field

**Example SNS Handler Logic:**
```typescript
// Check if it's an SNS subscription confirmation
if (payload.Type === 'SubscriptionConfirmation') {
  // Fetch the SubscribeURL to confirm
  await fetch(payload.SubscribeURL);
  return res.status(200).json({ confirmed: true });
}

// For notifications, extract the inner message
if (payload.Type === 'Notification') {
  const commercetoolsPayload = JSON.parse(payload.Message);
  // Process as normal...
}
```

## Additional Resources

- [Commercetools Subscriptions API Documentation](https://docs.commercetools.com/api/projects/subscriptions)
- [AWS SNS HTTP/HTTPS Subscriptions](https://docs.aws.amazon.com/sns/latest/dg/sns-http-https-endpoint-as-subscriber.html)
- [AWS SNS Message Format](https://docs.aws.amazon.com/sns/latest/dg/sns-message-and-json-formats.html)
- [Azure Event Grid Webhook Delivery](https://learn.microsoft.com/en-us/azure/event-grid/webhook-event-delivery)
- [Webhook Configuration Guide](../README.md#webhook-configuration)

