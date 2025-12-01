---
id: story5-doc-005
title: STORY-5 Architecture Summary
tags:
  - status/implemented
  - story-5
  - topic/architecture
  - component/integration
  - data-flow
category: DOC
created_at: '2025-01-27T12:00:00.000Z'
updated_at: '2025-01-27T12:00:00.000Z'
last_reviewed: '2025-01-27T12:00:00.000Z'
links: []
sources: []
---

# Architecture Summary for Story 5: End-to-End Integration

## Overview

The end-to-end integration system connects Commercetools webhooks to Segment user identification, enabling automatic customer data synchronization. The system processes customer creation and update events, transforms the data format, and sends it to Segment's Identify API.

## System Architecture

### High-Level Flow

```
Commercetools → Webhook Handler → Validator → Transformer → Integration Service → Segment Client → Segment API
```

### Component Responsibilities

1. **Webhook Handler** (`api/webhook.ts`)
   - Receives HTTP POST requests from Commercetools
   - Orchestrates the integration flow
   - Handles HTTP responses and error cases

2. **Validator** (`src/webhook/validator.ts`)
   - Validates HTTP method (POST only)
   - Parses JSON request body
   - Validates Commercetools webhook payload structure
   - Identifies event type (customer.created, customer.updated)

3. **Transformer** (`src/transformation/transformer.ts`)
   - Extracts customer data from Commercetools format
   - Transforms to Segment Identify API format
   - Handles name extraction with priority rules
   - Handles address extraction and formatting

4. **Integration Service** (`src/integration/service.ts`)
   - Manages Segment API communication
   - Handles client creation from environment
   - Implements error handling and timeouts
   - Returns success/error results

5. **Segment Client** (`src/segment/client.ts`)
   - Creates Segment Analytics client instances
   - Wraps @segment/analytics-node SDK
   - Provides identify, flush, and closeAndFlush methods

## Data Flow

### Request Flow

1. **Commercetools** sends POST request to `/api/webhook` with customer event payload
2. **Webhook Handler** receives request and validates method
3. **Validator** parses and validates JSON payload structure
4. **Webhook Handler** extracts customer data from payload
5. **Transformer** transforms customer data to Segment format
6. **Integration Service** sends data to Segment via client
7. **Segment Client** calls Segment Identify API
8. **Webhook Handler** returns HTTP 200 OK response

### Data Transformation

**Input (Commercetools):**
```typescript
interface CommercetoolsCustomer {
  readonly email?: string | null;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly fullName?: string | null;
  readonly addresses?: ReadonlyArray<CommercetoolsAddress> | null;
}
```

**Output (Segment):**
```typescript
interface SegmentIdentifyPayload {
  readonly userId: string; // email
  readonly traits: UserTraits;
}

interface UserTraits {
  readonly email: string;
  readonly name?: string;
  readonly address?: Address;
}
```

### Transformation Rules

1. **User ID:** Email address (required)
2. **Name Extraction Priority:**
   - `fullName` (highest priority)
   - `firstName + lastName` (if both present)
   - `firstName` (if only first name)
   - `lastName` (if only last name)
   - `undefined` (if none present)

3. **Address Extraction:**
   - Uses first address from addresses array
   - Combines `streetName` and `streetNumber` into `street`
   - Includes `city`, `postalCode`, `country` if available
   - Returns `undefined` if no addresses or all fields empty

## Error Handling

### Error Categories

1. **HTTP Method Errors** (400)
   - Invalid HTTP method (not POST)
   - Solution: Use POST method

2. **JSON Parsing Errors** (400)
   - Invalid JSON syntax
   - Missing request body
   - Solution: Ensure valid JSON payload

3. **Payload Validation Errors** (400)
   - Invalid notificationType
   - Missing or invalid type field
   - Missing resource field
   - Missing customer data
   - Solution: Ensure payload matches Commercetools format

4. **Data Validation Errors** (400)
   - Missing customer email
   - Solution: Ensure customer has email field

5. **Integration Errors** (500)
   - Segment API errors
   - Network connectivity issues
   - Timeout errors
   - Solution: Check SEGMENT_WRITE_KEY, network, Segment API status

### Error Response Format

**Success:**
```json
{
  "eventType": "customer.created",
  "success": true
}
```

**Error:**
```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

## Component Dependencies

### Dependency Graph

```
Webhook Handler
  ├── Validator (validateMethod, parseJSON, validatePayload)
  ├── Transformer (transformCustomerToSegment)
  └── Integration Service (sendCustomerToSegment)
        └── Segment Client (getSegmentClientFromEnvironment)
              └── Environment Config (SEGMENT_WRITE_KEY)
```

### External Dependencies

1. **@vercel/node** - Vercel serverless function types
2. **@segment/analytics-node** - Segment Analytics SDK
3. **Environment Variables:**
   - `SEGMENT_WRITE_KEY` (required) - Segment write key for API access

## Integration Points

### Commercetools Integration

- **Endpoint:** `/api/webhook`
- **Method:** POST
- **Content-Type:** application/json
- **Payload Format:** Commercetools webhook message format
- **Supported Events:** `CustomerCreated`, `CustomerUpdated`

### Segment Integration

- **API:** Segment Identify API
- **SDK:** @segment/analytics-node
- **Method:** `identify()` + `flush()`
- **Authentication:** Write key from environment variable
- **Timeout:** 5 seconds for flush operation

## Deployment Architecture

### Vercel Serverless Functions

- **Runtime:** Node.js
- **Function:** `api/webhook.ts` → `/api/webhook`
- **Configuration:** `vercel.json`
- **Environment:** Production, Preview, Development

### Environment Configuration

- **Local Development:**
  - `.env` file with `SEGMENT_WRITE_KEY`
  - Local server at `http://localhost:3000`

- **Vercel Deployment:**
  - Environment variables in Vercel dashboard
  - Automatic deployment on git push
  - Function logs in Vercel dashboard

## Testing Architecture

### Test Types

1. **Unit Tests** (Vitest)
   - Component-level testing
   - Mock dependencies
   - Test transformation logic
   - Test validation logic

2. **Integration Tests** (Cucumber BDD)
   - End-to-end flow testing
   - Real component integration
   - HTTP request/response testing
   - Segment API verification

### Test Utilities

1. **Webhook Payload Builder** (`tests/utils/webhook-payload-builder.ts`)
   - Creates valid Commercetools webhook payloads
   - Supports customer.created and customer.updated events
   - Handles data table parsing

2. **HTTP Client** (`tests/utils/http-client.ts`)
   - Sends webhook requests
   - Parses JSON responses
   - Handles errors

3. **Segment Verification** (`tests/utils/segment-verification.ts`)
   - Verifies users in Segment
   - Checks user traits
   - Placeholder for API verification

4. **Test Environment** (`tests/utils/test-environment.ts`)
   - Detects local vs Vercel environment
   - Gets webhook endpoint URL
   - Handles environment-specific configuration

## Performance Considerations

### Timeouts

- **Flush Timeout:** 5 seconds
- **Function Timeout:** Vercel default (10 seconds for Hobby, 60 seconds for Pro)

### Optimization

- **Immutable Data Structures:** Uses ReadonlyArray and readonly for performance
- **Early Returns:** Validates and returns errors early
- **Minimal Dependencies:** Only essential dependencies included

## Security Considerations

### Authentication

- **Segment Write Key:** Stored in environment variables
- **No Public Keys:** Write key never exposed in code or logs

### Validation

- **Input Validation:** All inputs validated before processing
- **Type Safety:** TypeScript strict mode for type safety
- **Error Handling:** Errors don't expose sensitive information

### Best Practices

- Environment variables for sensitive data
- No hardcoded credentials
- Proper error messages (no sensitive data)
- HTTPS only (enforced by Vercel)

## Scalability

### Current Architecture

- **Stateless:** Each request is independent
- **Serverless:** Auto-scales with Vercel
- **No Database:** No persistent state required

### Future Considerations

- **Rate Limiting:** May need rate limiting for high volume
- **Queue System:** May need queue for reliability
- **Retry Logic:** May need retry for failed Segment calls
- **Monitoring:** May need monitoring and alerting

## Monitoring and Observability

### Logging

- **Info Logs:** Successful operations, key events
- **Error Logs:** Failed operations, error details
- **Context:** Event type, userId, error messages

### Metrics

- **Success Rate:** Track successful vs failed webhooks
- **Response Time:** Track webhook processing time
- **Error Rate:** Track error frequency by type

### Debugging

- **Vercel Logs:** Function execution logs
- **Segment Debugger:** Segment dashboard for event verification
- **Local Testing:** Test locally before deployment

## Related Documentation

- **API Documentation:** See `(DOC)(story-5-api-documentation)(story5-doc-001).md`
- **Usage Examples:** See `(DOC)(story-5-usage-examples)(story5-doc-002).md`
- **Troubleshooting:** See `(DOC)(story-5-troubleshooting)(story5-doc-003).md`
- **Documentation Patterns:** See `(DOC)(story-5-documentation-patterns)(story5-doc-004).md`
- **Integration Flow:** See `(ARC)(story-5-end-to-end-integration-flow)(story5-arc-001).md`
- **Component Interfaces:** See `(ARC)(story-5-component-interfaces)(story5-arc-003).md`

**Story:** #5

