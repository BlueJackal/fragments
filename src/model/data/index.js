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

// If we're in test environment, always use memory backend
// Otherwise use AWS if AWS_REGION is configured, else use memory
const isTestEnvironment = process.env.NODE_ENV === 'test' || typeof jest !== 'undefined';

// Log which implementation we're using for debugging
logger.debug(`Detected environment: ${isTestEnvironment ? 'test' : 'normal'}, AWS_REGION=${process.env.AWS_REGION}`);

// IMPORTANT: Use isTestEnvironment in the decision logic
// If in test env, always use memory; otherwise respect AWS_REGION setting
module.exports = isTestEnvironment 
  ? require('./memory') 
  : (process.env.AWS_REGION ? require('./aws') : require('./memory'));
