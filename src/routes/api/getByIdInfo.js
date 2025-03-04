// src/routes/api/getByIdInfo.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

// Returns metadata for a specific fragment
module.exports = async (req, res) => {
  try {
    // Get the authenticated user's hashed email (already set by auth middleware)
    const ownerId = req.user;
    const fragmentId = req.params.id;

    logger.debug({ ownerId, fragmentId }, 'Fetching fragment metadata for info');

    // Attempt to retrieve the fragment
    let fragment;
    try {
      fragment = await Fragment.byId(ownerId, fragmentId);
    } catch (error) {
      logger.warn({ ownerId, fragmentId }, 'No matching fragment found: ' + error.message);

      if (error.message === 'Fragment not found') {
        return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
      }

      return res.status(500).json(createErrorResponse(500, 'Error retrieving fragment'));
    }

    // Log retrieved metadata
    logger.debug({ fragment }, 'Fragment metadata retrieved for info endpoint');

    // Return the fragment metadata
    res.status(200).json(createSuccessResponse({ fragment }));
  } catch (error) {
    logger.error({ error, stack: error.stack }, 'Error retrieving fragment metadata');
    res.status(500).json(createErrorResponse(500, 'Error retrieving fragment metadata'));
  }
};
