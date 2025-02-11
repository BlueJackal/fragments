// src/routes/post.js

const express = require('express');
const router = express.Router();
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const contentType = require('content-type');

// POST /fragments
router.post('/fragments', async (req, res) => {
  try {
    // Ensure the request has a valid Content-Type header
    if (!req.headers['content-type']) {
      logger.warn('Missing Content-Type header');
      return res.status(400).json({ error: 'Content-Type header is required' });
    }

    let parsedContentType;
    try {
      parsedContentType = contentType.parse(req.headers['content-type']);
    } catch (error) {
      logger.warn({ error }, 'Invalid Content-Type format');
      return res.status(400).json({ error: 'Invalid Content-Type format' });
    }

    const mimeType = parsedContentType.type;

    // Check if the type is supported
    if (!Fragment.isSupportedType(mimeType)) {
      logger.warn({ mimeType }, 'Unsupported Content-Type');
      return res.status(415).json({ error: 'Unsupported Content-Type' });
    }

    // Ensure request body is a Buffer
    if (!Buffer.isBuffer(req.body)) {
      logger.warn('Request body is not a valid Buffer');
      return res.status(400).json({ error: 'Invalid request body format' });
    }

    // Extract user ID from the authenticated request
    const ownerId = req.user; // req.user is set globally by authentication middleware

    // Create a new fragment
    const fragment = new Fragment({
      ownerId,
      type: mimeType,
      size: req.body.length,
    });

    // Save fragment metadata and data
    await fragment.save();
    await fragment.setData(req.body);

    /**
     * Location Header and API URL
     *
     * When we create a new fragment, assign it an id, and store it.
     *
     * Our server sends back a response saying it successfully created the fragment (201) and
     * it shares a *location header* that tells the client where to retrieve this new fragment.
     *
     * Because of our URL is dynamic (servers/localhost) and we need to return a url with this
     * type of request, we use an envionment variable with a fallback of req.headers.host.
     *
     */
    const apiUrl = process.env.API_URL || `http://${req.headers.host}`;
    const location = `${apiUrl}/fragments/${fragment.id}`;

    logger.info({ location }, 'Fragment created successfully');

    // Respond with 201 Created and Location header
    res.status(201).location(location).json(fragment);
  } catch (err) {
    logger.error({ err }, 'Error creating fragment');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
