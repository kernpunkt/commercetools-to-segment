import { App } from 'aws-cdk-lib';
import { CdkStack } from '../lib/stack.js';

export interface CdkAppConfig {
  readonly context?: Record<string, string>;
  readonly env?: {
    readonly account?: string;
    readonly region?: string;
  };
}

export function createCdkApp(config?: CdkAppConfig): App {
  const app = new App();

  if (config?.context) {
    for (const [key, value] of Object.entries(config.context)) {
      app.node.setContext(key, value);
    }
  }

  return app;
}

export function createCdkStack(
  app: App,
  stackId: string,
  stackProps?: {
    readonly env?: {
      readonly account: string;
      readonly region: string;
    };
    readonly description?: string;
    readonly tags?: Record<string, string>;
  }
): CdkStack {
  return new CdkStack(app, stackId, stackProps);
}

export function getEnvironmentConfig(): {
  readonly account?: string;
  readonly region?: string;
} {
  const account = process.env['CDK_DEFAULT_ACCOUNT']?.trim();
  const region = process.env['CDK_DEFAULT_REGION']?.trim();

  const config: {
    account?: string;
    region?: string;
  } = {};

  if (account) {
    config.account = account;
  }

  if (region) {
    config.region = region;
  }

  return config;
}

// CDK App instantiation for CLI usage
const app = createCdkApp();
const env = getEnvironmentConfig();

const stackProps:
  | {
      readonly env: {
        readonly account: string;
        readonly region: string;
      };
    }
  | Record<string, never> =
  env.account && env.region
    ? {
        env: {
          account: env.account,
          region: env.region,
        },
      }
    : {};

createCdkStack(app, 'CommercetoolsToSegmentStack', stackProps);

