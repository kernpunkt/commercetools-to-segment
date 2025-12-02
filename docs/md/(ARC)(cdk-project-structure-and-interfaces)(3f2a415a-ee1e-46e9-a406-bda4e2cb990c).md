---
id: 3f2a415a-ee1e-46e9-a406-bda4e2cb990c
title: CDK Project Structure and Interfaces
tags:
  - status/implemented
  - issue-16
  - component/infrastructure
  - component/cdk
  - architecture
category: ARC
created_at: '2025-12-01T12:00:00.000Z'
updated_at: '2025-12-02T08:02:17.112Z'
last_reviewed: '2025-12-01T12:00:00.000Z'
links: []
sources: []
---

**Component:** AWS CDK Infrastructure Setup

**Project Structure:**
```
project-root/
├── infrastructure/          # CDK project directory
│   ├── bin/
│   │   └── app.ts           # CDK app entry point
│   ├── lib/
│   │   └── stack.ts         # Main CDK stack (empty initially)
│   ├── cdk.json             # CDK configuration
│   └── tsconfig.json        # CDK TypeScript config
├── package.json             # CDK scripts: cdk:build, cdk:deploy, cdk:destroy
└── src/                     # Existing application code (unchanged)
```

**CDK Configuration:**
- **cdk.json:** CDK CLI settings, app entry point, context
- **tsconfig.json:** TypeScript config for CDK (separate or extended)
- **package.json:** CDK dependencies (aws-cdk-lib, constructs), build scripts

**Environment Variables:**
- `CDK_DEFAULT_ACCOUNT`: AWS account ID
- `CDK_DEFAULT_REGION`: AWS region (e.g., us-east-1)
- Environment-specific: dev/staging/prod via context or env vars

**CDK Scripts:**
- `cdk:build`: Compile CDK TypeScript
- `cdk:synth`: Synthesize CloudFormation templates
- `cdk:deploy`: Deploy stack to AWS
- `cdk:destroy`: Remove stack from AWS
- `cdk:diff`: Show differences between deployed and local

**TypeScript Interfaces:**
```typescript
// CDK App Configuration
interface CdkAppConfig {
  readonly context: Record<string, string>;
  readonly env?: {
    readonly account?: string;
    readonly region?: string;
  };
}

// Stack Configuration
interface StackConfig {
  readonly env?: {
    readonly account: string;
    readonly region: string;
  };
  readonly description?: string;
  readonly tags?: Record<string, string>;
}
```

**Integration Points:**
- **pnpm workspace:** CDK code in `infrastructure/` uses same pnpm workspace
- **TypeScript:** CDK uses separate/extended tsconfig.json
- **Build:** CDK compiles independently, outputs to `infrastructure/cdk.out/`
- **Deploy:** CDK deploys to AWS, Vercel deploys serverless functions separately

**Diagrams:**

```mermaid
graph TD
    A[CDK App Entry] --> B[CDK Stack]
    B --> C[CloudFormation Template]
    C --> D[AWS Resources]
    
    E[infrastructure/bin/app.ts] --> A
    F[infrastructure/lib/stack.ts] --> B
    G[cdk.json] --> A
    H[Environment Vars] --> A
    
    I[pnpm cdk:build] --> J[TypeScript Compilation]
    J --> K[infrastructure/cdk.out/]
    L[pnpm cdk:deploy] --> M[AWS Deployment]
    K --> M
    
    style A fill:#ff9900
    style B fill:#ff9900
    style D fill:#51cf66
```

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant CDK as CDK CLI
    participant TS as TypeScript
    participant CF as CloudFormation
    participant AWS as AWS Account
    
    Dev->>CDK: pnpm cdk:build
    CDK->>TS: Compile infrastructure/
    TS-->>CDK: Compiled JS
    CDK-->>Dev: Build success
    
    Dev->>CDK: pnpm cdk:synth
    CDK->>CF: Synthesize templates
    CF-->>CDK: CloudFormation JSON
    CDK-->>Dev: Templates in cdk.out/
    
    Dev->>CDK: pnpm cdk:deploy
    CDK->>AWS: Create/Update stack
    AWS-->>CDK: Deployment status
    CDK-->>Dev: Deploy complete
```

```mermaid
classDiagram
    class CdkApp {
        +context: Record~string,string~
        +env: EnvConfig
        +synth(): void
    }
    
    class CdkStack {
        +env: EnvConfig
        +description: string
        +tags: Record~string,string~
    }
    
    class EnvConfig {
        +account: string
        +region: string
    }
    
    class CdkJson {
        +app: string
        +context: Record~string,any~
        +output: string
    }
    
    CdkApp --> CdkStack
    CdkApp --> CdkJson
    CdkStack --> EnvConfig
```

**Dependencies:**
- **aws-cdk-lib:** CDK v2 core library
- **constructs:** CDK construct base classes
- **@types/node:** Node.js type definitions
- **TypeScript:** Compiler for CDK code

**Story:** #16
