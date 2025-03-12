// src/routes/post.js

const express = require('express');
const router = express.Router();
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const contentType = require('content-type');

router.post('/fragments', async (req, res) => {
  try {
    // Ensure the request has a content type header
    if (!req.headers['content-type']) {
      logger.warn('Missing Content-Type header');
      return res.status(400).json({ error: 'Content-Type header is required' });
    }

    /**
     *  Content Type Validation
     *
     *  Checking if the content type meets HTTP specification (aka if it's a real type)
     *
     *  content-type is a library that lets us validate the content type that is sent along with
     *  every HTTP request. It's used to indicate the media type of the resource, and it's located
     *  in the HTTP header.
     *
     *  If the media type isn't a known one, we'll return an error.
     *
     *  Getting the MIME type is the next step. We further identify the format and determine how to handle it.
     *
     *  For example, parsing the content type would give us { type: 'text/plain', parameters: { charset: 'utf-8' } }
     *  The mimeType would just be 'text/plain'.
     *
     */
    let parsedContentType;
    try {
      parsedContentType = contentType.parse(req.headers['content-type']);
    } catch (error) {
      logger.warn({ error }, 'Invalid Content-Type format');
      return res.status(400).json({ error: 'Invalid Content-Type format' });
    }

    const mimeType = parsedContentType.type;

    // Compare with our supported types
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

    // Create new fragment metadata
    const fragment = new Fragment({
      ownerId,
      type: mimeType,
      size: req.body.length,
    });

    // Save both the metadata and fragment data
    await fragment.save();
    await fragment.setData(req.body);

    /**
     * Location Header and API URL
     *
     * When we create a new fragment, we assign it an id and store it.
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
