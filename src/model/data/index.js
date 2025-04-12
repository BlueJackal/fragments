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

// Define test environment variable
const isTestEnvironment = process.env.NODE_ENV === 'test' || typeof jest !== 'undefined';

// Now you can use it in your log statement
logger.debug(`Detected environment: ${isTestEnvironment ? 'test' : 'normal'}, AWS_REGION=${process.env.AWS_REGION}`);

// Define if AWS is configured  
const isAwsConfigured = !!process.env.AWS_REGION;

// Fix the export logic to use AWS implementation when AWS is configured
module.exports = isTestEnvironment && !isAwsConfigured
  ? require('./memory')  // Only use memory for tests WITHOUT AWS config
  : isAwsConfigured 
    ? require('./aws')   // Use AWS when configured, even in tests
    : require('./memory'); // Fall back to memory
