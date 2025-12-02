import { describe, it, expect } from 'vitest';
import { CdkStack, type CdkStackProps } from '../../infrastructure/lib/stack.js';
import { App } from 'aws-cdk-lib';

describe('CdkStack', () => {
  describe('constructor', () => {
    it('should create stack instance when called with app and stackId', () => {
      const app = new App();
      const stackId = 'TestStack';

      const stack = new CdkStack(app, stackId);

      expect(stack).toBeInstanceOf(CdkStack);
      expect(stack.stackName).toBe(stackId);
    });

    it('should create stack with description when description prop is provided', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        description: 'Test stack description',
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack).toBeInstanceOf(CdkStack);
      expect(stack.templateOptions.description).toBe('Test stack description');
    });

    it('should create stack with environment when env props are provided', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack).toBeInstanceOf(CdkStack);
      expect(stack.account).toBe('123456789012');
      expect(stack.region).toBe('us-east-1');
    });

    it('should create stack with tags when tags prop is provided', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        tags: {
          Environment: 'test',
          Project: 'commercetools-to-segment',
        },
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack).toBeInstanceOf(CdkStack);
      expect(stack.tags.tagValues()).toEqual({
        Environment: 'test',
        Project: 'commercetools-to-segment',
      });
    });

    it('should create stack with all props when all props are provided', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
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

      const stack = new CdkStack(app, stackId, props);

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
});

