---
id: 9848fe47-a0b8-4515-875d-bfaa383dec3e
title: STORY-19 Troubleshooting Guide
tags:
  - story-19
  - status/implemented
  - topic/troubleshooting
  - component/infrastructure
  - component/lambda
  - component/sns
  - component/debugging
category: DOC
created_at: '2025-12-02T13:09:50.897Z'
updated_at: '2025-12-02T13:18:58.436Z'
last_reviewed: '2025-12-02T13:09:50.897Z'
links: []
sources: []
abstract: >-
  Comprehensive troubleshooting guide for Story-19: subscription issues, Lambda
  function problems, IAM permission errors, data processing failures,
  integration issues, debugging techniques, and prevention best practices.
---

# STORY-19 Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues with the Story-19 Lambda-SNS integration. It covers subscription setup, Lambda function execution, IAM permissions, and data processing issues.

## Table of Contents

1. [Subscription Issues](#subscription-issues)
2. [Lambda Function Issues](#lambda-function-issues)
3. [IAM Permission Issues](#iam-permission-issues)
4. [Data Processing Issues](#data-processing-issues)
5. [Integration Issues](#integration-issues)
6. [Debugging Techniques](#debugging-techniques)

## Subscription Issues

### Issue: Lambda Subscription Not Created

**Symptoms:**
- No Lambda subscription in AWS SNS Console
- Lambda function not receiving events
- CloudFormation template missing `AWS::SNS::Subscription` resource

**Diagnosis:**

1. **Check CDK Stack Props:**
```typescript
// Verify Lambda function is provided
const stack = new CdkStack(app, 'Stack', {
  lambdaFunction: myLambdaFunction, // Must be provided
});
```

2. **Check CloudFormation Template:**
```bash
# Synthesize stack
cdk synth

# Check for subscription resource
grep -A 10 "AWS::SNS::Subscription" cdk.out/*.template.json
```

3. **Check Stack Logs:**
```bash
# Deploy stack with verbose logging
cdk deploy --verbose
```

**Solutions:**

1. **Ensure Lambda Function is Provided:**
   - Verify `lambdaFunction` prop is passed to `CdkStack`
   - Check Lambda function is created before stack construction
   - Verify Lambda function is in the same account/region

2. **Check Cross-Stack Dependencies:**
   - If Lambda is in separate stack, ensure it's created first
   - Verify Lambda function ARN is accessible
   - Consider moving Lambda to same stack (recommended)

3. **Verify CDK Version:**
   - Ensure using AWS CDK v2 (`aws-cdk-lib`)
   - Check `LambdaSubscription` import is correct
   - Verify CDK dependencies are up to date

### Issue: Subscription Created But Not Active

**Symptoms:**
- Subscription exists in SNS Console but shows as "Pending"
- Lambda function not receiving events
- Subscription confirmation not received

**Diagnosis:**

1. **Check SNS Console:**
   - Navigate to SNS Topic → Subscriptions
   - Check subscription status (Pending/Confirmed)
   - Review subscription endpoint (should be Lambda ARN)

2. **Check Lambda Permissions:**
```bash
# Verify Lambda permission exists
aws lambda get-policy --function-name <function-name>
```

3. **Check CloudWatch Logs:**
   - Review Lambda function logs for subscription confirmation
   - Check for permission errors

**Solutions:**

1. **Verify IAM Permissions:**
   - Ensure `AWS::Lambda::Permission` resource exists
   - Verify SNS service principal has `lambda:InvokeFunction` permission
   - Check Lambda execution role has necessary permissions

2. **Manually Confirm Subscription:**
   - If subscription is pending, check for confirmation message
   - Lambda should auto-confirm, but verify in logs

3. **Recreate Subscription:**
   - Delete existing subscription
   - Redeploy CDK stack
   - Verify new subscription is created and confirmed

## Lambda Function Issues

### Issue: Lambda Not Invoked by SNS

**Symptoms:**
- SNS messages published but Lambda not triggered
- No CloudWatch logs for Lambda execution
- SNS delivery metrics show failures

**Diagnosis:**

1. **Check SNS Delivery Status:**
```bash
# Check SNS delivery metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/SNS \
  --metric-name NumberOfNotificationsFailed \
  --dimensions Name=TopicName,Value=commercetools-webhook-prod
```

2. **Check Lambda Permissions:**
```bash
# Verify Lambda permission
aws lambda get-policy --function-name <function-name> | jq '.Policy'
```

3. **Check Lambda Function Status:**
```bash
# Verify Lambda function exists and is active
aws lambda get-function --function-name <function-name>
```

**Solutions:**

1. **Verify IAM Permissions:**
   - Check `AWS::Lambda::Permission` resource in CloudFormation
   - Verify principal is `sns.amazonaws.com`
   - Ensure action is `lambda:InvokeFunction`
   - Verify resource ARN matches Lambda function ARN

2. **Check Lambda Function Configuration:**
   - Verify Lambda function is in same region as SNS topic
   - Check Lambda function is active (not deleted or disabled)
   - Verify Lambda handler is correct

3. **Check SNS Topic Configuration:**
   - Verify SNS topic exists and is active
   - Check topic ARN matches subscription configuration
   - Verify topic is in same region as Lambda

### Issue: Lambda Function Errors

**Symptoms:**
- Lambda function invoked but errors occur
- CloudWatch logs show error messages
- SNS delivery retries failing

**Diagnosis:**

1. **Check CloudWatch Logs:**
```bash
# View recent Lambda logs
aws logs tail /aws/lambda/<function-name> --follow
```

2. **Check Error Patterns:**
   - Review error messages in logs
   - Identify common error types
   - Check for timeout errors

3. **Check Lambda Metrics:**
```bash
# Check Lambda error rate
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=<function-name>
```

**Solutions:**

1. **Fix Code Errors:**
   - Review Lambda function code
   - Fix syntax errors
   - Handle edge cases
   - Add error handling

2. **Increase Timeout:**
   - If timeout errors, increase Lambda timeout
   - Check processing duration in CloudWatch metrics
   - Optimize code for faster execution

3. **Fix Environment Variables:**
   - Verify required environment variables are set
   - Check `SEGMENT_WRITE_KEY` is configured
   - Verify variable values are correct

4. **Add Error Handling:**
   - Implement try-catch blocks
   - Add retry logic for transient errors
   - Log errors for debugging
   - Consider dead letter queue for failed messages

### Issue: Lambda Timeout

**Symptoms:**
- Lambda execution exceeds timeout
- CloudWatch logs show timeout errors
- SNS delivery retries

**Diagnosis:**

1. **Check Lambda Duration:**
```bash
# Check Lambda duration metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=<function-name>
```

2. **Review Lambda Code:**
   - Identify slow operations
   - Check for blocking operations
   - Review external API calls

**Solutions:**

1. **Increase Timeout:**
```typescript
// In CDK stack
const lambdaFunction = new Function(stack, 'Function', {
  timeout: Duration.seconds(60), // Increase from default
  // ...
});
```

2. **Optimize Code:**
   - Reduce external API call time
   - Implement async processing
   - Cache frequently accessed data
   - Optimize data processing logic

3. **Implement Async Processing:**
   - Use async/await properly
   - Avoid blocking operations
   - Consider using Step Functions for long-running tasks

## IAM Permission Issues

### Issue: SNS Cannot Invoke Lambda

**Symptoms:**
- SNS delivery failures
- Lambda permission errors in CloudWatch
- Subscription created but not working

**Diagnosis:**

1. **Check Lambda Permission:**
```bash
# Check Lambda permission policy
aws lambda get-policy --function-name <function-name>
```

2. **Verify Permission Resource:**
```bash
# Check CloudFormation template
aws cloudformation describe-stack-resources \
  --stack-name <stack-name> \
  --query "StackResources[?ResourceType=='AWS::Lambda::Permission']"
```

**Solutions:**

1. **Verify CDK Auto-Grant:**
   - CDK should auto-grant permission when creating `LambdaSubscription`
   - Verify `LambdaSubscription` is created correctly
   - Check CDK version compatibility

2. **Manually Grant Permission (if needed):**
```typescript
// In CDK stack (should be automatic)
lambdaFunction.addPermission('SnsInvoke', {
  principal: new ServicePrincipal('sns.amazonaws.com'),
  sourceArn: snsTopic.topicArn,
});
```

3. **Check Permission Scope:**
   - Verify permission is scoped to correct SNS topic
   - Ensure Lambda ARN matches permission resource
   - Check region/account matches

### Issue: Commercetools Cannot Publish to SNS

**Symptoms:**
- Commercetools subscription shows errors
- SNS topic not receiving messages
- IAM permission denied errors

**Diagnosis:**

1. **Check SNS Topic Policy:**
```bash
# Check topic policy
aws sns get-topic-attributes --topic-arn <topic-arn>
```

2. **Verify IAM User ARN:**
   - Check Commercetools IAM user ARN format
   - Verify ARN matches topic policy
   - Ensure user exists in AWS account

**Solutions:**

1. **Verify Topic Policy:**
   - Check `AWS::SNS::TopicPolicy` resource exists
   - Verify principal is Commercetools IAM user ARN
   - Ensure action is `sns:Publish`
   - Verify resource ARN matches topic ARN

2. **Check IAM User ARN Format:**
```typescript
// Valid format: arn:aws:iam::ACCOUNT_ID:user/USER_NAME
const iamUserArn = 'arn:aws:iam::362576667341:user/subscriptions';
```

3. **Update Topic Policy:**
   - If policy is missing, redeploy CDK stack
   - Verify `commercetoolsIamUserArn` prop is set correctly
   - Check stack outputs for topic ARN

## Data Processing Issues

### Issue: Customer Extraction Fails

**Symptoms:**
- Lambda function executes but customer data not extracted
- CloudWatch logs show "Failed to extract customer"
- `extractCustomerFromPayload` returns null

**Diagnosis:**

1. **Check Payload Structure:**
```typescript
// Log payload structure
console.log('Payload:', JSON.stringify(payload, null, 2));
```

2. **Verify SNS Message Format:**
```typescript
// Check SNS message structure
const snsMessage = JSON.parse(record.Sns.Message);
console.log('SNS Message:', snsMessage);
```

3. **Test Extraction Function:**
```typescript
// Test extraction with sample payload
const testPayload = {
  customer: {
    email: 'test@example.com',
    firstName: 'Test',
  },
};
const customer = extractCustomerFromPayload(testPayload);
console.log('Extracted:', customer);
```

**Solutions:**

1. **Verify Payload Structure:**
   - Ensure payload contains `customer` object
   - Check customer object structure matches expected format
   - Verify field names are correct

2. **Handle Missing Fields:**
   - Function returns null for invalid payloads
   - Add validation before extraction
   - Log payload structure for debugging

3. **Update Extraction Logic:**
   - If payload structure changes, update extraction function
   - Add support for new fields
   - Handle edge cases

### Issue: Invalid Customer Data

**Symptoms:**
- Customer extracted but data is invalid
- Missing required fields (e.g., email)
- Data format incorrect

**Diagnosis:**

1. **Check Extracted Customer:**
```typescript
const customer = extractCustomerFromPayload(payload);
console.log('Customer:', customer);
console.log('Email:', customer?.email);
```

2. **Validate Required Fields:**
```typescript
if (!customer || !customer.email) {
  console.warn('Customer missing email');
  return;
}
```

**Solutions:**

1. **Add Validation:**
   - Validate required fields before processing
   - Check data types
   - Verify data format

2. **Handle Missing Data:**
   - Skip processing if required fields missing
   - Log warnings for missing optional fields
   - Return appropriate error responses

3. **Update Data Transformation:**
   - Transform data to required format
   - Handle null/undefined values
   - Normalize data structure

## Integration Issues

### Issue: Segment API Integration Fails

**Symptoms:**
- Customer extracted but not sent to Segment
- Segment API errors in logs
- Integration service errors

**Diagnosis:**

1. **Check Segment Write Key:**
```typescript
// Verify environment variable
console.log('Segment Key:', process.env.SEGMENT_WRITE_KEY);
```

2. **Check API Calls:**
   - Review Segment API client logs
   - Check HTTP status codes
   - Verify request format

**Solutions:**

1. **Verify Environment Variables:**
   - Ensure `SEGMENT_WRITE_KEY` is set
   - Check variable value is correct
   - Verify variable is accessible in Lambda

2. **Check API Client:**
   - Review Segment client implementation
   - Verify API endpoint is correct
   - Check request format matches API requirements

3. **Handle API Errors:**
   - Implement retry logic
   - Handle rate limiting
   - Log errors for debugging

## Debugging Techniques

### Enable Detailed Logging

```typescript
// In Lambda function
import { logger } from './logger';

logger.info('Processing SNS event', {
  requestId: context.requestId,
  recordCount: event.Records.length,
});

logger.debug('SNS record', {
  messageId: record.Sns.MessageId,
  topicArn: record.Sns.TopicArn,
});
```

### CloudWatch Logs Insights Queries

```sql
-- Find Lambda errors
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc

-- Find failed customer extractions
fields @timestamp, @message
| filter @message like /Failed to extract customer/
| sort @timestamp desc

-- Find SNS delivery failures
fields @timestamp, @message
| filter @message like /delivery failed/
| sort @timestamp desc
```

### Test Locally

```typescript
// Test Lambda handler locally
import { handler } from './handler';
import { SNSEvent } from 'aws-lambda';

const testEvent: SNSEvent = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:sns:...',
      Sns: {
        Type: 'Notification',
        MessageId: 'test-id',
        TopicArn: 'arn:aws:sns:...',
        Message: JSON.stringify({
          customer: {
            email: 'test@example.com',
          },
        }),
        Timestamp: new Date().toISOString(),
        SignatureVersion: '1',
        Signature: 'test',
        SigningCertUrl: 'https://...',
        UnsubscribeUrl: 'https://...',
      },
    },
  ],
};

await handler(testEvent, {} as Context);
```

### CDK Stack Validation

```bash
# Synthesize stack
cdk synth

# Check for errors
cdk diff

# Validate CloudFormation template
aws cloudformation validate-template \
  --template-body file://cdk.out/Stack.template.json
```

## Common Error Messages

### "Invalid IAM user ARN format"

**Cause:** IAM user ARN doesn't match expected format

**Solution:** Verify ARN format: `arn:aws:iam::ACCOUNT_ID:user/USER_NAME`

### "Invalid environment: {value}"

**Cause:** Environment value not one of: dev, staging, prod

**Solution:** Use valid environment value

### "Failed to extract customer from payload"

**Cause:** Payload structure doesn't match expected format

**Solution:** Verify payload contains `customer` object with correct structure

### "Lambda timeout"

**Cause:** Lambda execution exceeds timeout limit

**Solution:** Increase timeout or optimize code

### "Permission denied"

**Cause:** IAM permissions not configured correctly

**Solution:** Verify IAM permissions for SNS → Lambda and Commercetools → SNS

## Prevention Best Practices

1. **Comprehensive Testing:**
   - Unit tests for extraction logic
   - Integration tests for Lambda handler
   - End-to-end tests for complete flow

2. **Error Handling:**
   - Try-catch blocks for all operations
   - Graceful error handling
   - Proper error logging

3. **Monitoring:**
   - CloudWatch alarms for errors
   - SNS delivery metrics
   - Lambda execution metrics

4. **Documentation:**
   - Document expected payload formats
   - Document error handling behavior
   - Document troubleshooting steps

5. **Validation:**
   - Validate input data
   - Validate environment variables
   - Validate IAM permissions