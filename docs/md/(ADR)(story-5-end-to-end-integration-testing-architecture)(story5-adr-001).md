---
id: story5-adr-001
title: End-to-End Integration Testing Architecture
tags:
  - status/active
  - issue-5
  - story-5
  - testing
  - integration
category: ADR
created_at: '2025-11-28T12:00:00.000Z'
updated_at: '2025-11-28T12:00:00.000Z'
last_reviewed: '2025-11-28T12:00:00.000Z'
links: []
sources: []
---

**Decision:** Test complete flow from webhook to Segment API with real component integration, verify data in Segment, support local and Vercel testing

**Rationale:**
- E2E tests verify all components work together
- Real Segment API calls validate actual integration
- Local testing enables development workflow
- Vercel testing validates production deployment

**Trade-offs:**
+realistic testing +catches integration issues +validates deployment
-requires test Segment workspace -slower than unit tests -external dependencies

**Impact:**
- BDD scenarios test complete flow: webhook → transform → Segment
- Tests verify users appear in Segment with correct data
- Tests support both local dev and Vercel deployment
- Manual testing procedures documented for validation

**Story:** #5

