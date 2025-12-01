---
id: story5-doc-003
title: STORY-5 Troubleshooting Guide
tags:
  - status/implemented
  - story-5
  - topic/troubleshooting
  - component/webhook-handler
  - component/transformer
  - component/integration-service
  - component/segment-client
category: DOC
created_at: '2025-01-27T12:00:00.000Z'
updated_at: '2025-01-27T12:00:00.000Z'
last_reviewed: '2025-01-27T12:00:00.000Z'
links: []
sources: []
---

# Troubleshooting Guide for Story 5: End-to-End Integration

## Common Issues and Solutions

### Issue 1: "Method not allowed. Only POST is supported."

**Symptoms:**
- Webhook endpoint returns `400 Bad Request`
- Error message: "Method not allowed. Only POST is supported."

**Causes:**
- HTTP method is not POST (e.g., GET, PUT, DELETE)
- Commercetools webhook configuration is incorrect

**Solutions:**
1. Verify Commercetools webhook is configured to use POST method
2. Check webhook URL in Commercetools dashboard
3. Ensure webhook endpoint is `/api/webhook` (not `/api/webhook/`)

**Debugging:**
```typescript
// Check request method in logs
console.log('Request method:', req.method);
// Should be 'POST'
```

---

### Issue 2: "Request body is required" or "Invalid JSON format"

**Symptoms:**
- Webhook endpoint returns `400 Bad Request`
- Error message: "Request body is required" or "Invalid JSON format"

**Causes:**
- Request body is missing
- Request body is not valid JSON
- Content-Type header is incorrect

**Solutions:**
1. Verify Commercetools sends JSON payload
2. Check Content-Type header is `application/json`
3. Validate JSON syntax in webhook payload
4. Ensure Vercel is not modifying the request body

**Debugging:**
```typescript
// Check request body
console.log('Request body type:', typeof req.body);
console.log('Request body:', req.body);
// Should be object (Vercel auto-parses JSON) or string
```

**Test Payload:**
```json
{
  "notificationType": "Message",
  "type": "CustomerCreated",
  "resource": { "typeId": "customer", "id": "123" },
  "projectKey": "test",
  "id": "456",
  "version": 1,
  "sequenceNumber": 1,
  "resourceVersion": 1,
  "createdAt": "2025-01-27T12:00:00.000Z",
  "lastModifiedAt": "2025-01-27T12:00:00.000Z",
  "customer": { "email": "test@example.com" }
}
```

---

### Issue 3: "Invalid notificationType: must be 'Message'"

**Symptoms:**
- Webhook endpoint returns `400 Bad Request`
- Error message: "Invalid notificationType: must be 'Message'"

**Causes:**
- Webhook payload has incorrect `notificationType` field
- Payload structure doesn't match Commercetools format

**Solutions:**
1. Verify Commercetools webhook payload structure
2. Check `notificationType` field is exactly `"Message"` (case-sensitive)
3. Ensure payload matches Commercetools webhook format

**Debugging:**
```typescript
// Check notificationType
console.log('Notification type:', payload.notificationType);
// Should be 'Message'
```

---

### Issue 4: "Missing or invalid type field" or "Unrecognized event type"

**Symptoms:**
- Webhook endpoint returns `400 Bad Request`
- Error message: "Missing or invalid type field" or "Unrecognized event type"

**Causes:**
- `type` field is missing or empty
- `type` field value is not recognized (must be `CustomerCreated` or `CustomerUpdated`)

**Solutions:**
1. Verify `type` field is present in payload
2. Check `type` value is `CustomerCreated` or `CustomerUpdated` (case-sensitive)
3. Ensure Commercetools webhook is configured for customer events

**Valid Types:**
- `CustomerCreated` → Maps to `customer.created`
- `CustomerUpdated` → Maps to `customer.updated`

**Debugging:**
```typescript
// Check type field
console.log('Type:', payload.type);
// Should be 'CustomerCreated' or 'CustomerUpdated'
```

---

### Issue 5: "Customer data not found in payload"

**Symptoms:**
- Webhook endpoint returns `400 Bad Request`
- Error message: "Customer data not found in payload"

**Causes:**
- `customer` field is missing in webhook payload
- `customer` field is null or not an object

**Solutions:**
1. Verify `customer` field is present in payload
2. Check `customer` is an object (not null or array)
3. Ensure Commercetools webhook includes customer data

**Debugging:**
```typescript
// Check customer field
console.log('Customer:', payload.customer);
// Should be object with customer data
```

**Expected Structure:**
```json
{
  "customer": {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### Issue 6: "Customer email is required"

**Symptoms:**
- Webhook endpoint returns `400 Bad Request`
- Error message: "Customer email is required"

**Causes:**
- Customer email is missing or empty
- Email field is null or whitespace-only string

**Solutions:**
1. Verify customer has `email` field
2. Check email is not empty or whitespace
3. Ensure Commercetools customer has email address

**Debugging:**
```typescript
// Check email
console.log('Email:', customer.email);
// Should be non-empty string
```

**Note:** Email is required because it's used as `userId` in Segment.

---

### Issue 7: "Failed to send data to Segment" (500 Error)

**Symptoms:**
- Webhook endpoint returns `500 Internal Server Error`
- Error message: "Failed to send data to Segment"

**Causes:**
- `SEGMENT_WRITE_KEY` environment variable is missing
- Segment write key is invalid
- Segment API is unavailable
- Network connectivity issues
- Flush operation timed out (5 seconds)

**Solutions:**
1. **Check Environment Variable:**
   ```bash
   # Local development
   echo $SEGMENT_WRITE_KEY
   
   # Vercel
   # Check in Vercel dashboard → Settings → Environment Variables
   ```

2. **Verify Write Key:**
   - Check Segment dashboard for correct write key
   - Ensure write key is not expired or revoked
   - Verify write key has correct permissions

3. **Check Network Connectivity:**
   - Verify server can reach Segment API
   - Check firewall rules allow outbound HTTPS
   - Test Segment API endpoint manually

4. **Check Timeout:**
   - Flush operation has 5-second timeout
   - If timeout occurs, check Segment API status
   - Consider increasing timeout if needed

**Debugging:**
```typescript
// Check environment variable
console.log('Segment write key set:', !!process.env.SEGMENT_WRITE_KEY);
console.log('Segment write key length:', process.env.SEGMENT_WRITE_KEY?.length);

// Check Segment client creation
try {
  const client = getSegmentClientFromEnvironment();
  console.log('Segment client created successfully');
} catch (error) {
  console.error('Failed to create Segment client:', error);
}
```

**Environment Setup:**
```bash
# Local development (.env file)
SEGMENT_WRITE_KEY=your-segment-write-key-here

# Vercel (via dashboard or CLI)
vercel env add SEGMENT_WRITE_KEY
```

---

### Issue 8: User Not Appearing in Segment

**Symptoms:**
- Webhook returns `200 OK` but user doesn't appear in Segment dashboard
- No errors in logs

**Causes:**
- Segment API call succeeded but data not synced yet
- Segment workspace/destination configuration issue
- User ID (email) format issue
- Segment API rate limiting

**Solutions:**
1. **Check Segment Dashboard:**
   - Go to Segment dashboard → Sources → Debugger
   - Look for identify events with correct userId
   - Verify events are being received

2. **Verify User ID:**
   - User ID should be email address
   - Check email format is valid
   - Ensure email matches what's in Segment

3. **Check Segment Destinations:**
   - Verify destinations are configured correctly
   - Check destination is enabled and active
   - Verify destination can receive identify events

4. **Wait for Sync:**
   - Segment may take a few seconds to sync
   - Check dashboard after 10-30 seconds
   - Refresh Segment dashboard

**Debugging:**
```typescript
// Log Segment payload
console.log('Sending to Segment:', {
  userId: payload.userId,
  traits: payload.traits
});

// Check Segment result
const result = await sendCustomerToSegment(payload);
console.log('Segment result:', result);
```

---

### Issue 9: Name Not Appearing in Segment Traits

**Symptoms:**
- User appears in Segment but `name` trait is missing
- Email and address are present but name is not

**Causes:**
- Customer data doesn't have name fields (firstName, lastName, fullName)
- Name extraction logic didn't find valid name
- Name fields are empty or whitespace-only

**Solutions:**
1. **Check Customer Data:**
   ```typescript
   console.log('Customer name fields:', {
     firstName: customer.firstName,
     lastName: customer.lastName,
     fullName: customer.fullName
   });
   ```

2. **Verify Name Extraction Priority:**
   - Priority: `fullName` > `firstName + lastName` > `firstName` > `lastName`
   - If `fullName` is present, it takes priority
   - If only `firstName` or `lastName`, that value is used

3. **Check Transformation:**
   ```typescript
   const payload = transformCustomerToSegment(customer);
   console.log('Transformed payload:', payload);
   // Check payload.traits.name
   ```

**Name Extraction Rules:**
- `fullName` takes highest priority
- `firstName + lastName` combined if both present
- `firstName` alone if only firstName present
- `lastName` alone if only lastName present
- `undefined` if no name fields present

---

### Issue 10: Address Not Appearing in Segment Traits

**Symptoms:**
- User appears in Segment but `address` trait is missing
- Email and name are present but address is not

**Causes:**
- Customer data doesn't have addresses
- Address fields are all empty or null
- First address in array is empty

**Solutions:**
1. **Check Customer Addresses:**
   ```typescript
   console.log('Customer addresses:', customer.addresses);
   // Should be array with at least one address
   ```

2. **Verify Address Extraction:**
   - Only first address in array is used
   - Address must have at least one non-empty field
   - `streetName` and `streetNumber` are combined into `street`

3. **Check Transformation:**
   ```typescript
   const payload = transformCustomerToSegment(customer);
   console.log('Transformed address:', payload.traits.address);
   ```

**Address Extraction Rules:**
- Uses first address from `addresses` array
- Combines `streetName` and `streetNumber` into `street`
- Includes `city`, `postalCode`, `country` if available
- Returns `undefined` if no addresses or all fields empty

---

### Issue 11: Flush Operation Timeout

**Symptoms:**
- Webhook returns `500 Internal Server Error`
- Error message: "Flush operation timed out after 5 seconds"

**Causes:**
- Segment API is slow to respond
- Network latency is high
- Segment API is experiencing issues

**Solutions:**
1. **Check Segment API Status:**
   - Visit Segment status page
   - Check for ongoing incidents
   - Verify API is operational

2. **Increase Timeout (if needed):**
   ```typescript
   // In src/integration/service.ts
   const timeoutPromise = new Promise<never>((_, reject) => {
     setTimeout(() => {
       reject(new Error('Flush operation timed out after 10 seconds'));
     }, 10000); // Increase from 5000 to 10000
   });
   ```

3. **Check Network:**
   - Verify server has good network connectivity
   - Check firewall rules
   - Test Segment API endpoint manually

---

### Issue 12: Vercel Deployment Issues

**Symptoms:**
- Webhook works locally but fails on Vercel
- Environment variables not working
- Function timeout errors

**Solutions:**
1. **Check Environment Variables:**
   - Go to Vercel dashboard → Project → Settings → Environment Variables
   - Verify `SEGMENT_WRITE_KEY` is set
   - Ensure variable is available for Production, Preview, and Development
   - Redeploy after adding environment variables

2. **Check Function Logs:**
   - Go to Vercel dashboard → Project → Functions → `/api/webhook`
   - View function logs for errors
   - Check execution time and memory usage

3. **Verify Deployment:**
   ```bash
   # Check deployment status
   vercel ls
   
   # View logs
   vercel logs
   ```

4. **Test Endpoint:**
   ```bash
   # Test deployed endpoint
   curl -X POST https://your-app.vercel.app/api/webhook \
     -H "Content-Type: application/json" \
     -d '{ ... }'
   ```

---

## Debugging Tips

### Enable Detailed Logging

```typescript
// In api/webhook.ts, add logging:
logInfo('Webhook received', {
  method: req.method,
  hasBody: !!req.body,
  bodyType: typeof req.body
});

logInfo('Payload validated', {
  eventType: validationResult.eventType
});

logInfo('Customer extracted', {
  email: customer.email,
  hasName: !!(customer.firstName || customer.lastName || customer.fullName),
  hasAddress: !!(customer.addresses && customer.addresses.length > 0)
});

logInfo('Segment payload', {
  userId: segmentPayload.userId,
  hasName: !!segmentPayload.traits.name,
  hasAddress: !!segmentPayload.traits.address
});
```

### Test Individual Components

```typescript
// Test transformer
import { transformCustomerToSegment } from './src/transformation/transformer.js';
const payload = transformCustomerToSegment(customer);
console.log('Transformed:', payload);

// Test integration service
import { sendCustomerToSegment } from './src/integration/service.js';
const result = await sendCustomerToSegment(payload);
console.log('Segment result:', result);

// Test Segment client
import { getSegmentClientFromEnvironment } from './src/segment/client.js';
const client = getSegmentClientFromEnvironment();
console.log('Client created:', !!client);
```

### Verify Webhook Payload Structure

```typescript
// Log full payload structure
console.log('Full payload:', JSON.stringify(payload, null, 2));

// Check required fields
const requiredFields = [
  'notificationType',
  'type',
  'resource',
  'customer'
];
requiredFields.forEach(field => {
  console.log(`${field}:`, payload[field] !== undefined);
});
```

---

## Error Response Reference

### 400 Bad Request Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Method not allowed. Only POST is supported." | Wrong HTTP method | Use POST method |
| "Request body is required" | Missing request body | Include JSON body |
| "Invalid JSON format" | Invalid JSON syntax | Fix JSON syntax |
| "Invalid notificationType: must be 'Message'" | Wrong notificationType | Set to "Message" |
| "Missing or invalid type field" | Missing or empty type | Include type field |
| "Unrecognized event type" | Unknown type value | Use CustomerCreated or CustomerUpdated |
| "Customer data not found in payload" | Missing customer field | Include customer object |
| "Customer email is required" | Missing or empty email | Include email in customer |

### 500 Internal Server Error

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Failed to send data to Segment" | Segment API error | Check SEGMENT_WRITE_KEY, network, Segment API status |
| "Flush operation timed out" | Segment API timeout | Check network, increase timeout if needed |

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check Logs:**
   - Local: Console output
   - Vercel: Dashboard → Functions → Logs

2. **Verify Configuration:**
   - Environment variables are set correctly
   - Webhook URL is correct
   - Segment write key is valid

3. **Test Components:**
   - Test transformer with sample data
   - Test integration service with mock client
   - Test Segment client creation

4. **Review Documentation:**
   - API Documentation (story5-doc-001)
   - Usage Examples (story5-doc-002)
   - Architecture Documentation (story5-arc-001)

**Story:** #5

