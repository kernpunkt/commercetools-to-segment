import { Stack, type StackProps, CfnOutput } from 'aws-cdk-lib';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { LambdaSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { PolicyStatement, ArnPrincipal } from 'aws-cdk-lib/aws-iam';
import type * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface CdkStackProps extends StackProps {
  readonly description?: string;
  readonly tags?: Record<string, string>;
  readonly environment?: 'dev' | 'staging' | 'prod';
  readonly commercetoolsIamUserArn?: string;
  readonly lambdaFunction?: lambda.IFunction;
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
  const stackProps: {
    env?: StackProps['env'];
    description?: StackProps['description'];
  } = {};

  if (props?.env) {
    stackProps.env = props.env;
  }

  if (props?.description) {
    stackProps.description = props.description;
  }

  const hasProps =
    stackProps.env !== undefined || stackProps.description !== undefined;
  return hasProps ? (stackProps as StackProps) : undefined;
}

/**
 * Sets up Lambda subscription to SNS topic and creates stack outputs
 * Extracted to separate method for better testability
 */
function setupLambdaSubscription(
  stack: CdkStack,
  lambdaFunction: lambda.IFunction
): void {
  // Create Lambda-SNS subscription
  stack.snsTopic.addSubscription(new LambdaSubscription(lambdaFunction));

  // Add Lambda ARN output when Lambda function is provided
  // Only create output if Lambda is in the same stack to avoid cross-stack dependency issues
  const lambdaStack = lambdaFunction.stack;
  const isSameStack = lambdaStack === stack;
  if (isSameStack) {
    new CfnOutput(stack, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description:
        'ARN of the Lambda function for processing Commercetools events',
    });
  }
  // Note: Cross-stack Lambda references don't create outputs to avoid dependency cycles
  // In production, Lambda should be in the same stack
}

export class CdkStack extends Stack {
  /**
   * SNS topic for receiving Commercetools webhook events
   */
  public readonly snsTopic: Topic;

  /**
   * Name of the SNS topic (environment-aware)
   */
  public readonly topicName: string;

  /**
   * ARN of the SNS topic
   */
  public readonly topicArn: string;

  /**
   * Optional Lambda function for processing SNS messages
   * When provided, automatically creates a Lambda subscription to the SNS topic
   */
  public readonly lambdaFunction?: lambda.IFunction;

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

    // Store Lambda function from props
    if (props?.lambdaFunction !== undefined) {
      this.lambdaFunction = props.lambdaFunction;
    }

    // Create Lambda-SNS subscription and outputs when Lambda function is provided
    if (this.lambdaFunction) {
      setupLambdaSubscription(this, this.lambdaFunction);
    }
  }
}
