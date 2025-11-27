---
id: 3c2cee36-bb41-4bd4-a40d-92fe190df1ef
title: TypeScript Configuration for Serverless
tags:
  - status/active
  - issue-1
  - typescript
  - configuration
category: ADR
created_at: '2025-11-27T12:34:01.980Z'
updated_at: '2025-11-27T12:34:01.980Z'
last_reviewed: '2025-11-27T12:34:01.980Z'
links: []
sources: []
---

**Decision:** Extend existing TypeScript config, add `api/` to include paths

**Rationale:**
- Consistency: Reuse existing strict TypeScript settings (ES2022, ESNext modules)
- Serverless: No changes needed, ES modules work with Vercel
- Build: Single `tsc` command compiles both `src/` and `api/`

**Trade-offs:**
+no config duplication +consistent codebase +existing tooling
-build includes both src and api

**Impact:**
- tsconfig.json: Add `"api/**/*"` to include array
- Build output: `dist/api/` for serverless functions, `dist/src/` for library code
- Types: Same strict rules apply (no any, readonly arrays, explicit types)

**Story:** #1