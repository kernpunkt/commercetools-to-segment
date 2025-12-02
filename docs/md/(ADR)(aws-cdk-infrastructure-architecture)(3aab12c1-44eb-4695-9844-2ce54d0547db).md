---
id: 3aab12c1-44eb-4695-9844-2ce54d0547db
title: AWS CDK Infrastructure Architecture
tags:
  - status/active
  - issue-16
  - aws
  - cdk
  - infrastructure
  - architecture
category: ADR
created_at: '2025-12-01T12:00:00.000Z'
updated_at: '2025-12-01T12:00:00.000Z'
last_reviewed: '2025-12-01T12:00:00.000Z'
links: []
sources: []
---

**Decision:** Use AWS CDK v2 (aws-cdk-lib) with TypeScript for infrastructure as code, separate from Vercel deployment

**Rationale:**
- Infrastructure as code: Version-controlled, repeatable AWS resource provisioning
- TypeScript: Aligns with existing codebase, type safety for infrastructure
- CDK v2: Stable, well-supported, modern API
- Separation: CDK manages AWS resources (Lambda, SNS), Vercel handles serverless functions

**Trade-offs:**
+IaC benefits +type safety +CDK constructs +environment management
-additional tooling -AWS account required -CDK learning curve

**Impact:**
- Project structure: `infrastructure/` directory for CDK code
- Build: `pnpm cdk:build` compiles CDK TypeScript
- Deploy: `pnpm cdk:deploy` provisions AWS resources
- Config: `cdk.json` for CDK settings, env vars for account/region
- Future: Lambda functions, SNS topics defined in CDK stacks

**Story:** #16


<<<<<<< Updated upstream
=======



>>>>>>> Stashed changes
