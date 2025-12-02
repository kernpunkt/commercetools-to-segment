---
id: 954cd310-6b0b-43e9-a131-52f76090a8b0
title: STORY-17 SNS Infrastructure Usage Examples
tags:
  - story-17
  - status/implemented
  - topic/examples
  - component/infrastructure
  - component/sns
category: DOC
created_at: '2025-12-02T08:29:10.352Z'
updated_at: '2025-12-02T08:32:46.975Z'
last_reviewed: '2025-12-02T08:29:10.352Z'
links: []
sources: []
abstract: >-
  Practical usage examples for SNS infrastructure: basic usage, environment
  configuration, custom IAM ARN, tags, and testing patterns
---

# STORY-17 SNS Infrastructure Usage Examples

**Component:** SNS Topic Infrastructure  
**Story:** #17  
**Last Updated:** 2025-12-02

## Basic Usage

### Minimal Stack Creation

Create a stack with default configuration (dev environment, default IAM user):

```typescript
import { App } from 'aws-cdk-lib';
import { CdkStack } from './infrastructure/lib/stack';

const app = new App();
const stack = new CdkStack(app, 'CommercetoolsWebhookStack');

// Access topic properties
console.log(stack.topicName); // commercetools-webhook-dev
console.log(stack.topicArn);   // arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev
```

### With Environment Configuration

Specify environment for topic naming:

```typescript
import { App } from 'aws-cdk-lib';
import { CdkStack, type CdkStackProps } from './infrastructure/lib/stack';

const app = new App();

// Development environment
const devStack = new CdkStack(app, 'DevStack', {
  environment: 'dev',
  env: {
    account: '123456789012',
    region: 'us-east-1',
  },
});

// Staging environment
const stagingStack = new CdkStack(app, 'StagingStack', {
  environment: 'staging',
  env: {
    account: '123456789012',
    region: 'us-east-1',
  },
});

// Production environment
const prodStack = new CdkStack(app, 'ProdStack', {
  environment: 'prod',
  env: {
    account: '987654321098',
    region: 'us-west-2',
  },
});
```

## Custom IAM User ARN

Use a custom IAM user ARN for Commercetools access:

```typescript
import { App } from 'aws-cdk-lib';
import { CdkStack, type CdkStackProps } from './infrastructure/lib/stack';

const app = new App();
const stack = new CdkStack(app, 'CustomIamStack', {
  environment: 'prod',
  commercetoolsIamUserArn: 'arn:aws:iam::999999999999:user/custom-commercetools-user',
  env: {
    account: '123456789012',
    region: 'us-east-1',
  },
});
```

## Stack Tags

Add tags for resource organization:

```typescript
import { App } from 'aws-cdk-lib';
import { CdkStack, type CdkStackProps } from './infrastructure/lib/stack';

const app = new App();
const stack = new CdkStack(app, 'TaggedStack', {
  environment: 'prod',
  tags: {
    Environment: 'production',
    Project: 'commercetools-to-segment',
    Owner: 'platform-team',
    CostCenter: 'engineering',
  },
  env: {
    account: '123456789012',
    region: 'us-east-1',
  },
});
```

## Complete Configuration

Full stack configuration with all options:

```typescript
import { App } from 'aws-cdk-lib';
import { CdkStack, type CdkStackProps } from './infrastructure/lib/stack';

const app = new App();

const props: CdkStackProps = {
  description: 'Commercetools webhook SNS topic infrastructure',
  environment: 'prod',
  commercetoolsIamUserArn: 'arn:aws:iam::362576667341:user/subscriptions',
  tags: {
    Environment: 'production',
    Project: 'commercetools-to-segment',
    ManagedBy: 'cdk',
  },
  env: {
    account: '123456789012',
    region: 'us-east-1',
  },
};

const stack = new CdkStack(app, 'CommercetoolsWebhookStack', props);
```

## Accessing Stack Outputs

Get the topic ARN from CloudFormation outputs:

```typescript
import { App } from 'aws-cdk-lib';
import { CdkStack } from './infrastructure/lib/stack';

const app = new App();
const stack = new CdkStack(app, 'WebhookStack', {
  environment: 'dev',
  env: {
    account: '123456789012',
    region: 'us-east-1',
  },
});

// Synthesize stack to get outputs
const assembly = app.synth();
const template = assembly.getStackByName(stack.stackName).template;
const topicArn = template.Outputs?.SnsTopicArn?.Value;

console.log('Topic ARN:', topicArn);
// Note: In CloudFormation, this will be a Ref token
// Use stack.topicArn for the computed value in tests
```

## Testing Patterns

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { App } from 'aws-cdk-lib';
import { CdkStack, type CdkStackProps } from './infrastructure/lib/stack';

describe('CdkStack Usage', () => {
  it('should create stack with default configuration', () => {
    const app = new App();
    const stack = new CdkStack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });

    expect(stack.topicName).toBe('commercetools-webhook-dev');
    expect(stack.topicArn).toContain('arn:aws:sns:');
    expect(stack.topicArn).toContain('commercetools-webhook-dev');
  });

  it('should create stack with custom environment', () => {
    const app = new App();
    const stack = new CdkStack(app, 'TestStack', {
      environment: 'staging',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });

    expect(stack.topicName).toBe('commercetools-webhook-staging');
  });

  it('should create stack with custom IAM user ARN', () => {
    const app = new App();
    const customArn = 'arn:aws:iam::999999999999:user/custom-user';
    const stack = new CdkStack(app, 'TestStack', {
      commercetoolsIamUserArn: customArn,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });

    // Verify IAM policy in CloudFormation template
    const assembly = app.synth();
    const template = assembly.getStackByName(stack.stackName).template;
    const policyResource = Object.values(template.Resources).find(
      (r) => r?.Type === 'AWS::SNS::TopicPolicy'
    );

    expect(policyResource).toBeDefined();
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { App } from 'aws-cdk-lib';
import { CdkStack } from './infrastructure/lib/stack';

describe('CdkStack Integration', () => {
  it('should synthesize valid CloudFormation template', () => {
    const app = new App();
    const stack = new CdkStack(app, 'IntegrationStack', {
      environment: 'prod',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });

    const assembly = app.synth();
    const template = assembly.getStackByName(stack.stackName).template;

    // Verify SNS topic resource
    const topicResource = Object.values(template.Resources).find(
      (r) => r?.Type === 'AWS::SNS::Topic'
    );
    expect(topicResource).toBeDefined();
    expect(topicResource?.Properties?.TopicName).toBe('commercetools-webhook-prod');

    // Verify IAM policy resource
    const policyResource = Object.values(template.Resources).find(
      (r) => r?.Type === 'AWS::SNS::TopicPolicy'
    );
    expect(policyResource).toBeDefined();

    // Verify stack output
    expect(template.Outputs?.SnsTopicArn).toBeDefined();
  });
});
```

## Error Handling Examples

### Invalid Environment

```typescript
import { App } from 'aws-cdk-lib';
import { CdkStack } from './infrastructure/lib/stack';

const app = new App();

try {
  const stack = new CdkStack(app, 'InvalidStack', {
    environment: 'invalid' as 'dev' | 'staging' | 'prod',
    env: {
      account: '123456789012',
      region: 'us-east-1',
    },
  });
} catch (error) {
  console.error(error.message);
  // Output: "Invalid environment: invalid. Must be one of: dev, staging, prod"
}
```

### Invalid IAM ARN Format

```typescript
import { App } from 'aws-cdk-lib';
import { CdkStack } from './infrastructure/lib/stack';

const app = new App();

try {
  const stack = new CdkStack(app, 'InvalidArnStack', {
    commercetoolsIamUserArn: 'invalid-arn-format',
    env: {
      account: '123456789012',
      region: 'us-east-1',
    },
  });
} catch (error) {
  console.error(error.message);
  // Output: "Invalid IAM user ARN format: invalid-arn-format. Expected format: arn:aws:iam::ACCOUNT_ID:user/USER_NAME"
}
```

## Multi-Environment Deployment

Deploy the same stack to multiple environments:

```typescript
import { App } from 'aws-cdk-lib';
import { CdkStack, type CdkStackProps } from './infrastructure/lib/stack';

const app = new App();

const environments: ReadonlyArray<'dev' | 'staging' | 'prod'> = [
  'dev',
  'staging',
  'prod',
];

environments.forEach((env) => {
  const stack = new CdkStack(app, `${env}-webhook-stack`, {
    environment: env,
    tags: {
      Environment: env,
      Project: 'commercetools-to-segment',
    },
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
});
```

## CDK App Integration

Complete CDK app setup:

```typescript
// bin/app.ts
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { CdkStack, type CdkStackProps } from '../lib/stack';

const app = new App();

const stackProps: CdkStackProps = {
  description: 'Commercetools webhook SNS infrastructure',
  environment: (process.env.ENVIRONMENT as 'dev' | 'staging' | 'prod') || 'dev',
  commercetoolsIamUserArn: process.env.COMMERCETOOLS_IAM_USER_ARN,
  tags: {
    Environment: process.env.ENVIRONMENT || 'dev',
    Project: 'commercetools-to-segment',
    ManagedBy: 'cdk',
  },
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
};

new CdkStack(app, 'CommercetoolsWebhookStack', stackProps);

app.synth();
```

## Environment Variables

Use environment variables for configuration:

```bash
# .env file
ENVIRONMENT=prod
COMMERCETOOLS_IAM_USER_ARN=arn:aws:iam::362576667341:user/subscriptions
CDK_DEFAULT_ACCOUNT=123456789012
CDK_DEFAULT_REGION=us-east-1
```

```typescript
import { App } from 'aws-cdk-lib';
import { CdkStack, type CdkStackProps } from './infrastructure/lib/stack';

const app = new App();

const stack = new CdkStack(app, 'WebhookStack', {
  environment: (process.env.ENVIRONMENT as 'dev' | 'staging' | 'prod') || 'dev',
  commercetoolsIamUserArn: process.env.COMMERCETOOLS_IAM_USER_ARN,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
```

## Common Use Cases

### 1. Development Stack

```typescript
const devStack = new CdkStack(app, 'DevStack', {
  environment: 'dev',
  env: { account: '123456789012', region: 'us-east-1' },
});
```

### 2. Production Stack with Custom IAM

```typescript
const prodStack = new CdkStack(app, 'ProdStack', {
  environment: 'prod',
  commercetoolsIamUserArn: 'arn:aws:iam::999999999999:user/prod-commercetools',
  tags: { Environment: 'production', CostCenter: 'engineering' },
  env: { account: '987654321098', region: 'us-west-2' },
});
```

### 3. Multi-Region Deployment

```typescript
const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];

regions.forEach((region) => {
  new CdkStack(app, `WebhookStack-${region}`, {
    environment: 'prod',
    env: { account: '123456789012', region },
  });
});
```