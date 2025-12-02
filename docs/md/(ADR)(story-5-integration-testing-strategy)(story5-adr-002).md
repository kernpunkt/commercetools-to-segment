---
id: story5-adr-002
title: Integration Testing Strategy
tags:
  - status/active
  - issue-5
  - story-5
  - testing
  - strategy
category: ADR
created_at: '2025-11-28T12:00:00.000Z'
updated_at: '2025-11-28T12:00:00.000Z'
last_reviewed: '2025-11-28T12:00:00.000Z'
links: []
sources: []
---

**Decision:** Use BDD scenarios with Cucumber for E2E testing, verify Segment data via API/dashboard, test both customer.created and customer.updated events

**Rationale:**
- BDD scenarios express business requirements clearly
- Cucumber enables readable test specifications
- Segment API/dashboard verification ensures data correctness
- Both event types need validation

**Trade-offs:**
+readable tests +business-focused +comprehensive coverage
-requires Segment test workspace -manual verification steps -external API dependency

**Impact:**
- Feature files define test scenarios in Gherkin
- Step definitions implement test logic
- Tests verify Segment data after webhook processing
- Manual testing procedures documented

**Story:** #5




