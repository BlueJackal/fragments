// src/routes/api/put.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const contentType = require('content-type');
const { createSuccessResponse, createErrorResponse } = require('../../response');

/**
 * PUT /fragments/:id - Update a fragment for the authenticated user
 *
 * Allows the authenticated user to replace the data for their existing
 * fragment with the specified id. Content type can't be changed here,
 * so it must match the original.
 */
module.exports = async (req, res) => {
  try {
    // Get the authenticated user's hashed email (already set by auth middleware)
    const ownerId = req.user;
    const fragmentId = req.params.id;

    logger.debug({ ownerId, fragmentId }, 'Attempting to update fragment');

    // Ensure the request has a content type header first
    if (!req.headers['content-type']) {
      logger.warn('Missing Content-Type header');
      return res.status(400).json(createErrorResponse(400, 'Content-Type header is required'));
    }

    // Parse the request's content type
    let parsedContentType;
    try {
      parsedContentType = contentType.parse(req.headers['content-type']);
      logger.debug({ parsedContentType }, 'Parsed content type from request');
    } catch (error) {
      logger.warn({ error }, 'Invalid Content-Type format');
      return res.status(400).json(createErrorResponse(400, 'Invalid Content-Type format'));
    }

    // Ensure request body is a Buffer
    if (!Buffer.isBuffer(req.body)) {
      logger.warn({ bodyType: typeof req.body }, 'Request body is not a valid Buffer');
      return res.status(400).json(createErrorResponse(400, 'Invalid request body format'));
    }

    // Check if fragment exists after validating request data
    let fragment;
    try {
      fragment = await Fragment.byId(ownerId, fragmentId);
      logger.debug({ fragment }, 'Found fragment to update');
    } catch (error) {
      // Check specifically for "Fragment not found" message
      if (error.message === 'Fragment not found') {
        logger.warn({ ownerId, fragmentId }, 'Fragment not found: ' + error.message);
        return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
      }

      // Handle all other errors as server errors
      logger.error({ error, stack: error.stack }, 'Unexpected error retrieving fragment');
      return res.status(500).json(createErrorResponse(500, 'Error updating fragment'));
    }

    const mimeType = parsedContentType.type;
    logger.debug(
      {
        requestType: mimeType,
        fragmentType: fragment.mimeType,
      },
      'Comparing content types'
    );

    // Check that the content type matches the fragment's original type
    if (mimeType !== fragment.mimeType) {
      logger.warn(
        { existing: fragment.mimeType, requested: mimeType },
        'Content-Type mismatch on update'
      );
      return res
        .status(400)
        .json(
          createErrorResponse(
            400,
            `Cannot update fragment with different Content-Type. Original: ${fragment.mimeType}, Requested: ${mimeType}`
          )
        );
    }

    // Update the fragment data
    logger.debug({ fragmentId, dataSize: req.body.length }, 'Updating fragment data');
    await fragment.setData(req.body);
    logger.debug('Fragment data updated successfully');

    // Return success with updated fragment metadata
    logger.info({ fragmentId }, 'Fragment updated successfully');
    return res.status(200).json(createSuccessResponse({ fragment }));
  } catch (error) {
    logger.error({ error, stack: error.stack }, 'Error updating fragment');
    return res.status(500).json(createErrorResponse(500, 'Error updating fragment'));
  }
};
