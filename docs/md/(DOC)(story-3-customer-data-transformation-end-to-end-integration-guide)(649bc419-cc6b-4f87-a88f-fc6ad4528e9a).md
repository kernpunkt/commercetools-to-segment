---
id: 649bc419-cc6b-4f87-a88f-fc6ad4528e9a
title: STORY-3 Customer Data Transformation End-to-End Integration Guide
tags:
  - status/implemented
  - issue-3
  - topic/integration
  - story-3
category: DOC
created_at: '2025-12-01T09:07:53.239Z'
updated_at: '2025-12-01T09:09:01.025Z'
last_reviewed: '2025-12-01T09:07:53.239Z'
links: []
sources: []
abstract: >-
  Complete end-to-end integration guide for STORY-3: data flow, component
  integration, error handling, logging, and deployment considerations
---

# STORY-3 Customer Data Transformation End-to-End Integration Guide

## Overview

This guide documents the complete end-to-end flow for transforming Commercetools customer data and sending it to Segment. It covers all integration points, data transformations, and error handling across the entire system.

## Story Context

**Story ID:** STORY-3  
**Purpose:** Transform Commercetools customer data into Segment Identify API format  
**Components:** Transformation Service, Integration Service, Webhook Handler

## Complete Data Flow

### 1. Webhook Reception

```
Commercetools Webhook
    ↓ POST /api/webhook
Vercel Serverless Function (api/webhook.ts)
    ↓
Webhook Handler (handler function)
```

**Entry Point:** `api/webhook.ts` - Default export handler

**Validation Steps:**
1. HTTP Method: Must be POST (`validateMethod`)
2. JSON Parsing: Parse request body (`parseJSON`)
3. Payload Validation: Validate Commercetools webhook structure (`validatePayload`)
4. Customer Extraction: Extract customer data from payload (`extractCustomerFromPayload`)

### 2. Customer Data Extraction

**Function:** `extractCustomerFromPayload(payload: unknown): CommercetoolsCustomer | null`

**Process:**
- Extracts `customer` object from webhook payload
- Maps fields: `email`, `firstName`, `lastName`, `fullName`, `addresses`
- Handles null/undefined values gracefully
- Returns `CommercetoolsCustomer` or `null` if not found

**Input Structure:**
```typescript
{
  customer: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    addresses?: Array<{
      streetName?: string | null;
      streetNumber?: string | null;
      city?: string | null;
      postalCode?: string | null;
      country?: string | null;
    }> | null;
  }
}
```

### 3. Data Transformation

**Function:** `transformCustomerToSegment(customer: CommercetoolsCustomer): SegmentIdentifyPayload`

**Process:**
1. **Email Extraction:**
   - Trims whitespace
   - Uses empty string if missing/null
   - Sets both `userId` and `traits.email`

2. **Name Extraction:**
   - Priority: `fullName` > `firstName + lastName` > `firstName` > `lastName`
   - Omitted if all name fields are null/empty

3. **Address Extraction:**
   - Uses first address from `addresses` array
   - Combines `streetName + streetNumber` → `street`
   - Extracts `city`, `postalCode`, `country`
   - Returns `undefined` if all address fields are null/empty

**Output Structure:**
```typescript
{
  userId: string;  // Email or empty string
  traits: {
    email: string;  // Required, empty string if missing
    name?: string;  // Optional, omitted if missing
    address?: {     // Optional, omitted if missing
      street?: string;
      city?: string;
      postalCode?: string;
      country?: string;
    };
  };
}
```

### 4. Segment Integration

**Function:** `sendCustomerToSegment(payload: SegmentIdentifyPayload): Promise<SegmentIntegrationResult>`

**Process:**
1. Get Segment client from environment (`getSegmentClientFromEnvironment()`)
2. Call `client.identify({ userId, traits })`
3. Call `client.flush()` with 5-second timeout
4. Return `SegmentIntegrationResult`

**Result Types:**
```typescript
type SegmentIntegrationResult =
  | { success: true }
  | { success: false; error: { message: string } };
```

### 5. Response Handling

**Success Response (200 OK):**
```json
{
  "eventType": "customer.created" | "customer.updated",
  "success": true
}
```

**Error Responses:**

**400 Bad Request:**
- Invalid HTTP method
- Invalid JSON
- Invalid payload structure
- Customer data not found
- Missing email (userId required)

**500 Internal Server Error:**
- Segment API errors
- Network errors
- Timeout errors

## Component Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                    Commercetools Webhook                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Webhook Handler (api/webhook.ts)                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. validateMethod()                                    │  │
│  │ 2. parseJSON()                                         │  │
│  │ 3. validatePayload()                                   │  │
│  │ 4. extractCustomerFromPayload()                        │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│        Transformation Service (transformer.ts)              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ transformCustomerToSegment()                           │  │
│  │  - Extract email → userId + traits.email               │  │
│  │  - Extract name (priority logic) → traits.name         │  │
│  │  - Extract address (first) → traits.address             │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│      Integration Service (integration/service.ts)           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ sendCustomerToSegment()                                 │  │
│  │  - Get Segment client                                   │  │
│  │  - Call client.identify()                               │  │
│  │  - Call client.flush() (with timeout)                   │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Segment Identify API                           │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

### Validation Errors (400)

**HTTP Method Error:**
```typescript
if (!validateMethod(req.method)) {
  res.status(400).json({ error: 'Method not allowed. Only POST is supported.' });
  return;
}
```

**JSON Parse Error:**
```typescript
const parseResult = parseJSON(req.body);
if (!parseResult.success) {
  res.status(400).json({ error: parseResult.error });
  return;
}
```

**Payload Validation Error:**
```typescript
const validationResult = validatePayload(parseResult.data);
if (!validationResult.isValid) {
  res.status(400).json({ error: validationResult.error });
  return;
}
```

**Customer Extraction Error:**
```typescript
const customer = extractCustomerFromPayload(parseResult.data);
if (!customer) {
  res.status(400).json({ error: 'Customer data not found in payload' });
  return;
}
```

**Missing Email Error:**
```typescript
if (!segmentPayload.userId || segmentPayload.userId.trim() === '') {
  res.status(400).json({ error: 'Customer email is required' });
  return;
}
```

### Integration Errors (500)

**Segment API Error:**
```typescript
const segmentResult = await sendCustomerToSegment(segmentPayload);
if (!segmentResult.success) {
  res.status(500).json({
    error: 'Failed to send data to Segment',
    details: segmentResult.error?.message,
  });
  return;
}
```

## Logging Points

### Info Logs

**Before Sending to Segment:**
```typescript
logInfo('Sending customer data to Segment', {
  eventType: validationResult.eventType,
  userId: segmentPayload.userId,
});
```

**After Successful Send:**
```typescript
logInfo('Successfully sent customer data to Segment', {
  eventType: validationResult.eventType,
  userId: segmentPayload.userId,
});
```

### Error Logs

**Customer Data Not Found:**
```typescript
logError('Customer data not found in webhook payload', undefined, {
  eventType: validationResult.eventType,
});
```

**Missing Email:**
```typescript
logError('Customer email is required but missing', undefined, {
  eventType: validationResult.eventType,
});
```

**Segment Integration Failure:**
```typescript
logError('Failed to send customer data to Segment', undefined, {
  eventType: validationResult.eventType,
  userId: segmentPayload.userId,
  error: segmentResult.error?.message,
});
```

## Type Flow

### Input Types

**CommercetoolsCustomer:**
```typescript
interface CommercetoolsCustomer {
  readonly email?: string | null;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly fullName?: string | null;
  readonly addresses?: ReadonlyArray<CommercetoolsAddress> | null;
}
```

### Intermediate Types

**SegmentIdentifyPayload:**
```typescript
interface SegmentIdentifyPayload {
  readonly userId: string;
  readonly traits: UserTraits;
}
```

### Output Types

**SegmentIntegrationResult:**
```typescript
type SegmentIntegrationResult =
  | { success: true }
  | { success: false; error: SegmentError };
```

## Testing Integration

### Unit Tests

**Location:** `tests/transformation/transformer.test.ts`
- Tests transformation logic in isolation
- 32 test cases covering all edge cases

### BDD Tests

**Location:** `tests/steps/story-3-customer-data-transformation.steps.ts`
- Tests end-to-end transformation behavior
- 15 scenarios from feature file

### Integration Tests

**Location:** `tests/integration/service.test.ts`
- Tests Segment integration service
- Mocks Segment client for testing

### Webhook Tests

**Location:** `tests/webhook/handler.test.ts`
- Tests complete webhook handler flow
- Mocks all external dependencies

## Deployment Considerations

### Environment Variables

**Required:**
- `SEGMENT_WRITE_KEY`: Segment write key for API authentication

### Vercel Configuration

**File:** `vercel.json`
- Routes `/api/webhook` to `api/webhook.ts`
- Serverless function configuration

### Function Timeout

- Default: 10 seconds (Vercel default)
- Flush timeout: 5 seconds (explicit timeout in code)

## Performance Characteristics

### Transformation Performance

- **Pure function:** No I/O, very fast
- **Time complexity:** O(n) where n is number of address fields
- **Typical execution:** < 1ms

### Integration Performance

- **Network calls:** 2 calls per request (identify + flush)
- **Timeout protection:** 5-second flush timeout
- **Typical execution:** 100-500ms (depends on Segment API)

### End-to-End Performance

- **Typical total time:** 200-600ms
- **Bottleneck:** Segment API response time
- **Optimization:** Flush timeout prevents hanging requests

## Security Considerations

### Input Validation

- All inputs validated before processing
- Type guards prevent type errors
- Null/undefined handling prevents crashes

### Data Sanitization

- All string inputs trimmed
- No code injection risks (no dynamic code execution)
- Type safety prevents type confusion attacks

### Error Information

- Error messages don't expose sensitive data
- Stack traces not exposed to clients
- Logging includes context without sensitive data

## Monitoring and Observability

### Key Metrics

- Request count (by event type)
- Success rate (200 vs 400 vs 500)
- Transformation time
- Integration time
- Error rate by type

### Logging Strategy

- Info logs for successful operations
- Error logs for failures with context
- Structured logging with event metadata

## Related Documentation

- **API Documentation:** See DOC memory `STORY-3 Customer Data Transformation API Documentation`
- **Usage Examples:** See DOC memory `STORY-3 Customer Data Transformation Usage Examples`
- **Architecture:** See DOC memory `STORY-3 Customer Data Transformation Architecture`
- **Troubleshooting:** See DOC memory `STORY-3 Customer Data Transformation Troubleshooting`
- **Code Review:** See CRV memory `STORY-3 Customer Data Transformation Code Review`

## Future Enhancements

### Planned Improvements

1. **Batch Processing:** Support multiple customers in single request
2. **Retry Logic:** Automatic retry for transient Segment API errors
3. **Rate Limiting:** Protect against excessive requests
4. **Webhook Signature Validation:** Validate Commercetools webhook signatures
5. **Metrics Export:** Export metrics to monitoring service

### Extension Points

- Custom field mappings
- Additional trait fields
- Multiple address support
- Custom transformation rules