---
id: 6dd80d2f-c664-47f5-9d82-692ea0bda8e6
title: Environment Configuration Model
tags:
  - status/active
  - issue-1
  - component/config
  - data-model
category: ARC
created_at: '2025-11-27T12:34:22.181Z'
updated_at: '2025-11-27T12:34:22.181Z'
last_reviewed: '2025-11-27T12:34:22.181Z'
links: []
sources: []
---

**Component:** Environment Variables Configuration

**Data Model:**
```typescript
interface EnvironmentConfig {
  readonly SEGMENT_WRITE_KEY: string;
}

type EnvVar = keyof EnvironmentConfig;
```

**Validation:**
- Required: `SEGMENT_WRITE_KEY` (non-empty string)
- Source: `process.env` in serverless function
- Type: String (Segment write key format)

**Documentation:**
- README: Document required env vars
- Vercel: Set via Vercel dashboard or CLI
- Local dev: `.env.local` (gitignored)

**Diagrams:**
```mermaid
flowchart TD
    A[Serverless Function Start] --> B{Read process.env}
    B --> C{SEGMENT_WRITE_KEY exists?}
    C -->|No| D[Error: Missing env var]
    C -->|Yes| E[Initialize Segment Client]
    E --> F[Process Webhook]
    
    style D fill:#ff6b6b
    style E fill:#51cf66
```

**Story:** #1