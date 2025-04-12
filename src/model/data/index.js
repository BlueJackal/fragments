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

// Now you can use it in your log statement
logger.debug(`Detected environment: ${isTestEnvironment ? 'test' : 'normal'}, 
  AWS_REGION=${process.env.AWS_REGION || 'not set'}, 
  TEST_TYPE=${process.env.TEST_TYPE || 'not set'}`);

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
