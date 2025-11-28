---
id: ad8c9a44-1df8-4146-87b4-2848ea4778a3
title: STORY-4 Segment Integration Troubleshooting Guide
tags:
  - story-4
  - status/active
  - topic/troubleshooting
  - issue-4
category: DOC
created_at: '2025-11-28T10:37:46.308Z'
updated_at: '2025-11-28T10:37:46.308Z'
last_reviewed: '2025-11-28T10:37:46.308Z'
links: []
sources: []
abstract: >-
  Troubleshooting guide for Segment Integration: common issues, error messages,
  debugging tips, and solutions
---

# STORY-4 Segment Integration Troubleshooting Guide

**Component:** Segment Integration Service  
**Story:** #4

## Common Issues

### Issue 1: Missing SEGMENT_WRITE_KEY

**Symptoms:**
- Error: `Missing SEGMENT_WRITE_KEY`
- Result: `{ success: false, error: { message: "..." } }`

**Cause:**
- Environment variable `SEGMENT_WRITE_KEY` not set
- Environment variable empty or whitespace

**Solution:**
```bash
# Set environment variable
export SEGMENT_WRITE_KEY="your-write-key-here"

# Or in .env file
SEGMENT_WRITE_KEY=your-write-key-here
```

**Verification:**
```typescript
import { getEnvironmentConfig } from './config/environment.js';

const config = getEnvironmentConfig();
console.log('Write key set:', !!config.SEGMENT_WRITE_KEY);
```

---

### Issue 2: Network Errors

**Symptoms:**
- Error: `Network timeout` or `Connection failed`
- Result: `{ success: false, error: { message: "Network error" } }`

**Cause:**
- Network connectivity issues
- Segment API unavailable
- Firewall blocking requests

**Solution:**
1. **Check Network Connectivity**
   ```bash
   curl https://api.segment.io/v1/identify
   ```

2. **Verify Firewall Rules**
   - Allow outbound HTTPS to `api.segment.io`
   - Port 443 must be open

3. **Check Segment Status**
   - Visit Segment status page
   - Verify API is operational

4. **Retry Logic**
   ```typescript
   async function sendWithRetry(payload, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       const result = await sendCustomerToSegment(payload);
       if (result.success) return result;
       await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
     }
     return { success: false, error: { message: 'Max retries exceeded' } };
   }
   ```

---

### Issue 3: Invalid Write Key

**Symptoms:**
- Error: `401 Unauthorized` or `Invalid write key`
- Result: `{ success: false, error: { message: "..." } }`

**Cause:**
- Write key incorrect or expired
- Write key format invalid

**Solution:**
1. **Verify Write Key**
   - Check Segment dashboard
   - Verify key is active
   - Regenerate if needed

2. **Check Key Format**
   ```typescript
   const writeKey = process.env.SEGMENT_WRITE_KEY;
   if (!writeKey || writeKey.trim().length === 0) {
     throw new Error('Write key cannot be empty');
   }
   ```

3. **Test with Valid Key**
   ```typescript
   import { createSegmentClient } from './segment/client.js';
   
   const client = createSegmentClient('test-write-key');
   // Test identify call
   ```

---

### Issue 4: Empty userId

**Symptoms:**
- API call succeeds but user not identified in Segment
- userId is empty string

**Cause:**
- Customer email missing in Commercetools data
- Transformation returns empty userId

**Solution:**
1. **Validate Before Sending**
   ```typescript
   if (!payload.userId || payload.userId.trim() === '') {
     return {
       success: false,
       error: { message: 'userId cannot be empty' },
     };
   }
   ```

2. **Check Transformation**
   ```typescript
   const payload = transformCustomerToSegment(customer);
   if (!payload.userId) {
     console.warn('Customer has no email, skipping Segment');
     return { success: false, error: { message: 'No email' } };
   }
   ```

3. **Handle Missing Email**
   ```typescript
   // In transformation service
   const email = customer.email?.trim() ?? '';
   if (email === '') {
     // Skip or use alternative identifier
   }
   ```

---

### Issue 5: Flush Not Completing

**Symptoms:**
- `identify()` succeeds but data not appearing in Segment
- No errors but data missing

**Cause:**
- `flush()` not called or failing silently
- Network issue during flush

**Solution:**
1. **Verify Flush Called**
   ```typescript
   await client.identify({ userId, traits });
   const flushResult = await client.flush();
   // Verify flush completes
   ```

2. **Check Flush Errors**
   ```typescript
   try {
     await client.identify({ userId, traits });
     await client.flush();
   } catch (error) {
     console.error('Flush error:', error);
   }
   ```

3. **Use closeAndFlush for Guaranteed Delivery**
   ```typescript
   await client.identify({ userId, traits });
   await client.closeAndFlush(); // Ensures delivery
   ```

---

### Issue 6: Type Errors

**Symptoms:**
- TypeScript compilation errors
- Type mismatches

**Cause:**
- Incorrect type imports
- Type definitions outdated

**Solution:**
1. **Verify Imports**
   ```typescript
   import type { SegmentIdentifyPayload } from './transformation/types.js';
   import type { SegmentIntegrationResult } from './integration/types.js';
   ```

2. **Check Type Definitions**
   ```typescript
   // Ensure types match
   const payload: SegmentIdentifyPayload = {
     userId: 'user@example.com',
     traits: {
       email: 'user@example.com',
     },
   };
   ```

3. **Run Type Check**
   ```bash
   pnpm type-check
   ```

---

## Error Messages Reference

### Client Initialization Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Write key cannot be empty or whitespace only` | Empty SEGMENT_WRITE_KEY | Set environment variable |
| `Missing SEGMENT_WRITE_KEY` | Variable not set | Export or set in .env |

### Segment SDK Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Network timeout` | Network issue | Check connectivity, retry |
| `Connection failed` | Network issue | Check firewall, DNS |
| `401 Unauthorized` | Invalid write key | Verify and update key |
| `400 Bad Request` | Invalid payload | Check payload format |
| `500 Internal Server Error` | Segment API issue | Check Segment status, retry |

### Integration Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `userId cannot be empty` | Missing email | Validate before sending |
| `Invalid payload` | Payload validation failed | Check payload structure |

---

## Debugging Tips

### 1. Enable Debug Logging

```typescript
import { logDebug } from './logger.js';

const result = await sendCustomerToSegment(payload);
logDebug('Segment integration result', { result, payload });
```

### 2. Check Result Type

```typescript
const result = await sendCustomerToSegment(payload);

if (result.success) {
  console.log('Success');
} else {
  console.error('Error:', result.error.message);
  // Check error details
  if (result.error.code) {
    console.error('Error code:', result.error.code);
  }
}
```

### 3. Verify Payload

```typescript
console.log('Payload:', JSON.stringify(payload, null, 2));
console.log('userId:', payload.userId);
console.log('traits:', payload.traits);
```

### 4. Test Client Directly

```typescript
import { createSegmentClient } from './segment/client.js';

const client = createSegmentClient(process.env.SEGMENT_WRITE_KEY!);
try {
  await client.identify({
    userId: 'test@example.com',
    traits: { email: 'test@example.com' },
  });
  await client.flush();
  console.log('Direct client test: Success');
} catch (error) {
  console.error('Direct client test: Error', error);
}
```

### 5. Monitor Network Requests

```typescript
// Enable network logging in Segment SDK
const client = createSegmentClient(writeKey, {
  debug: true, // If supported by SDK
});
```

---

## Testing Troubleshooting

### Issue: Mock Client Not Working

**Symptoms:**
- Tests failing with "client.identify is not a function"

**Solution:**
```typescript
// Ensure mock implements full interface
const mockClient: SegmentClient = {
  identify: vi.fn().mockResolvedValue(undefined),
  flush: vi.fn().mockResolvedValue(undefined),
  closeAndFlush: vi.fn().mockResolvedValue(undefined),
};
```

### Issue: Tests Timing Out

**Symptoms:**
- Tests hang or timeout

**Solution:**
```typescript
// Ensure all promises resolve
mockClient.identify = vi.fn().mockResolvedValue(undefined);
mockClient.flush = vi.fn().mockResolvedValue(undefined);

// Add timeout
await Promise.race([
  sendCustomerToSegmentWithClient(mockClient, payload),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 5000)
  ),
]);
```

---

## Performance Troubleshooting

### Issue: Slow Integration Calls

**Symptoms:**
- High latency per call
- Timeouts

**Solution:**
1. **Check Network Latency**
   ```bash
   ping api.segment.io
   ```

2. **Consider Client Caching**
   ```typescript
   // Cache client instance
   let cachedClient: SegmentClient | null = null;
   
   function getClient(): SegmentClient {
     if (!cachedClient) {
       cachedClient = getSegmentClientFromEnvironment();
     }
     return cachedClient;
   }
   ```

3. **Batch Operations**
   ```typescript
   // Batch multiple identifies before flush
   await Promise.all(payloads.map(p => client.identify(p)));
   await client.flush();
   ```

---

## Error Handling Best Practices

### 1. Always Check Result

```typescript
const result = await sendCustomerToSegment(payload);
if (!result.success) {
  // Handle error - don't ignore
  logError('Segment integration failed', { error: result.error });
}
```

### 2. Log Errors with Context

```typescript
if (!result.success) {
  logError('Segment integration failed', {
    error: result.error.message,
    userId: payload.userId,
    timestamp: new Date().toISOString(),
  });
}
```

### 3. Don't Expose Internal Errors

```typescript
// In webhook handler
if (!result.success) {
  // Log internally
  console.error('Segment error:', result.error.message);
  
  // Return generic error to caller
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Internal server error' }),
  };
}
```

### 4. Implement Retry Logic

```typescript
async function sendWithRetry(
  payload: SegmentIdentifyPayload,
  maxRetries = 3
): Promise<SegmentIntegrationResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendCustomerToSegment(payload);
    if (result.success) return result;
    
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return {
    success: false,
    error: { message: 'Max retries exceeded' },
  };
}
```

---

## Getting Help

### Check Documentation

1. **API Documentation:** See `STORY-4 Segment Integration Service API Documentation`
2. **Usage Examples:** See `STORY-4 Segment Integration Usage Examples`
3. **Architecture:** See `STORY-4 Segment Integration Architecture Documentation`

### Common Resources

1. **Segment API Documentation:** https://segment.com/docs/
2. **Segment Status Page:** https://status.segment.com/
3. **SDK Documentation:** https://github.com/segmentio/analytics-node

### Debug Checklist

- [ ] Environment variable `SEGMENT_WRITE_KEY` set
- [ ] Write key is valid and active
- [ ] Network connectivity to `api.segment.io`
- [ ] Payload has valid `userId` and `traits.email`
- [ ] Result checked for success/error
- [ ] Errors logged with context
- [ ] Retry logic implemented for transient errors

---

## Related Documentation

- **API Documentation:** See `STORY-4 Segment Integration Service API Documentation`
- **Usage Examples:** See `STORY-4 Segment Integration Usage Examples`
- **Architecture:** See `STORY-4 Segment Integration Architecture Documentation`
