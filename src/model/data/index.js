// src/model/data/index.js

/* ---------------------------------------------------

This file is the entry point for our backend strategy.

For the sake of assignment 1, it only points to our
current in-memory implementation.

In the future we'll probably be able to switch between
local and an AWS service by using an environment
variable.

--------------------------------------------------- */

// Note to self - if we just require ./memory it'll fetch the index file.
// The index file will handle everything else we need from that directory.
module.exports = require('./memory');
