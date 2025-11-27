---
id: 37ff6cca-0276-4d84-8f67-cb1357fd6f57
title: STORY-1 Troubleshooting Guide
tags:
  - status/implemented
  - issue-1
  - topic/troubleshooting
  - documentation
category: DOC
created_at: '2025-11-27T12:54:03.925Z'
updated_at: '2025-11-27T12:55:26.051Z'
last_reviewed: '2025-11-27T12:54:03.925Z'
links: []
sources: []
abstract: >-
  Troubleshooting guide for STORY-1: common issues, solutions, debugging tips,
  and help resources
---

# STORY-1 Troubleshooting Guide

## Common Issues and Solutions

### Environment Configuration Issues

#### Issue 1: "Missing required environment variable: SEGMENT_WRITE_KEY"

**Symptoms:**
- Error thrown when calling `getEnvironmentConfig()`
- Application fails to start

**Causes:**
1. Environment variable not set
2. Environment variable is empty string
3. Environment variable is whitespace-only

**Solutions:**

1. **Check Environment Variable:**
   ```bash
   # Local development
   echo $SEGMENT_WRITE_KEY
   
   # Vercel deployment
   # Check Vercel project settings → Environment Variables
   ```

2. **Set Environment Variable:**
   ```bash
   # Local development (.env file)
   SEGMENT_WRITE_KEY=your-actual-write-key-here
   
   # Vercel
   # Go to Project Settings → Environment Variables
   # Add SEGMENT_WRITE_KEY with your write key value
   ```

3. **Verify Value:**
   ```typescript
   import { validateEnvironment } from './config/environment.js';
   const result = validateEnvironment();
   console.log('Validation result:', result);
   ```

#### Issue 2: Environment Variable Has Trailing Whitespace

**Symptoms:**
- Validation passes but Segment API calls fail
- Write key appears correct but doesn't work

**Solutions:**

1. **Automatic Trimming:**
   - The module automatically trims whitespace
   - Check if the original value has issues

2. **Manual Check:**
   ```typescript
   const writeKey = process.env.SEGMENT_WRITE_KEY;
   console.log('Raw value:', JSON.stringify(writeKey));
   console.log('Trimmed:', JSON.stringify(writeKey?.trim()));
   ```

3. **Fix in Environment:**
   - Remove trailing/leading spaces in Vercel settings
   - Update `.env` file without spaces

### Segment Client Issues

#### Issue 3: "Write key cannot be empty or whitespace only"

**Symptoms:**
- Error when calling `createSegmentClient()`
- Error when calling `getSegmentClientFromEnvironment()`

**Causes:**
1. Empty string passed to `createSegmentClient()`
2. Whitespace-only string passed
3. Environment variable issue (see Issue 1)

**Solutions:**

1. **Validate Before Creating:**
   ```typescript
   const writeKey = process.env.SEGMENT_WRITE_KEY?.trim();
   if (!writeKey) {
     throw new Error('SEGMENT_WRITE_KEY is required');
   }
   const client = createSegmentClient(writeKey);
   ```

2. **Use Environment Function:**
   ```typescript
   // This handles validation automatically
   const client = getSegmentClientFromEnvironment();
   ```

#### Issue 4: Segment Events Not Appearing in Dashboard

**Symptoms:**
- `identify()` calls succeed but events don't appear in Segment
- No errors thrown but no data in Segment

**Causes:**
1. Events not flushed before function termination
2. Serverless function terminates before flush completes
3. Incorrect write key (wrong workspace)

**Solutions:**

1. **Always Flush:**
   ```typescript
   await client.identify({ userId: 'user-123', traits: { email: 'user@example.com' } });
   await client.flush(); // CRITICAL: Don't forget this
   ```

2. **Use closeAndFlush in Serverless:**
   ```typescript
   export default async function handler(req, res) {
     const client = getSegmentClientFromEnvironment();
     await client.identify({ userId: 'user-123', traits: { email: 'user@example.com' } });
     await client.closeAndFlush(); // Ensures events are sent
     res.status(200).json({ success: true });
   }
   ```

3. **Verify Write Key:**
   - Check Segment dashboard → Settings → API Keys
   - Ensure you're using the correct workspace's write key

#### Issue 5: Timeout Errors in Serverless Functions

**Symptoms:**
- Function times out before events are sent
- `flush()` or `closeAndFlush()` doesn't complete

**Solutions:**

1. **Increase Timeout:**
   ```json
   // vercel.json
   {
     "functions": {
       "api/**/*.ts": {
         "runtime": "nodejs24.x",
         "maxDuration": 30
       }
     }
   }
   ```

2. **Flush Early:**
   ```typescript
   // Flush after critical operations, not at the end
   await client.identify({ userId: 'user-123', traits: { email: 'user@example.com' } });
   await client.flush(); // Flush immediately
   // Continue with other operations
   ```

3. **Background Processing:**
   - Consider using background jobs for non-critical events
   - Use queue system for async event processing

### Logger Issues

#### Issue 6: Logs Not Appearing

**Symptoms:**
- `logInfo()`, `logError()` calls don't produce output
- No logs in console or log aggregation

**Causes:**
1. Log level too high (debug logs not shown)
2. Winston configuration issue
3. Console output not visible in serverless environment

**Solutions:**

1. **Check Log Level:**
   ```typescript
   import { logger } from './logger.js';
   logger.level = 'debug'; // Lower level to see more logs
   ```

2. **Use Console for Debugging:**
   ```typescript
   // Temporary debugging
   console.log('Debug info:', data);
   ```

3. **Check Vercel Logs:**
   - Vercel dashboard → Functions → View logs
   - Check function execution logs

#### Issue 7: Error Stack Traces Not Appearing

**Symptoms:**
- Error messages appear but no stack traces
- Difficult to debug errors

**Solutions:**

1. **Pass Error Object:**
   ```typescript
   try {
     // operation
   } catch (error) {
     logError('Operation failed', error as Error); // Pass Error object
   }
   ```

2. **Check Winston Configuration:**
   - Stack traces are automatically included when Error object is passed
   - Ensure `errors({ stack: true })` is in format (already configured)

### Build and Deployment Issues

#### Issue 8: TypeScript Build Errors

**Symptoms:**
- `pnpm build` fails
- Type errors in compilation

**Solutions:**

1. **Run Type Check:**
   ```bash
   pnpm type-check
   ```

2. **Fix Type Errors:**
   - Ensure all imports use `.js` extension (ESM requirement)
   - Check for missing type definitions
   - Verify `tsconfig.json` configuration

3. **Clean Build:**
   ```bash
   rm -rf dist node_modules
   pnpm install
   pnpm build
   ```

#### Issue 9: Vercel Deployment Fails

**Symptoms:**
- Build fails on Vercel
- Functions not deployed

**Solutions:**

1. **Check Build Output:**
   - Vercel dashboard → Deployments → View build logs
   - Look for TypeScript compilation errors

2. **Verify vercel.json:**
   ```json
   {
     "builds": [
       {
         "src": "dist/api/**/*.js", // Must point to dist, not src
         "use": "@vercel/node"
       }
     ]
   }
   ```

3. **Check Environment Variables:**
   - Ensure `SEGMENT_WRITE_KEY` is set in Vercel
   - Check all required environment variables

4. **Local Build Test:**
   ```bash
   pnpm build
   # Verify dist/ directory contains compiled files
   ```

### Testing Issues

#### Issue 10: Tests Fail Due to Environment Variables

**Symptoms:**
- Tests fail with "Missing required environment variable"
- Tests pass locally but fail in CI

**Solutions:**

1. **Mock Environment in Tests:**
   ```typescript
   beforeEach(() => {
     process.env.SEGMENT_WRITE_KEY = 'test-write-key';
   });
   
   afterEach(() => {
     delete process.env.SEGMENT_WRITE_KEY;
   });
   ```

2. **Use Test-Specific Values:**
   - Don't use real write keys in tests
   - Use clearly identifiable test values

3. **CI Environment Setup:**
   - Set environment variables in CI configuration
   - Use test values, not production keys

## Debugging Tips

### Tip 1: Enable Debug Logging

```typescript
import { logger } from './logger.js';
logger.level = 'debug';
logDebug('Debug information', { data: importantData });
```

### Tip 2: Validate Environment at Startup

```typescript
import { validateEnvironment } from './config/environment.js';

const validation = validateEnvironment();
if (!validation.isValid) {
  console.error('Environment issues:', validation.missingVars);
  // Handle appropriately
}
```

### Tip 3: Test Segment Client Locally

```typescript
import { createSegmentClient } from './segment/client.js';

// Use test write key
const client = createSegmentClient('test-write-key');
await client.identify({
  userId: 'test-user',
  traits: { email: 'test@example.com' }
});
await client.flush();
// Check Segment debugger for events
```

### Tip 4: Check Vercel Function Logs

1. Go to Vercel dashboard
2. Select your project
3. Go to Functions tab
4. Click on function name
5. View execution logs and errors

## Getting Help

### Check Documentation

1. Review API documentation in memory store
2. Check usage examples
3. Review architectural documentation

### Verify Configuration

1. Environment variables set correctly
2. `vercel.json` configuration valid
3. TypeScript compilation successful
4. All dependencies installed

### Common Mistakes Checklist

- [ ] Environment variable set in Vercel (not just locally)
- [ ] Write key is correct for your Segment workspace
- [ ] `flush()` or `closeAndFlush()` called before function ends
- [ ] TypeScript files compile to JavaScript in `dist/`
- [ ] `vercel.json` points to `dist/api/**/*.js` (not `src/`)
- [ ] All imports use `.js` extension (ESM requirement)
- [ ] Error objects passed to `logError()` (not just strings)