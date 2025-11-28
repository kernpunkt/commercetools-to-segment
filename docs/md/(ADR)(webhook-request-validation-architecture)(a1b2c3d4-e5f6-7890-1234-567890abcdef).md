---
id: a1b2c3d4-e5f6-7890-1234-567890abcdef
title: Webhook Request Validation Architecture
tags:
  - status/active
  - issue-2
  - webhook
  - validation
  - architecture
category: ADR
created_at: '2025-11-27T13:00:00.000Z'
updated_at: '2025-11-27T13:00:00.000Z'
last_reviewed: '2025-11-27T13:00:00.000Z'
links: []
sources: []
---

**Decision:** Validate webhook requests at handler entry point with method check, JSON parsing, and payload structure validation

**Rationale:**
- Early validation prevents processing invalid requests
- Method validation ensures only POST requests accepted
- JSON parsing catches malformed payloads before processing
- Payload structure validation identifies event types (customer.created/updated)

**Trade-offs:**
+fail-fast validation +clear error responses +type safety
-extra parsing overhead -validation logic complexity

**Impact:**
- Handler validates HTTP method → reject non-POST with 400
- Handler parses JSON body → reject invalid JSON with 400
- Handler validates payload structure → reject malformed payloads with 400
- Handler identifies event type from `type` field → extract "CustomerCreated" or "CustomerUpdated"
- Success path returns 200, all errors return 400

**Story:** #2

