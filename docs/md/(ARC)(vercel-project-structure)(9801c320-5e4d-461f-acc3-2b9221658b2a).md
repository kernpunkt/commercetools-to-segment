---
id: 9801c320-5e4d-461f-acc3-2b9221658b2a
title: Vercel Project Structure
tags:
  - status/active
  - issue-1
  - component/project-structure
  - architecture
category: ARC
created_at: '2025-11-27T12:34:28.349Z'
updated_at: '2025-11-27T12:34:28.349Z'
last_reviewed: '2025-11-27T12:34:28.349Z'
links: []
sources: []
---

**Component:** Project Directory Structure

**File Structure:**
```
project-root/
├── api/                    # Vercel serverless functions
│   └── webhook.ts         # Webhook handler endpoint
├── src/                    # Library code (existing)
├── dist/                   # Compiled output
│   ├── api/               # Compiled serverless functions
│   └── src/               # Compiled library code
├── vercel.json            # Vercel configuration
├── tsconfig.json          # TypeScript config (includes api/)
├── package.json           # Dependencies + scripts
└── README.md             # Setup instructions
```

**Vercel Configuration:**
```json
{
  "functions": {
    "api/webhook.ts": {
      "runtime": "nodejs24.x"
    }
  },
  "rewrites": []
}
```

**Build Output:**
- `tsc` compiles `api/*.ts` → `dist/api/*.js`
- Vercel serves `dist/api/webhook.js` as `/api/webhook` endpoint

**Diagrams:**
```mermaid
graph TD
    A[Source Code] --> B[TypeScript Compiler]
    B --> C[dist/api/webhook.js]
    C --> D[Vercel Deployment]
    D --> E[/api/webhook endpoint]
    
    F[api/webhook.ts] --> B
    G[src/**/*.ts] --> B
    B --> H[dist/src/**/*.js]
    
    style E fill:#51cf66
```

**Story:** #1