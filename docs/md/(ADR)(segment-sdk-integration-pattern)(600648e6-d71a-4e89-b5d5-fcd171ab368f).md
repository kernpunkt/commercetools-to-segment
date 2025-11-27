---
id: 600648e6-d71a-4e89-b5d5-fcd171ab368f
title: Segment SDK Integration Pattern
tags:
  - status/active
  - issue-1
  - segment
  - sdk
  - integration
category: ADR
created_at: '2025-11-27T12:33:57.936Z'
updated_at: '2025-11-27T12:33:57.936Z'
last_reviewed: '2025-11-27T12:33:57.936Z'
links: []
sources: []
---

**Decision:** Use `@segment/analytics-node` SDK with singleton pattern per function invocation

**Rationale:**
- Node.js SDK: Designed for serverless/server environments (not browser SDK)
- Singleton: Reuse client instance within function execution, avoid re-initialization overhead
- Write key: From `SEGMENT_WRITE_KEY` env var

**Trade-offs:**
+official SDK +TypeScript support +serverless-optimized
-SDK dependency -env var required

**Impact:**
- Dependency: Add `@segment/analytics-node` to package.json
- Initialization: `new Analytics({ writeKey: process.env.SEGMENT_WRITE_KEY })`
- Usage: `analytics.identify()` for customer sync
- Env: Document `SEGMENT_WRITE_KEY` in README

**Story:** #1