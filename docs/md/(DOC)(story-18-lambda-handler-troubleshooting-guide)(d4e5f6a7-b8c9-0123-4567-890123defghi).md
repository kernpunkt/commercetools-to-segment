---
id: d4e5f6a7-b8c9-0123-4567-890123defghi
title: STORY-18 Lambda Handler Troubleshooting Guide
tags:
  - story-18
  - status/implemented
  - topic/troubleshooting
  - component/lambda
  - component/sns
category: DOC
created_at: '2025-12-02T10:00:00.000Z'
updated_at: '2025-12-02T10:00:00.000Z'
last_reviewed: '2025-12-02T10:00:00.000Z'
links: []
sources: []
abstract: >-
  Troubleshooting guide for Lambda handler: common issues, error messages,
  debugging tips, and solutions
---

# STORY-18 Lambda Handler Troubleshooting Guide

**Component:** AWS Lambda Handler for SNS Events  
**Story:** #18  
**Last Updated:** 2025-12-02

## Common Issues and Solutions

### Issue 1: Invalid JSON in SNS Message

**Symptoms:**
- Lambda returns `400 Bad Request`
- Error message: `"Failed to parse SNS Message as Commercetools payload"`
- CloudWatch logs show JSON parse errors

**Possible Causes:**
1. SNS Message field contains invalid JSON
2. Message field is empty
3. Message field contains non-JSON data

**Solutions:**

1. **Verify SNS Message Format:**
   ```typescript
   // Check SNS event structure
   console.log('SNS Message:', event.Records[0]?.Sns?.Message);
   ```

2. **Validate JSON Before Publishing:**
   ```typescript
   // In SNS publisher (Commercetools webhook handler)
   const message = JSON.stringify(payload);
   JSON.parse(message); // Validate before publishing
   ```

3. **Check SNS Topic Configuration:**
   - Ensure message is published as JSON string
   - Verify message encoding (UTF-8)

**Debugging Steps:**
1. Check CloudWatch logs for raw SNS Message content
2. Verify message is valid JSON using JSON validator
3. Check SNS topic subscription configuration
4. Verify Commercetools webhook payload format

### Issue 2: Payload Validation Failure

**Symptoms:**
- Lambda returns `400 Bad Request`
- Error message: `"Invalid payload or customer data not found"`
- CloudWatch logs show validation errors

**Possible Causes:**
1. Missing required fields in Commercetools payload
2. Invalid payload structure
3. Customer field missing or invalid

**Solutions:**

1. **Verify Payload Structure:**
   ```typescript
   // Check payload has required fields
   const requiredFields = [
     'notificationType',
     'type',
     'resource',
     'projectKey',
   ];
   requiredFields.forEach(field => {
     if (!payload[field]) {
       console.error(`Missing required field: ${field}`);
     }
   });
   ```

2. **Check Customer Data:**
   ```typescript
   // Verify customer field exists
   if (!payload.customer) {
     console.error('Customer field is missing');
   }
   ```

3. **Validate Event Type:**
   - Ensure event type is `CustomerCreated` or `CustomerUpdated`
   - Check resource typeId is `'customer'`

**Debugging Steps:**
1. Log full payload structure in CloudWatch
2. Compare payload with expected Commercetools webhook format
3. Check Commercetools subscription configuration
4. Verify webhook payload in Commercetools dashboard

### Issue 3: Missing Customer Email

**Symptoms:**
- Lambda returns `400 Bad Request`
- Error message: `"Customer email is required"`
- Customer data exists but email is missing or empty

**Possible Causes:**
1. Customer email field is missing
2. Email field is empty string
3. Email field is null

**Solutions:**

1. **Check Customer Email:**
   ```typescript
   // Verify email exists and is not empty
   if (!customer.email || customer.email.trim() === '') {
     console.error('Customer email is required');
   }
   ```

2. **Validate Email Format:**
   ```typescript
   // Optional: Add email format validation
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(customer.email)) {
     console.error('Invalid email format');
   }
   ```

3. **Check Commercetools Customer Data:**
   - Verify customer has email in Commercetools
   - Check customer data in Commercetools dashboard
   - Ensure email is not null or empty

**Debugging Steps:**
1. Log customer object in CloudWatch
2. Check Commercetools customer record
3. Verify email field in webhook payload
4. Test with known valid customer data

### Issue 4: Segment API Failure

**Symptoms:**
- Lambda returns `500 Internal Server Error`
- Error message: Segment API error details
- CloudWatch logs show Segment API errors

**Possible Causes:**
1. Invalid Segment write key
2. Segment API rate limiting
3. Network connectivity issues
4. Invalid Segment payload format

**Solutions:**

1. **Verify Segment Write Key:**
   ```bash
   # Check environment variable
   echo $SEGMENT_WRITE_KEY
   ```

2. **Check Segment API Status:**
   - Visit Segment status page
   - Check for API outages
   - Verify API endpoint is accessible

3. **Validate Segment Payload:**
   ```typescript
   // Check payload structure
   const segmentPayload = transformCustomerToSegment(customer);
   console.log('Segment payload:', JSON.stringify(segmentPayload, null, 2));
   ```

4. **Handle Rate Limiting:**
   - Implement retry logic with exponential backoff
   - Check Segment rate limits
   - Consider batching requests

**Debugging Steps:**
1. Check CloudWatch logs for Segment API error details
2. Verify Segment write key in Lambda environment variables
3. Test Segment API with curl or Postman
4. Check Segment dashboard for delivery status

### Issue 5: Subscription Confirmation Not Handled

**Symptoms:**
- Lambda processes subscription confirmation as notification
- Validation errors for subscription confirmation payload
- Subscription not confirmed in SNS

**Possible Causes:**
1. Lambda handler not checking SNS Type field
2. Subscription confirmation payload structure different
3. Handler attempting to process confirmation as business logic

**Solutions:**

1. **Verify SNS Type Check:**
   ```typescript
   // Ensure handler checks Type field
   if (record.Sns.Type === 'SubscriptionConfirmation') {
     // Handle subscription confirmation
     return { success: true, statusCode: 200 };
   }
   ```

2. **Check Subscription Confirmation Format:**
   ```typescript
   // Subscription confirmation has different structure
   const isSubConf = isSubscriptionConfirmation(record);
   if (isSubConf) {
     // Don't process as business logic
   }
   ```

**Debugging Steps:**
1. Log SNS Type field in CloudWatch
2. Verify subscription confirmation handling
3. Check SNS topic subscription status
4. Review Lambda handler logic for Type checking

### Issue 6: Multiple Records Processing Failure

**Symptoms:**
- Lambda returns error when processing multiple records
- Some records succeed, others fail
- Inconsistent processing results

**Possible Causes:**
1. One record fails, causing entire batch to fail
2. Parallel processing issues
3. Resource contention

**Solutions:**

1. **Check Record Processing:**
   ```typescript
   // Verify each record is processed independently
   const results = await Promise.all(
     event.Records.map(record => processSnsRecord(record))
   );
   ```

2. **Handle Partial Failures:**
   ```typescript
   // Check if all records succeeded
   const allSucceeded = results.every(result => result.success);
   if (!allSucceeded) {
     // Log failed records
     results.forEach((result, index) => {
       if (!result.success) {
         console.error(`Record ${index} failed:`, result.error);
       }
     });
   }
   ```

3. **Review Error Handling:**
   - Ensure errors in one record don't affect others
   - Log individual record failures
   - Return appropriate status code based on results

**Debugging Steps:**
1. Log processing results for each record
2. Check CloudWatch logs for individual record errors
3. Verify parallel processing logic
4. Test with single record vs multiple records

## Error Messages Reference

### 400 Bad Request Errors

**"Failed to parse SNS Message as Commercetools payload"**
- **Cause:** Invalid JSON in SNS Message field
- **Solution:** Verify JSON format, check SNS message encoding

**"Invalid payload or customer data not found"**
- **Cause:** Payload validation failed or customer field missing
- **Solution:** Check payload structure, verify customer data exists

**"Customer email is required"**
- **Cause:** Customer email is missing or empty
- **Solution:** Ensure customer has valid email in Commercetools

### 500 Internal Server Error

**"Failed to send data to Segment"**
- **Cause:** Segment API call failed
- **Solution:** Check Segment write key, verify API status, check network

**"Internal server error"**
- **Cause:** Unexpected error in Lambda handler
- **Solution:** Check CloudWatch logs for stack trace, review error details

## Debugging Tips

### 1. Enable Detailed Logging

```typescript
// Add detailed logging at key points
logInfo('Processing SNS event', {
  recordCount: event.Records.length,
  messageIds: event.Records.map(r => r.Sns.MessageId),
});

logInfo('Extracted payload', {
  type: payload?.type,
  resourceId: payload?.resource?.id,
});

logInfo('Customer extracted', {
  email: customer?.email,
  hasAddresses: !!customer?.addresses,
});
```

### 2. Check CloudWatch Logs

**Key Log Locations:**
- Lambda function logs: `/aws/lambda/{function-name}`
- SNS topic logs: CloudWatch Logs Insights
- Error logs: Filter by `ERROR` level

**Useful Log Queries:**
```sql
-- Find all errors
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc

-- Find specific error
fields @timestamp, @message
| filter @message like /"Failed to parse"/
| sort @timestamp desc
```

### 3. Test with Sample Events

**Create Test SNS Event:**
```typescript
import { createSnsEventWithCustomerCreated } from './tests/utils/sns-event-builder.js';
import { createCustomerCreatedPayload } from './tests/utils/webhook-payload-builder.js';

const payload = createCustomerCreatedPayload();
const event = createSnsEventWithCustomerCreated(payload);
// Use event for local testing
```

### 4. Verify Environment Variables

```bash
# Check Lambda environment variables
aws lambda get-function-configuration \
  --function-name commercetools-webhook-handler \
  --query 'Environment.Variables'
```

### 5. Monitor Lambda Metrics

**Key Metrics to Monitor:**
- Invocations: Total number of invocations
- Duration: Execution time
- Errors: Number of errors
- Throttles: Number of throttled invocations

**CloudWatch Dashboard:**
- Create dashboard with Lambda metrics
- Set up alarms for error rate
- Monitor duration trends

## Common Patterns

### Pattern 1: Handling Missing Data

```typescript
// Always check for null/undefined
const payload = extractCommercetoolsPayload(event);
if (payload === null) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Failed to extract payload' }),
  };
}
```

### Pattern 2: Error Context Logging

```typescript
// Include context in error logs
logError('Validation failed', undefined, {
  eventType: validationResult.eventType,
  resourceId: payload?.resource?.id,
  error: validationResult.error,
});
```

### Pattern 3: Graceful Degradation

```typescript
// Handle partial failures gracefully
const results = await Promise.all(
  event.Records.map(record => processSnsRecord(record))
);

const successCount = results.filter(r => r.success).length;
const failureCount = results.filter(r => !r.success).length;

logInfo('Processing complete', {
  total: results.length,
  success: successCount,
  failures: failureCount,
});
```

## Getting Help

### Internal Resources

1. **CloudWatch Logs:** Check Lambda function logs for detailed error information
2. **AWS X-Ray:** Enable X-Ray tracing for request tracing
3. **Lambda Insights:** Use Lambda Insights for performance analysis

### External Resources

1. **AWS Lambda Documentation:** [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
2. **SNS Documentation:** [Amazon SNS Developer Guide](https://docs.aws.amazon.com/sns/)
3. **Segment Documentation:** [Segment API Documentation](https://segment.com/docs/api/)

### Support Channels

1. **AWS Support:** For AWS infrastructure issues
2. **Segment Support:** For Segment API issues
3. **Commercetools Support:** For webhook payload issues

## Prevention Best Practices

### 1. Input Validation

- Validate SNS event structure before processing
- Check for required fields in payload
- Verify data types match expected formats

### 2. Error Handling

- Always handle errors gracefully
- Return appropriate status codes
- Log errors with sufficient context

### 3. Monitoring

- Set up CloudWatch alarms for error rates
- Monitor Lambda duration and memory usage
- Track Segment API success rates

### 4. Testing

- Test with various payload formats
- Test error scenarios
- Test subscription confirmation handling
- Test multiple records processing

## Related Documentation

- [STORY-18 API Documentation](./story-18-lambda-handler-api-documentation.md)
- [STORY-18 Usage Examples](./story-18-lambda-handler-usage-examples.md)
- [STORY-18 Architecture Documentation](./story-18-lambda-handler-architectural-documentation.md)
- [STORY-17 SNS Infrastructure Troubleshooting](./story-17-sns-infrastructure-troubleshooting-guide.md)

