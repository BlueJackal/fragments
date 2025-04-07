// src/model/data/index.js
// const logger = require('../../logger');

/* ---------------------------------------------------

This file is the entry point for our backend strategy.

For the sake of assignment 1, it only points to our
current in-memory implementation.

In the future we'll probably be able to switch between
local and an AWS service by using an environment
variable.

--------------------------------------------------- */

// If the environment sets an AWS Region, we'll use AWS backend
// services (S3, DynamoDB); otherwise, we'll use an in-memory db.
module.exports = process.env.AWS_REGION ? require('./aws') : require('./memory');

//logger.info({ id: this.id, ownerId: this.ownerId }, 'Fragment metadata saved');
