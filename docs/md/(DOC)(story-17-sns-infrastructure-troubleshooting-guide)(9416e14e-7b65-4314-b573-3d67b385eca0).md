---
id: 9416e14e-7b65-4314-b573-3d67b385eca0
title: STORY-17 SNS Infrastructure Troubleshooting Guide
tags:
  - story-17
  - status/implemented
  - topic/troubleshooting
  - component/infrastructure
  - component/sns
category: DOC
created_at: '2025-12-02T08:30:43.049Z'
updated_at: '2025-12-02T08:32:49.474Z'
last_reviewed: '2025-12-02T08:30:43.049Z'
links: []
sources: []
abstract: >-
  Troubleshooting guide for SNS infrastructure: common issues, error messages,
  debugging tips, and solutions
---

# STORY-17 SNS Infrastructure Troubleshooting Guide

**Component:** SNS Topic Infrastructure  
**Story:** #17  
**Last Updated:** 2025-12-02

## Common Issues and Solutions

### 1. Invalid Environment Error

**Error Message:**
```
Invalid environment: invalid. Must be one of: dev, staging, prod
```

**Cause:**
- Environment value not in allowed list: `'dev'`, `'staging'`, `'prod'`
- Typo in environment value
- Wrong type passed (e.g., number instead of string)

**Solution:**
```typescript
// ❌ Wrong
const stack = new CdkStack(app, 'Stack', {
  environment: 'development', // Invalid
});

// ✅ Correct
const stack = new CdkStack(app, 'Stack', {
  environment: 'dev', // Valid
});
```

**Prevention:**
- Use TypeScript type checking
- Use constants for environment values
- Validate environment from environment variables

### 2. Invalid IAM ARN Format Error

**Error Message:**
```
Invalid IAM user ARN format: invalid-arn. Expected format: arn:aws:iam::ACCOUNT_ID:user/USER_NAME
```

**Cause:**
- IAM ARN doesn't match required format
- Missing ARN prefix
- Invalid account ID format (must be 12 digits)
- Wrong resource type (e.g., role instead of user)

**Solution:**
```typescript
// ❌ Wrong
const stack = new CdkStack(app, 'Stack', {
  commercetoolsIamUserArn: 'invalid-arn',
});

// ❌ Wrong - Invalid account ID
const stack = new CdkStack(app, 'Stack', {
  commercetoolsIamUserArn: 'arn:aws:iam::123:user/test', // Account ID too short
});

// ✅ Correct
const stack = new CdkStack(app, 'Stack', {
  commercetoolsIamUserArn: 'arn:aws:iam::123456789012:user/subscriptions',
});
```

**ARN Format Requirements:**
- Prefix: `arn:aws:iam::`
- Account ID: Exactly 12 digits
- Resource type: `user/`
- User name: Alphanumeric, hyphens, underscores, dots, equals, plus, comma, at sign

### 3. CDK Token Resolution Issues

**Symptom:**
- `topicArn` property shows token instead of actual ARN
- Tests fail when comparing ARN values

**Cause:**
- CDK uses tokens for account/region when not explicitly provided
- Token resolution happens during synthesis, not construction

**Solution:**
```typescript
// ❌ Wrong - No explicit env, tokens used
const stack = new CdkStack(app, 'Stack');
// stack.topicArn might be a token

// ✅ Correct - Explicit env provided
const stack = new CdkStack(app, 'Stack', {
  env: {
    account: '123456789012',
    region: 'us-east-1',
  },
});
// stack.topicArn is computed string
```

**For Testing:**
```typescript
// Always provide explicit env in tests
const stack = new CdkStack(app, 'TestStack', {
  env: {
    account: '123456789012',
    region: 'us-east-1',
  },
  environment: 'dev',
});

expect(stack.topicArn).toBe('arn:aws:sns:us-east-1:123456789012:commercetools-webhook-dev');
```

### 4. CloudFormation Output Shows Ref Token

**Symptom:**
- Stack output value is `{ "Ref": "CommercetoolsWebhookTopic" }` instead of ARN string

**Cause:**
- This is expected behavior - CDK uses CloudFormation intrinsic functions
- Ref token resolves to actual ARN during deployment

**Solution:**
```typescript
// This is correct - Ref token is expected
const template = app.synth().getStackByName(stack.stackName).template;
const output = template.Outputs?.SnsTopicArn?.Value;
// output = { "Ref": "CommercetoolsWebhookTopic" } ✅

// To get actual ARN, use stack.topicArn property
const actualArn = stack.topicArn; // ✅
```

**In Tests:**
```typescript
// ✅ Correct - Check for Ref token
expect(output?.Value).toHaveProperty('Ref');

// ✅ Also verify computed ARN
expect(stack.topicArn).toBe(expectedArn);
```

### 5. IAM Policy Not Attached

**Symptom:**
- Topic created but Commercetools can't publish
- IAM policy missing from CloudFormation template

**Debugging:**
```typescript
// Check if policy resource exists in template
const assembly = app.synth();
const template = assembly.getStackByName(stack.stackName).template;
const policyResource = Object.values(template.Resources).find(
  (r) => r?.Type === 'AWS::SNS::TopicPolicy'
);

if (!policyResource) {
  console.error('IAM policy resource not found in template');
}
```

**Solution:**
- Verify IAM ARN validation passed
- Check that `addToResourcePolicy()` was called
- Ensure topic was created before policy attachment

### 6. Topic Name Collision

**Symptom:**
- CloudFormation deployment fails with "Topic already exists"

**Cause:**
- Multiple stacks with same environment in same account/region
- Topic name not environment-aware

**Solution:**
```typescript
// ✅ Use unique stack names or environment-specific naming
const stack = new CdkStack(app, `WebhookStack-${env}`, {
  environment: env,
});
```

### 7. Tags Not Applied

**Symptom:**
- Tags not visible on resources in AWS Console

**Debugging:**
```typescript
// Check tags in stack
const stack = new CdkStack(app, 'Stack', {
  tags: { Environment: 'prod' },
});

// Verify tags
const tagValues = stack.tags.tagValues();
console.log(tagValues); // Should show tags
```

**Solution:**
- Tags are applied to stack, which propagates to resources
- Some resources may not show tags immediately
- Verify tags in CloudFormation template

## Debugging Tips

### 1. Enable CDK Debug Logging

```bash
export CDK_DEBUG=true
cdk synth
```

### 2. Inspect CloudFormation Template

```typescript
const app = new App();
const stack = new CdkStack(app, 'Stack', props);
const assembly = app.synth();
const template = assembly.getStackByName(stack.stackName).template;

// Print template
console.log(JSON.stringify(template, null, 2));

// Check specific resources
console.log(template.Resources);
console.log(template.Outputs);
```

### 3. Validate Stack Before Deployment

```typescript
// Run synthesis to catch errors early
const app = new App();
const stack = new CdkStack(app, 'Stack', props);

try {
  app.synth();
  console.log('Stack synthesis successful');
} catch (error) {
  console.error('Stack synthesis failed:', error);
}
```

### 4. Check IAM Policy Structure

```typescript
const assembly = app.synth();
const template = assembly.getStackByName(stack.stackName).template;
const policyResource = Object.values(template.Resources).find(
  (r) => r?.Type === 'AWS::SNS::TopicPolicy'
);

if (policyResource) {
  const policyDoc = policyResource.Properties?.PolicyDocument;
  console.log('Policy document:', JSON.stringify(policyDoc, null, 2));
}
```

### 5. Verify Topic Properties

```typescript
const stack = new CdkStack(app, 'Stack', props);

// Check computed properties
console.log('Topic Name:', stack.topicName);
console.log('Topic ARN:', stack.topicArn);

// Check CDK topic construct
console.log('SNS Topic:', stack.snsTopic);
console.log('Topic ARN (CDK):', stack.snsTopic.topicArn);
```

## Error Handling Best Practices

### 1. Validate Inputs Early

```typescript
// Validate environment from env vars
const env = process.env.ENVIRONMENT;
if (env && !['dev', 'staging', 'prod'].includes(env)) {
  throw new Error(`Invalid ENVIRONMENT: ${env}`);
}

const stack = new CdkStack(app, 'Stack', {
  environment: env as 'dev' | 'staging' | 'prod',
});
```

### 2. Handle Validation Errors

```typescript
try {
  const stack = new CdkStack(app, 'Stack', props);
} catch (error) {
  if (error instanceof Error) {
    console.error('Stack creation failed:', error.message);
    // Handle specific error types
    if (error.message.includes('Invalid environment')) {
      // Fix environment value
    } else if (error.message.includes('Invalid IAM user ARN')) {
      // Fix IAM ARN format
    }
  }
  throw error;
}
```

### 3. Test Error Cases

```typescript
describe('Error Handling', () => {
  it('should throw on invalid environment', () => {
    expect(() => {
      new CdkStack(app, 'Stack', {
        environment: 'invalid' as 'dev' | 'staging' | 'prod',
      });
    }).toThrow('Invalid environment');
  });

  it('should throw on invalid IAM ARN', () => {
    expect(() => {
      new CdkStack(app, 'Stack', {
        commercetoolsIamUserArn: 'invalid-arn',
      });
    }).toThrow('Invalid IAM user ARN format');
  });
});
```

## Common Patterns

### Pattern 1: Environment-Specific Stacks

```typescript
const environments = ['dev', 'staging', 'prod'];

environments.forEach((env) => {
  new CdkStack(app, `${env}-webhook-stack`, {
    environment: env as 'dev' | 'staging' | 'prod',
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
});
```

### Pattern 2: Error Recovery

```typescript
function createStackSafely(
  app: App,
  id: string,
  props: CdkStackProps
): CdkStack | null {
  try {
    return new CdkStack(app, id, props);
  } catch (error) {
    console.error(`Failed to create stack ${id}:`, error);
    return null;
  }
}
```

### Pattern 3: Configuration Validation

```typescript
function validateStackConfig(props: CdkStackProps): void {
  if (props.environment && !['dev', 'staging', 'prod'].includes(props.environment)) {
    throw new Error(`Invalid environment: ${props.environment}`);
  }

  if (props.commercetoolsIamUserArn) {
    const arnPattern = /^arn:aws:iam::\d{12}:user\/[\w+=,.@-]+$/;
    if (!arnPattern.test(props.commercetoolsIamUserArn)) {
      throw new Error(`Invalid IAM ARN format: ${props.commercetoolsIamUserArn}`);
    }
  }
}

// Use before stack creation
validateStackConfig(props);
const stack = new CdkStack(app, 'Stack', props);
```

## Getting Help

### Check Logs

1. **CDK Synthesis Logs:** `cdk synth --verbose`
2. **CloudFormation Events:** AWS Console → CloudFormation → Stack Events
3. **SNS Metrics:** AWS Console → CloudWatch → SNS Metrics

### Verify Resources

1. **SNS Topic:** AWS Console → SNS → Topics
2. **IAM Policy:** AWS Console → SNS → Topic → Permissions
3. **Stack Outputs:** AWS Console → CloudFormation → Stack → Outputs

### Common Questions

**Q: Why is topicArn a token?**  
A: CDK uses tokens when account/region aren't explicitly provided. Provide explicit `env` prop.

**Q: Can I use the same topic for multiple environments?**  
A: No, each environment should have its own topic. Use environment-aware naming.

**Q: How do I change the IAM user ARN?**  
A: Pass `commercetoolsIamUserArn` prop when creating the stack.

**Q: Why are tags not showing on resources?**  
A: Tags are applied to the stack and propagate to resources. Some resources may take time to show tags.

## Related Documentation

- [API Documentation](./story-17-api-documentation.md)
- [Usage Examples](./story-17-usage-examples.md)
- [Architectural Documentation](./story-17-architecture.md)