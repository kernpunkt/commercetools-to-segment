/**
 * Cucumber Test Setup
 * Loads environment variables from .env file before tests run
 */
import dotenvx from '@dotenvx/dotenvx';

// Load .env file if it exists
// This will load environment variables into process.env
dotenvx.config();

