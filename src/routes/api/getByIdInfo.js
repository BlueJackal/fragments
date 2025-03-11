// src/routes/api/getByIdInfo.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

/**
 * GET /fragments/:id/info - Returns metadata for a specific fragment
 *
 * The response includes complete fragment metadata without the actual data content.
 */
module.exports = async (req, res) => {
  const ownerId = req.user;
  const fragmentId = req.params.id;

  logger.debug({ ownerId, fragmentId }, 'Fetching fragment metadata for info');

  try {
    // Attempt to retrieve the fragment
    const fragment = await Fragment.byId(ownerId, fragmentId);

    // Successfully retrieved fragment metadata
    logger.debug({ fragment }, 'Fragment metadata retrieved for info endpoint');

    // Return the fragment metadata with the expected response format
    res.status(200).json(createSuccessResponse({ fragment }));
  } catch (error) {
    // Handle different types of errors
    if (error.message === 'Fragment not found') {
      logger.warn({ ownerId, fragmentId }, 'No matching fragment found');
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // For all other errors, return a 500 with a consistent error message
    logger.error({ error, stack: error.stack }, 'Error retrieving fragment metadata');
    return res.status(500).json(createErrorResponse(500, 'Error retrieving fragment metadata'));
  }
};
