---
id: story5-imp-002
title: STORY-5 Testing Strategy
tags:
  - status/implemented
  - issue-5
  - story-5
  - testing
category: IMP
created_at: '2025-12-01T12:00:00.000Z'
updated_at: '2025-12-01T12:00:00.000Z'
last_reviewed: '2025-12-01T12:00:00.000Z'
links: []
sources: []
---

**Strategy:** BDD E2E tests only, no unit/integration tests (components already tested)

**E2E Test Approach:**
- Real webhook handler execution
- Real HTTP requests to endpoint (local or Vercel)
- Real Segment API calls
- Verify users in Segment (API or manual)

**Test Coverage:**
- customer.created event flow
- customer.updated event flow
- Email, name, address sync verification
- Local and Vercel deployment testing

**Verification Methods:**
1. Segment API (if available) - automated
2. Segment Dashboard - manual procedures
3. HTTP response validation - automated

**Test Environment:**
- Local: Vercel dev or mock server
- Vercel: Production deployment URL
- Segment: Test workspace with write key

**Mocks:**
- Segment user verification API (if not available)
- Real: All business logic components

**Story:** #5

