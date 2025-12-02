import { Stack, type StackProps, CfnOutput } from 'aws-cdk-lib';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { PolicyStatement, ArnPrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface CdkStackProps extends StackProps {
  readonly description?: string;
  readonly tags?: Record<string, string>;
  readonly environment?: 'dev' | 'staging' | 'prod';
  readonly commercetoolsIamUserArn?: string;
}

/**
 * Validates IAM user ARN format
 * @param arn - IAM user ARN to validate
 * @throws Error if ARN format is invalid
 */
function validateIamUserArn(arn: string): void {
  const iamUserArnPattern = /^arn:aws:iam::\d{12}:user\/[\w+=,.@-]+$/;
  if (!iamUserArnPattern.test(arn)) {
    throw new Error(
      `Invalid IAM user ARN format: ${arn}. Expected format: arn:aws:iam::ACCOUNT_ID:user/USER_NAME`
    );
  }
}

/**
 * Validates environment value
 * @param environment - Environment value to validate
 * @throws Error if environment is invalid
 */
function validateEnvironment(
  environment: string
): asserts environment is 'dev' | 'staging' | 'prod' {
  const validEnvironments: ReadonlyArray<'dev' | 'staging' | 'prod'> = [
    'dev',
    'staging',
    'prod',
  ];
  if (!validEnvironments.includes(environment as 'dev' | 'staging' | 'prod')) {
    throw new Error(
      `Invalid environment: ${environment}. Must be one of: ${validEnvironments.join(', ')}`
    );
  }
}

/**
 * Builds StackProps from CdkStackProps, only including defined values
 */
function buildStackProps(props?: CdkStackProps): StackProps | undefined {
  const stackProps: StackProps = {};
  let hasProps = false;

  if (props?.env) {
    stackProps.env = props.env;
    hasProps = true;
  }

  if (props?.description) {
    stackProps.description = props.description;
    hasProps = true;
  }

  return hasProps ? stackProps : undefined;
}

export class CdkStack extends Stack {
  public readonly snsTopic: Topic;
  public readonly topicName: string;
  public readonly topicArn: string;

  constructor(scope: Construct, id: string, props?: CdkStackProps) {
    super(scope, id, buildStackProps(props));

    // Apply tags using CDK's tag system
    if (props?.tags) {
      Object.entries(props.tags).forEach(([key, value]) => {
        this.tags.setTag(key, value);
      });
    }

    // Validate and set environment
    const environment = props?.environment ?? 'dev';
    validateEnvironment(environment);
    this.topicName = `commercetools-webhook-${environment}`;

    // Create SNS topic with environment-aware naming
    this.snsTopic = new Topic(this, 'CommercetoolsWebhookTopic', {
      topicName: this.topicName,
    });

    // Store computed ARN for test access (CDK will resolve tokens during synthesis)
    // Use CDK's account and region resolution (no hardcoded defaults)
    const account = this.account;
    const region = this.region;
    this.topicArn = `arn:aws:sns:${region}:${account}:${this.topicName}`;

    // Validate and set IAM user ARN
    const iamUserArn =
      props?.commercetoolsIamUserArn ??
      'arn:aws:iam::362576667341:user/subscriptions';
    validateIamUserArn(iamUserArn);

    // Add IAM resource policy to allow Commercetools IAM user to publish
    const policyStatement = new PolicyStatement({
      principals: [new ArnPrincipal(iamUserArn)],
      actions: ['sns:Publish'],
      resources: [this.snsTopic.topicArn],
    });
    this.snsTopic.addToResourcePolicy(policyStatement);

    // Export topic ARN as stack output
    new CfnOutput(this, 'SnsTopicArn', {
      value: this.snsTopic.topicArn,
      description: 'ARN of the SNS topic for Commercetools webhook events',
    });
  }
}

