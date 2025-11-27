---
id: 9c90c43f-eef3-4551-97e3-7a8a5c2304e0
title: Vercel Serverless Functions Architecture
tags:
  - status/active
  - issue-1
  - vercel
  - serverless
  - architecture
category: ADR
created_at: '2025-11-27T12:33:53.595Z'
updated_at: '2025-11-27T12:33:53.595Z'
last_reviewed: '2025-11-27T12:33:53.595Z'
links: []
sources: []
---

**Decision:** Use Vercel serverless functions in `api/` directory with TypeScript ES modules

**Rationale:** 
- Vercel convention: `api/` directory auto-deployed as serverless functions
- TypeScript ES modules: Aligns with existing `tsconfig.json` (ESNext, bundler resolution)
- Serverless: Auto-scaling, pay-per-use, no infrastructure management

**Trade-offs:** 
+zero infra management +auto-scaling +Vercel integration
-cold starts -execution time limits -vendor lock-in

**Impact:** 
- Project structure: `api/webhook.ts` → `/api/webhook` endpoint
- Build: TypeScript compiles to `dist/api/` for Vercel deployment
- Config: `vercel.json` routes `/api/*` to serverless functions
- Runtime: Node.js 24.3.0+ (from package.json engines)

**Story:** #1