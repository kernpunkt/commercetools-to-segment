---
id: 17c66322-de47-41c2-b99a-a4f70a330d4b
title: STORY-2 Webhook Troubleshooting Guide
tags:
  - status/implemented
  - issue-2
  - topic/troubleshooting
  - story-2
category: DOC
created_at: '2025-11-28T07:49:03.078Z'
updated_at: '2025-11-28T07:55:12.889Z'
last_reviewed: '2025-11-28T07:49:03.078Z'
links: []
sources: []
abstract: >-
  Troubleshooting guide for STORY-2 webhook endpoint: common issues, solutions,
  debugging steps, error formats, testing checklist, security notes.
---

**Story:** #2 - Webhook Endpoint Troubleshooting Guide

**Common Issues and Solutions:**

**Issue 1: TypeScript Type Check Fails**
- Error: `File 'api/webhook.ts' is not under 'rootDir'`
- Cause: tsconfig.json rootDir is 'src' but api/ is outside
- Solution: Remove rootDir from tsconfig.json or exclude api/ from type-check
- Fix: Update tsconfig.json to handle api/ directory

**Issue 2: 400 Bad Request - Method Not Allowed**
- Error: "Method not allowed. Only POST is supported."
- Cause: Using GET, PUT, DELETE, PATCH, or other method
- Solution: Use POST method only
- Check: Verify HTTP method in request

**Issue 3: 400 Bad Request - Request Body Required**
- Error: "Request body is required"
- Cause: Missing or empty request body
- Solution: Include JSON body in POST request
- Check: Verify body is sent and not empty

**Issue 4: 400 Bad Request - Invalid JSON**
- Error: JSON.parse error message
- Cause: Malformed JSON syntax
- Solution: Validate JSON syntax before sending
- Check: Use JSON validator or JSON.parse() to test

**Issue 5: 400 Bad Request - Invalid notificationType**
- Error: "Invalid notificationType: must be 'Message'"
- Cause: notificationType field missing or incorrect
- Solution: Set notificationType to 'Message'
- Check: Verify payload structure matches Commercetools format

**Issue 6: 400 Bad Request - Missing Type Field**
- Error: "Missing or invalid type field"
- Cause: type field missing, empty, or not string
- Solution: Include type field with value 'CustomerCreated' or 'CustomerUpdated'
- Check: Verify type field exists and is non-empty string

**Issue 7: 400 Bad Request - Missing Resource Field**
- Error: "Missing or invalid resource field"
- Cause: resource field missing or invalid structure
- Solution: Include resource object with typeId and id
- Check: Verify resource: { typeId: string, id: string }

**Issue 8: 400 Bad Request - Unrecognized Event Type**
- Error: "Unrecognized event type: [type]"
- Cause: type field not 'CustomerCreated' or 'CustomerUpdated'
- Solution: Use only supported event types
- Check: Verify type is exactly 'CustomerCreated' or 'CustomerUpdated'

**Issue 9: 400 Bad Request - Missing Required Field**
- Error: "Missing or invalid [field] field"
- Cause: Required field missing or wrong type
- Solution: Include all required fields with correct types
- Required: projectKey, id, version, sequenceNumber, resourceVersion, createdAt, lastModifiedAt

**Issue 10: Handler Not Responding**
- Symptom: No response or timeout
- Cause: Handler error not caught
- Solution: Add error logging and try/catch
- Check: Review Vercel function logs

**Debugging Steps:**

1. **Verify Request Format:**
   - Check HTTP method is POST
   - Verify Content-Type is application/json
   - Validate JSON syntax

2. **Check Payload Structure:**
   - Verify all required fields present
   - Check field types match expected types
   - Validate notificationType is 'Message'
   - Verify type is 'CustomerCreated' or 'CustomerUpdated'

3. **Test Validator Functions:**
   ```typescript
   import { validateMethod, parseJSON, validatePayload } from './src/webhook/validator.js';
   
   // Test method validation
   console.log(validateMethod('POST')); // should be true
   
   // Test JSON parsing
   const parseResult = parseJSON('{"test":"value"}');
   console.log(parseResult);
   
   // Test payload validation
   const validationResult = validatePayload(testPayload);
   console.log(validationResult);
   ```

4. **Check Vercel Logs:**
   - Review function logs in Vercel dashboard
   - Look for error messages
   - Check execution time and memory usage

5. **Run Tests:**
   ```bash
   pnpm test              # Run unit tests
   pnpm test:bdd          # Run BDD tests
   pnpm test:all          # Run all tests
   ```

**Error Response Format:**
All errors return 400 Bad Request with JSON body:
```json
{
  "error": "Error message describing the issue"
}
```

**Success Response Format:**
Valid requests return 200 OK with JSON body:
```json
{
  "eventType": "customer.created" | "customer.updated"
}
```

**Testing Checklist:**
- [ ] POST method works
- [ ] GET/PUT/DELETE return 400
- [ ] Valid customer.created returns 200
- [ ] Valid customer.updated returns 200
- [ ] Missing body returns 400
- [ ] Invalid JSON returns 400
- [ ] Missing required fields return 400
- [ ] Unrecognized event type returns 400

**Performance Considerations:**
- Handler executes quickly (<100ms typical)
- No external API calls (no latency)
- JSON parsing is synchronous
- Validation is CPU-bound only

**Security Notes:**
- No authentication (by design for STORY-2)
- No rate limiting (future consideration)
- No request size limits (potential DoS risk)
- Input validation prevents injection attacks