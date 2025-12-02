# Commercetools to Segment Integration

A serverless webhook service that synchronizes customer data from Commercetools to Segment Customer Data Platform (CDP). This service receives webhook events from Commercetools when customers are created or updated, transforms the data into Segment's format, and sends it to Segment's Identify API.

## 🎯 Overview

This project provides a real-time integration between Commercetools (e-commerce platform) and Segment (Customer Data Platform). When customer information changes in Commercetools, it automatically syncs to Segment, ensuring accurate customer profiles for marketing, analytics, and personalization.

**Key Features:**
- Receives Commercetools webhook events (`customer.created`, `customer.updated`)
- Validates webhook payloads and request structure
- Transforms customer data from Commercetools format to Segment format
- Sends customer data to Segment Identify API
- Handles errors gracefully with proper logging
- Deployed as serverless functions on Vercel

## 🚀 Features

- **Webhook Endpoint**: RESTful API endpoint that accepts POST requests from Commercetools
- **Data Validation**: Comprehensive validation of webhook payloads and request structure
- **Data Transformation**: Converts Commercetools customer data to Segment Identify API format
- **Segment Integration**: Sends customer data to Segment using the official Segment Analytics Node.js SDK
- **Error Handling**: Robust error handling with detailed logging
- **Type Safety**: Full TypeScript support with strict type checking
- **Testing**: Comprehensive test coverage with TDD (Vitest) and BDD (Cucumber) tests

## 📋 Requirements

- **Node.js**: Version 20.x (as specified in `package.json`)
- **pnpm**: Version 10.17.0 or higher ([Installation Guide](https://pnpm.io/installation))
- **Vercel Account**: For deployment (or use Vercel CLI for local development)

## 🔐 Environment Variables

This project requires the following environment variables:

### Required Variables

#### `SEGMENT_WRITE_KEY`

**Purpose**: Authenticates requests to Segment's Identify API

**Why it's needed**:
1. **API Authentication**: Segment requires a write key to authenticate all API requests. Without this key, Segment will reject all requests to create or update customer profiles.
2. **Client Initialization**: The Segment Analytics client (`@segment/analytics-node`) requires a write key during initialization. The key is used to:
   - Identify which Segment workspace/project to send data to
   - Authenticate the HTTP requests to Segment's API endpoints
   - Route events to the correct destination in your Segment configuration
3. **Security**: The write key acts as a secret credential that should never be committed to version control. It's unique to your Segment workspace and grants write access to your customer data.
4. **Runtime Requirement**: The application validates this environment variable at runtime. If it's missing, empty, or contains only whitespace, the application will throw an error and fail to start (see `src/config/environment.ts`).

**Where it's used**:
- `src/config/environment.ts`: Validates the environment variable is present and non-empty
- `src/segment/client.ts`: Used to initialize the Segment Analytics client via `createSegmentClient(writeKey)`
- `src/integration/service.ts`: Retrieved via `getSegmentClientFromEnvironment()` to send customer data to Segment

**How to get it**:
1. Log in to your Segment dashboard
2. Navigate to Settings → API Keys
3. Copy your Write Key (starts with your workspace slug)
4. Keep it secure and never commit it to version control

**Validation**: The application automatically trims whitespace and validates that the key is not empty. If validation fails, you'll see: `Missing required environment variable: SEGMENT_WRITE_KEY`

### Optional Variables

#### `VERCEL_URL`

**Purpose**: Base URL of the Vercel deployment

**Why it's needed**:
- **Documentation**: Provides a reference to the deployed application URL
- **Testing**: Can be used in tests or scripts that need to reference the deployment
- **Configuration**: May be needed for external services that need to know the deployment URL

**How to get it**:
- Automatically provided by Vercel in production deployments
- For preview deployments, check the Vercel dashboard or deployment logs
- Format: `https://your-project-name.vercel.app`

#### `WEBHOOK_ENDPOINT_URL`

**Purpose**: Full URL of the webhook endpoint for Commercetools configuration

**Why it's needed**:
- **Commercetools Configuration**: This is the exact URL you need to configure in Commercetools webhook subscriptions
- **Documentation**: Provides a clear reference for setting up the integration
- **Testing**: Useful for testing webhook endpoints manually or in integration tests

**How to get it**:
- Production: `https://your-project-name.vercel.app/api/webhook`
- Preview: `https://your-project-name-git-branch-username.vercel.app/api/webhook`
- Local: `http://localhost:3000/api/webhook` (when using `vercel dev`)

#### `VERCEL_PROTECTION_BYPASS_SECRET`

**Purpose**: Secret token for bypassing Vercel's preview protection

**Why it's needed**:
- **Preview Protection**: Vercel preview deployments can be password-protected
- **Testing**: Allows automated tests or external services (like Commercetools) to access protected preview deployments
- **Development**: Enables testing webhooks against preview deployments without manual authentication

**How to get it**:
1. Go to your Vercel project settings
2. Navigate to "Deployment Protection"
3. If preview protection is enabled, generate a bypass secret
4. Keep it secure and never commit it to version control

**Security Note**: This secret grants access to protected preview deployments. Only share it with trusted services and never expose it publicly.

### Setting Environment Variables

#### Local Development
Create a `.env` file in the project root (you can use `.env.example` as a template):
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your actual Segment write key
SEGMENT_WRITE_KEY=your-actual-segment-write-key-here
```

**Note**: The `.env` file is gitignored and should never be committed. Always use `.env.example` as a template for documenting required environment variables.

#### Vercel Deployment
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables:
   - **`SEGMENT_WRITE_KEY`**: Your Segment write key value (required)
   - **`VERCEL_URL`**: Your deployment base URL (optional, for documentation)
   - **`WEBHOOK_ENDPOINT_URL`**: Full webhook endpoint URL (optional, for documentation)
   - **`VERCEL_PROTECTION_BYPASS_SECRET`**: Bypass secret if using preview protection (optional)
4. Select the environments where each variable should be available (Production, Preview, Development)
5. Redeploy your application for changes to take effect

## 🛠️ Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd commercetools-to-segment
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your SEGMENT_WRITE_KEY
   ```

3. **Build the project:**
   ```bash
   pnpm build
   ```

4. **Run tests:**
   ```bash
   pnpm test:all
   ```

5. **Start local development:**
   ```bash
   pnpm dev
   ```

## 🚀 Vercel Deployment

This project is configured for deployment on Vercel as serverless functions.

### Prerequisites

- Vercel account ([Sign up](https://vercel.com/signup))
- Vercel CLI installed (optional): `npm i -g vercel`
- Environment variables configured (see Environment Variables section)

### Deployment Steps

1. **Connect your repository to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the project settings

2. **Configure environment variables:**
   - In your Vercel project settings, go to "Environment Variables"
   - Add `SEGMENT_WRITE_KEY` with your Segment write key
   - Select all environments (Production, Preview, Development)

3. **Deploy:**
   - Vercel will automatically deploy on every push to your main branch
   - Or use Vercel CLI: `vercel` (for preview) or `vercel --prod` (for production)

### Project Structure for Vercel

- **Serverless Functions**: API endpoints in the `api/` directory
- **Build Output**: TypeScript compiles to `dist/` directory
- **Configuration**: `vercel.json` contains deployment settings
- **Runtime**: Node.js 20.x (configured in `package.json`)

### API Endpoints

Serverless functions in the `api/` directory are automatically deployed as API routes:
- `api/webhook.ts` → `/api/webhook` endpoint

Functions must export a default handler that accepts `VercelRequest` and `VercelResponse`.

### Local Development with Vercel

You can test serverless functions locally using Vercel CLI:
```bash
# Install Vercel CLI
npm i -g vercel

# Run development server
vercel dev
```

This will start a local server that mimics Vercel's serverless function environment.

## ☁️ AWS CDK Infrastructure

This project includes AWS CDK infrastructure as code for managing AWS resources separately from Vercel serverless functions.

### Prerequisites

- **AWS Account**: An AWS account with appropriate permissions
- **AWS CLI**: Installed and configured with credentials
- **Node.js**: Version 20.x (as specified in package.json)
- **pnpm**: Version 10.17.0 or higher

### CDK Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure AWS credentials:**
   ```bash
   aws configure
   ```
   Or set environment variables:
   ```bash
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_DEFAULT_REGION=us-east-1
   ```

3. **Set CDK environment variables (optional):**
   ```bash
   export CDK_DEFAULT_ACCOUNT=123456789012  # Your AWS account ID
   export CDK_DEFAULT_REGION=us-east-1      # Your preferred AWS region
   ```

### CDK Commands

| Command | Description |
|---------|-------------|
| `pnpm cdk:build` | Compile CDK TypeScript code |
| `pnpm cdk:synth` | Synthesize CloudFormation templates |
| `pnpm cdk:deploy` | Deploy stack to AWS |
| `pnpm cdk:destroy` | Remove stack from AWS |
| `pnpm cdk:diff` | Show differences between deployed and local stack |

### CDK Project Structure

```
infrastructure/
├── bin/
│   └── app.ts           # CDK app entry point
├── lib/
│   └── stack.ts        # Main CDK stack
├── cdk.json            # CDK configuration
└── tsconfig.json       # TypeScript config for CDK
```

### First-Time Deployment

1. **Bootstrap CDK (one-time setup per account/region):**
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/REGION
   ```

2. **Build the CDK code:**
   ```bash
   pnpm cdk:build
   ```

3. **Preview changes:**
   ```bash
   pnpm cdk:diff
   ```

4. **Deploy the stack:**
   ```bash
   pnpm cdk:deploy
   ```

### Environment Variables

- **`CDK_DEFAULT_ACCOUNT`**: AWS account ID (12 digits)
- **`CDK_DEFAULT_REGION`**: AWS region (e.g., `us-east-1`)

These are optional - if not set, CDK will prompt for account/region or use AWS CLI defaults.

### CDK Output

- **`cdk.out/`**: Generated CloudFormation templates (gitignored)
- **`cdk.context.json`**: CDK context cache (gitignored)

## 📡 Webhook Configuration

### Setting Up Commercetools Webhook

1. **Get your webhook URL:**
   - After deployment, your webhook URL will be: `https://your-domain.vercel.app/api/webhook`

2. **Configure in Commercetools:**
   - Go to your Commercetools project settings
   - Navigate to "Subscriptions" or "Webhooks"
   - Create a new subscription with:
     - **URL**: Your Vercel webhook endpoint
     - **Message Types**: `CustomerCreated`, `CustomerUpdated`
     - **Format**: JSON

3. **Test the webhook:**
   - Create or update a customer in Commercetools
   - Check Vercel function logs to verify the webhook was received
   - Verify customer data appears in Segment

### Webhook Payload Format

The service expects Commercetools webhook payloads in the following format:

```json
{
  "notificationType": "Message",
  "type": "CustomerCreated",
  "resource": {
    "typeId": "customer",
    "id": "customer-id"
  },
  "customer": {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "addresses": [
      {
        "streetName": "Main St",
        "streetNumber": "123",
        "city": "New York",
        "postalCode": "10001",
        "country": "US"
      }
    ]
  },
  "projectKey": "your-project-key",
  "id": "message-id",
  "version": 1,
  "sequenceNumber": 1,
  "resourceVersion": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastModifiedAt": "2024-01-01T00:00:00.000Z"
}
```

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build the project for production |
| `pnpm start` | Start the production server |
| `pnpm test` | Run TDD test suite (Vitest) |
| `pnpm test:bdd` | Run BDD test suite (Cucumber) |
| `pnpm test:all` | Run both TDD and BDD tests |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:full` | Run complete validation (tests + linting + type checking + formatting) |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint issues automatically |
| `pnpm format` | Format code with Prettier |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm deps:check` | Check for outdated dependencies |
| `pnpm deps:update` | Update all dependencies to latest versions |

## 🏗️ Project Structure

```
commercetools-to-segment/
├── api/                      # Vercel serverless functions
│   └── webhook.ts            # Main webhook endpoint handler
├── src/                      # Source code
│   ├── config/              # Configuration modules
│   │   └── environment.ts   # Environment variable validation
│   ├── integration/         # Segment integration
│   │   ├── service.ts       # Integration service layer
│   │   └── types.ts         # Integration type definitions
│   ├── segment/             # Segment client
│   │   ├── client.ts        # Segment client factory
│   │   └── types.ts         # Segment type definitions
│   ├── transformation/       # Data transformation
│   │   ├── transformer.ts   # Customer data transformer
│   │   └── types.ts         # Transformation type definitions
│   ├── webhook/             # Webhook handling
│   │   ├── validator.ts     # Webhook payload validation
│   │   └── types.ts         # Webhook type definitions
│   └── logger.ts            # Winston logging setup
├── tests/                   # Test suite
│   ├── steps/               # BDD step definitions
│   │   ├── *.steps.ts       # Cucumber step definitions
│   │   └── README.md        # Step definition docs
│   ├── integration/         # Integration tests
│   ├── transformation/      # Transformation tests
│   ├── webhook/             # Webhook tests
│   ├── setup.ts             # Test configuration
│   └── *.test.ts            # TDD unit tests
├── features/                # BDD feature files (Cucumber)
│   ├── *.feature            # Gherkin feature files
│   └── README.md            # BDD documentation
├── dist/                    # Compiled JavaScript output
├── reports/                 # Test reports
│   ├── cucumber-report.html # BDD HTML report
│   └── cucumber-report.json # BDD JSON report
├── package.json             # Project configuration
├── tsconfig.json            # TypeScript configuration
├── vercel.json              # Vercel deployment configuration
├── eslint.config.js         # ESLint configuration
├── vitest.config.ts         # Vitest configuration
└── cucumber.config.cjs      # Cucumber configuration
```

## 🧪 Testing

This project implements a comprehensive testing strategy combining Behavior-Driven Development (BDD) and Test-Driven Development (TDD):

### TDD (Test-Driven Development)
- **Framework**: Vitest for fast, isolated unit tests
- **Location**: `tests/*.test.ts` files
- **Purpose**: Test individual functions and modules in isolation
- **Pattern**: Red-Green-Refactor cycle
- **Run**: `pnpm test`

### BDD (Behavior-Driven Development)
- **Framework**: Cucumber with TypeScript step definitions
- **Location**: 
  - Feature files: `features/*.feature` (Gherkin syntax)
  - Step definitions: `tests/steps/*.steps.ts`
- **Purpose**: Test user stories and acceptance criteria from business perspective
- **Pattern**: Given-When-Then scenarios
- **Run**: `pnpm test:bdd`

### Combined Testing
- **Run both**: `pnpm test:all` (TDD + BDD)
- **Full validation**: `pnpm test:full` (tests + linting + type checking + formatting)
- **Reports**: Generated in `reports/` directory

## 🔄 Data Flow

1. **Commercetools** sends webhook event when customer is created or updated
2. **Webhook Endpoint** (`/api/webhook`) receives POST request
3. **Validator** validates request method, JSON format, and payload structure
4. **Transformer** converts Commercetools customer data to Segment format
5. **Integration Service** sends data to Segment Identify API
6. **Segment** creates or updates customer profile identified by email

### Supported Events

- `CustomerCreated`: When a new customer is created in Commercetools
- `CustomerUpdated`: When an existing customer is updated in Commercetools

### Data Transformation

The service transforms Commercetools customer data to Segment format:

**Commercetools → Segment:**
- `email` → `userId` and `traits.email`
- `fullName` or `firstName` + `lastName` → `traits.name`
- `addresses[0]` → `traits.address` (street, city, postalCode, country)

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

- **Build failures**: Run `pnpm install` and `pnpm build` to ensure all dependencies are installed
- **Test failures**: Run `pnpm test:all` to run both TDD and BDD tests
- **Type errors**: Run `pnpm type-check` to identify TypeScript issues
- **Linting errors**: Run `pnpm lint:fix` to automatically fix common issues
- **BDD test issues**: Check the `features/` directory for Gherkin syntax errors
- **Webhook not receiving events**: Verify webhook URL in Commercetools and check Vercel function logs
- **Segment integration failing**: Verify `SEGMENT_WRITE_KEY` is set correctly and check Segment dashboard for events

### Getting Help

- Check the [Issues](https://github.com/kernpunkt/commercetools-to-segment/issues) page
- Review the documentation in the `docs/` directory
- Ensure you're using the correct Node.js and pnpm versions
- Check Vercel function logs for webhook errors
- Verify Segment write key is correct and has proper permissions
