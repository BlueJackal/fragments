// src/routes/api/index.js

const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

const router = express.Router();

// Middleware uses raw body to check for supported content types
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      try {
        const { type } = contentType.parse(req);
        return Fragment.isSupportedType(type);
      } catch (err) {
        logger.error('Unsupported fragment type: ' + err);
        return false; // Reject unsupported types
      }
    },
  });

// GET /fragments - list all fragments belonging to current user
router.get('/fragments', require('./get'));

// GET /fragments/:id - retrieve a specific fragment by ID
router.get('/fragments/:id', require('./getById'));

// GET /fragments/:id/info - retrieve metadata for a specific fragment by ID
router.get('/fragments/:id/info', require('./getByIdInfo'));

// POST /fragments: add a new fragment (with raw body parsing)
router.post('/fragments', rawBody(), require('./post'));

// PUT /fragments/:id - update an existing fragment (with raw body parsing)
router.put('/fragments/:id', rawBody(), require('./put'));

// DELETE /fragments/:id - delete an existing fragment
router.delete('/fragments/:id', require('./delete'));

module.exports = router;
