import { describe, it, expect } from 'vitest';
import { CdkStack, type CdkStackProps } from '../../infrastructure/lib/stack.js';
import { App } from 'aws-cdk-lib';
import { Topic } from 'aws-cdk-lib/aws-sns';

/**
 * Type definition for SNS TopicPolicy resource in CloudFormation template
 */
type TopicPolicyResource = {
  Properties?: {
    PolicyDocument?: {
      Statement?: ReadonlyArray<{
        Principal?: { AWS?: string };
        Action?: string | ReadonlyArray<string>;
      }>;
    };
  };
};

/**
 * Helper function to extract TopicPolicy resource from CloudFormation template
 */
function getTopicPolicyResource(
  template: Record<string, unknown>
): TopicPolicyResource | undefined {
  const policyResource = Object.values(template.Resources).find(
    (resource) => (resource as { Type?: string })?.Type === 'AWS::SNS::TopicPolicy'
  ) as TopicPolicyResource | undefined;
  return policyResource;
}

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

  describe('SNS Topic Creation', () => {
    it('should create SNS topic with name commercetools-webhook-dev when environment is dev', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environment: 'dev',
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack.snsTopic).toBeInstanceOf(Topic);
      expect(stack.topicName).toBe('commercetools-webhook-dev');
    });

    it('should create SNS topic with name commercetools-webhook-staging when environment is staging', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environment: 'staging',
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack.snsTopic).toBeInstanceOf(Topic);
      expect(stack.topicName).toBe('commercetools-webhook-staging');
    });

    it('should create SNS topic with name commercetools-webhook-prod when environment is prod', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environment: 'prod',
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack.snsTopic).toBeInstanceOf(Topic);
      expect(stack.topicName).toBe('commercetools-webhook-prod');
    });

    it('should create SNS topic with name commercetools-webhook-dev when environment is not provided', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack.snsTopic).toBeInstanceOf(Topic);
      expect(stack.topicName).toBe('commercetools-webhook-dev');
    });

    it('should create SNS topic with ARN format arn:aws:sns:region:account:commercetools-webhook-env', () => {
      const app = new App();
      const stackId = 'TestStack';
      const account = '123456789012';
      const region = 'us-east-1';
      const props: CdkStackProps = {
        env: {
          account,
          region,
        },
        environment: 'dev',
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack.snsTopic).toBeInstanceOf(Topic);
      const expectedArn = `arn:aws:sns:${region}:${account}:commercetools-webhook-dev`;
      expect(stack.topicArn).toBe(expectedArn);
    });

    it('should throw error when environment is invalid', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environment: 'invalid' as 'dev' | 'staging' | 'prod',
      };

      expect(() => {
        new CdkStack(app, stackId, props);
      }).toThrow('Invalid environment: invalid');
    });
  });

  describe('IAM Resource Policy', () => {
    it('should attach IAM resource policy allowing Commercetools IAM user to publish', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environment: 'dev',
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack.snsTopic).toBeInstanceOf(Topic);
      const assembly = app.synth();
      const template = assembly.getStackByName(stack.stackName).template;
      const topicResource = Object.values(template.Resources).find(
        (resource) => resource?.Type === 'AWS::SNS::Topic'
      );
      expect(topicResource).toBeDefined();

      const policyResource = Object.values(template.Resources).find(
        (resource) => resource?.Type === 'AWS::SNS::TopicPolicy'
      );
      expect(policyResource).toBeDefined();
    });

    it('should use default IAM user ARN arn:aws:iam::362576667341:user/subscriptions when commercetoolsIamUserArn is not provided', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environment: 'dev',
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack.snsTopic).toBeInstanceOf(Topic);
      const assembly = app.synth();
      const template = assembly.getStackByName(stack.stackName).template;
      const policyResource = getTopicPolicyResource(template);

      expect(policyResource).toBeDefined();
      const statement = policyResource?.Properties?.PolicyDocument?.Statement?.[0];
      expect(statement?.Principal?.AWS).toBe('arn:aws:iam::362576667341:user/subscriptions');
      expect(statement?.Action).toContain('sns:Publish');
    });

    it('should use custom IAM user ARN when commercetoolsIamUserArn is provided', () => {
      const app = new App();
      const stackId = 'TestStack';
      const customIamUserArn = 'arn:aws:iam::999999999999:user/custom-user';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environment: 'dev',
        commercetoolsIamUserArn: customIamUserArn,
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack.snsTopic).toBeInstanceOf(Topic);
      const assembly = app.synth();
      const template = assembly.getStackByName(stack.stackName).template;
      const policyResource = getTopicPolicyResource(template);

      expect(policyResource).toBeDefined();
      const statement = policyResource?.Properties?.PolicyDocument?.Statement?.[0];
      expect(statement?.Principal?.AWS).toBe(customIamUserArn);
      expect(statement?.Action).toContain('sns:Publish');
    });

    it('should set IAM policy action to sns:Publish', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environment: 'dev',
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack.snsTopic).toBeInstanceOf(Topic);
      const assembly = app.synth();
      const template = assembly.getStackByName(stack.stackName).template;
      const policyResource = getTopicPolicyResource(template);

      expect(policyResource).toBeDefined();
      const statement = policyResource?.Properties?.PolicyDocument?.Statement?.[0];
      expect(statement?.Action).toContain('sns:Publish');
    });

    it('should throw error when IAM user ARN format is invalid', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environment: 'dev',
        commercetoolsIamUserArn: 'invalid-arn',
      };

      expect(() => {
        new CdkStack(app, stackId, props);
      }).toThrow('Invalid IAM user ARN format: invalid-arn');
    });

    it('should throw error when IAM user ARN has invalid account ID', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environment: 'dev',
        commercetoolsIamUserArn: 'arn:aws:iam::123:user/test',
      };

      expect(() => {
        new CdkStack(app, stackId, props);
      }).toThrow('Invalid IAM user ARN format');
    });
  });

  describe('Stack Output', () => {
    it('should export SNS topic ARN as stack output with key SnsTopicArn', () => {
      const app = new App();
      const stackId = 'TestStack';
      const account = '123456789012';
      const region = 'us-east-1';
      const props: CdkStackProps = {
        env: {
          account,
          region,
        },
        environment: 'dev',
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack.snsTopic).toBeInstanceOf(Topic);
      const assembly = app.synth();
      const template = assembly.getStackByName(stack.stackName).template;
      const output = template.Outputs?.SnsTopicArn;

      expect(output).toBeDefined();
      // CDK outputs use Ref tokens, not resolved ARN strings
      // Verify the output references the topic resource
      expect(output?.Value).toHaveProperty('Ref');
      // Verify the computed ARN property has the correct value
      expect(stack.topicArn).toBe(`arn:aws:sns:${region}:${account}:commercetools-webhook-dev`);
    });

    it('should export topic ARN with correct format in stack output', () => {
      const app = new App();
      const stackId = 'TestStack';
      const account = '123456789012';
      const region = 'us-east-1';
      const props: CdkStackProps = {
        env: {
          account,
          region,
        },
        environment: 'staging',
      };

      const stack = new CdkStack(app, stackId, props);

      expect(stack.snsTopic).toBeInstanceOf(Topic);
      const assembly = app.synth();
      const template = assembly.getStackByName(stack.stackName).template;
      const output = template.Outputs?.SnsTopicArn;

      expect(output).toBeDefined();
      // CDK outputs use Ref tokens, not resolved ARN strings
      // Verify the output references the topic resource
      expect(output?.Value).toHaveProperty('Ref');
      // Verify the computed ARN property has the correct value
      const expectedArn = `arn:aws:sns:${region}:${account}:commercetools-webhook-staging`;
      expect(stack.topicArn).toBe(expectedArn);
    });
  });

  describe('Stack Synthesis', () => {
    it('should synthesize CloudFormation template with SNS topic resource', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environment: 'dev',
      };

      const stack = new CdkStack(app, stackId, props);
      const assembly = app.synth();
      const template = assembly.getStackByName(stack.stackName).template;

      const topicResource = Object.values(template.Resources).find(
        (resource) => resource?.Type === 'AWS::SNS::Topic'
      );

      expect(topicResource).toBeDefined();
      expect(topicResource?.Properties?.TopicName).toBe('commercetools-webhook-dev');
    });

    it('should synthesize CloudFormation template with SNS topic policy resource', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environment: 'dev',
      };

      const stack = new CdkStack(app, stackId, props);
      const assembly = app.synth();
      const template = assembly.getStackByName(stack.stackName).template;

      const policyResource = Object.values(template.Resources).find(
        (resource) => resource?.Type === 'AWS::SNS::TopicPolicy'
      );

      expect(policyResource).toBeDefined();
    });

    it('should synthesize CloudFormation template with stack output for topic ARN', () => {
      const app = new App();
      const stackId = 'TestStack';
      const props: CdkStackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environment: 'dev',
      };

      const stack = new CdkStack(app, stackId, props);
      const assembly = app.synth();
      const template = assembly.getStackByName(stack.stackName).template;

      expect(template.Outputs).toBeDefined();
      expect(template.Outputs?.SnsTopicArn).toBeDefined();
      // CDK outputs use Ref tokens, verify it references the topic resource
      expect(template.Outputs?.SnsTopicArn?.Value).toHaveProperty('Ref');
      // Verify the computed ARN property has the correct format
      expect(stack.topicArn).toContain('arn:aws:sns:');
      expect(stack.topicArn).toContain('commercetools-webhook-dev');
    });
  });
});

