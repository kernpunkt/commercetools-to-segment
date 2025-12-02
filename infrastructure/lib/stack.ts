import { Stack, type StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface CdkStackProps extends StackProps {
  readonly description?: string;
  readonly tags?: Record<string, string>;
}

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: CdkStackProps) {
    const stackProps: StackProps = {
      ...(props?.env && { env: props.env }),
      ...(props?.description && { description: props.description }),
    };

    super(scope, id, Object.keys(stackProps).length > 0 ? stackProps : undefined);

    if (props?.tags) {
      for (const [key, value] of Object.entries(props.tags)) {
        this.tags.setTag(key, value);
      }
    }
  }
}

