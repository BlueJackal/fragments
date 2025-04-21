// src/model/data/index.js

// First, require the logger
const logger = require('../../logger');

/* ---------------------------------------------------

This file is the entry point for our backend strategy.

For the sake of assignment 1, it only points to our
current in-memory implementation.

In the future we'll probably be able to switch between
local and an AWS service by using an environment
variable.

--------------------------------------------------- */

// Define test environment detection
const isTestEnvironment = process.env.NODE_ENV === 'test' || typeof jest !== 'undefined';
const isUnitTest = process.env.TEST_TYPE === 'unit';
const isIntegrationTest = process.env.TEST_TYPE === 'integration';

// Define if AWS is configured  
const isAwsConfigured = !!process.env.AWS_REGION;

// Enhanced debugging output
logger.debug(`Storage backend environment detection:
  isTestEnvironment: ${isTestEnvironment}
  isUnitTest: ${isUnitTest}
  isIntegrationTest: ${isIntegrationTest}
  isAwsConfigured: ${isAwsConfigured}
  NODE_ENV: ${process.env.NODE_ENV || 'not set'}
  TEST_TYPE: ${process.env.TEST_TYPE || 'not set'}
  AWS_REGION: ${process.env.AWS_REGION || 'not set'}
  AWS_S3_ENDPOINT_URL: ${process.env.AWS_S3_ENDPOINT_URL || 'not set'}
  AWS_DYNAMODB_ENDPOINT_URL: ${process.env.AWS_DYNAMODB_ENDPOINT_URL || 'not set'}
  AWS_S3_BUCKET_NAME: ${process.env.AWS_S3_BUCKET_NAME || 'not set'}
  AWS_DYNAMODB_TABLE_NAME: ${process.env.AWS_DYNAMODB_TABLE_NAME || 'not set'}
  AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'set' : 'not set'}
  AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'set' : 'not set'}
  AWS_SESSION_TOKEN: ${process.env.AWS_SESSION_TOKEN ? 'set' : 'not set'}
  HTPASSWD_FILE: ${process.env.HTPASSWD_FILE || 'not set'}`);

// TESTING STRATEGY DETERMINATION:
// 1. Unit tests ALWAYS use memory implementation
if (isUnitTest) {
  logger.info('🟢 LOADING MEMORY IMPLEMENTATION (UNIT TEST)');
  module.exports = require('./memory');
} 
// 2. Integration tests with AWS config use AWS
else if (isIntegrationTest && isAwsConfigured) {
  logger.info('🔵 LOADING AWS IMPLEMENTATION (INTEGRATION TEST)');
  module.exports = require('./aws');
}
// 3. For normal operation, use AWS when configured
else if (isAwsConfigured) {
  logger.info('🔵 LOADING AWS IMPLEMENTATION (PRODUCTION)');
  module.exports = require('./aws');
} 
// 4. Default to memory implementation
else {
  logger.info('🟢 LOADING MEMORY IMPLEMENTATION (DEFAULT)');
  module.exports = require('./memory');
}
