import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createCdkApp,
  createCdkStack,
  getEnvironmentConfig,
  type CdkAppConfig,
} from '../../infrastructure/bin/app.js';
import { App } from 'aws-cdk-lib';
import { CdkStack } from '../../infrastructure/lib/stack.js';

describe('createCdkApp', () => {
  it('should return App instance when called without config', () => {
    const app = createCdkApp();

    expect(app).toBeInstanceOf(App);
  });

  it('should return App instance when called with empty config', () => {
    const config: CdkAppConfig = {};

    const app = createCdkApp(config);

    expect(app).toBeInstanceOf(App);
  });

  it('should return App instance with context when context config is provided', () => {
    const config: CdkAppConfig = {
      context: {
        '@aws-cdk/core:enableStackNameDuplicates': 'true',
        '@aws-cdk/core:stackRelativeExports': 'true',
      },
    };

    const app = createCdkApp(config);

    expect(app).toBeInstanceOf(App);
    expect(app.node.tryGetContext('@aws-cdk/core:enableStackNameDuplicates')).toBe('true');
    expect(app.node.tryGetContext('@aws-cdk/core:stackRelativeExports')).toBe('true');
  });

  it('should return App instance with environment when env config is provided', () => {
    const config: CdkAppConfig = {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    };

    const app = createCdkApp(config);

    expect(app).toBeInstanceOf(App);
  });

  it('should return App instance with both context and env when full config is provided', () => {
    const config: CdkAppConfig = {
      context: {
        '@aws-cdk/core:enableStackNameDuplicates': 'true',
      },
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    };

    const app = createCdkApp(config);

    expect(app).toBeInstanceOf(App);
    expect(app.node.tryGetContext('@aws-cdk/core:enableStackNameDuplicates')).toBe('true');
  });

  it('should return App instance when called with partial env config (account only)', () => {
    const config: CdkAppConfig = {
      env: {
        account: '123456789012',
      },
    };

    const app = createCdkApp(config);

    expect(app).toBeInstanceOf(App);
  });

  it('should return App instance when called with partial env config (region only)', () => {
    const config: CdkAppConfig = {
      env: {
        region: 'us-east-1',
      },
    };

    const app = createCdkApp(config);

    expect(app).toBeInstanceOf(App);
  });
});

describe('createCdkStack', () => {
  it('should return CdkStack instance when called with app and stackId', () => {
    const app = new App();
    const stackId = 'TestStack';

    const stack = createCdkStack(app, stackId);

    expect(stack).toBeInstanceOf(CdkStack);
    expect(stack.stackName).toBe(stackId);
  });

  it('should return CdkStack instance with environment when env props are provided', () => {
    const app = new App();
    const stackId = 'TestStack';
    const stackProps = {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    };

    const stack = createCdkStack(app, stackId, stackProps);

    expect(stack).toBeInstanceOf(CdkStack);
    expect(stack.account).toBe('123456789012');
    expect(stack.region).toBe('us-east-1');
  });

  it('should return CdkStack instance with description when description prop is provided', () => {
    const app = new App();
    const stackId = 'TestStack';
    const stackProps = {
      description: 'Test stack for commercetools integration',
    };

    const stack = createCdkStack(app, stackId, stackProps);

    expect(stack).toBeInstanceOf(CdkStack);
    expect(stack.templateOptions.description).toBe('Test stack for commercetools integration');
  });

  it('should return CdkStack instance with tags when tags prop is provided', () => {
    const app = new App();
    const stackId = 'TestStack';
    const stackProps = {
      tags: {
        Environment: 'test',
        Project: 'commercetools-to-segment',
      },
    };

    const stack = createCdkStack(app, stackId, stackProps);

    expect(stack).toBeInstanceOf(CdkStack);
    expect(stack.tags.tagValues()).toEqual({
      Environment: 'test',
      Project: 'commercetools-to-segment',
    });
  });

  it('should return CdkStack instance with all props when all stack props are provided', () => {
    const app = new App();
    const stackId = 'TestStack';
    const stackProps = {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      description: 'Full stack configuration',
      tags: {
        Environment: 'production',
        Project: 'commercetools-to-segment',
        Owner: 'devops-team',
      },
    };

    const stack = createCdkStack(app, stackId, stackProps);

    expect(stack).toBeInstanceOf(CdkStack);
    expect(stack.account).toBe('123456789012');
    expect(stack.region).toBe('us-east-1');
    expect(stack.templateOptions.description).toBe('Full stack configuration');
    expect(stack.tags.tagValues()).toEqual({
      Environment: 'production',
      Project: 'commercetools-to-segment',
      Owner: 'devops-team',
    });
  });
});

describe('getEnvironmentConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return empty object when environment variables are not set', () => {
    delete process.env.CDK_DEFAULT_ACCOUNT;
    delete process.env.CDK_DEFAULT_REGION;

    const config = getEnvironmentConfig();

    expect(config).toEqual({});
  });

  it('should return account when CDK_DEFAULT_ACCOUNT is set', () => {
    process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
    delete process.env.CDK_DEFAULT_REGION;

    const config = getEnvironmentConfig();

    expect(config).toEqual({
      account: '123456789012',
    });
  });

  it('should return region when CDK_DEFAULT_REGION is set', () => {
    delete process.env.CDK_DEFAULT_ACCOUNT;
    process.env.CDK_DEFAULT_REGION = 'us-east-1';

    const config = getEnvironmentConfig();

    expect(config).toEqual({
      region: 'us-east-1',
    });
  });

  it('should return both account and region when both environment variables are set', () => {
    process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
    process.env.CDK_DEFAULT_REGION = 'us-east-1';

    const config = getEnvironmentConfig();

    expect(config).toEqual({
      account: '123456789012',
      region: 'us-east-1',
    });
  });

  it('should return trimmed account value when CDK_DEFAULT_ACCOUNT has whitespace', () => {
    process.env.CDK_DEFAULT_ACCOUNT = '  123456789012  ';
    delete process.env.CDK_DEFAULT_REGION;

    const config = getEnvironmentConfig();

    expect(config).toEqual({
      account: '123456789012',
    });
  });

  it('should return trimmed region value when CDK_DEFAULT_REGION has whitespace', () => {
    delete process.env.CDK_DEFAULT_ACCOUNT;
    process.env.CDK_DEFAULT_REGION = '  us-east-1  ';

    const config = getEnvironmentConfig();

    expect(config).toEqual({
      region: 'us-east-1',
    });
  });
});

