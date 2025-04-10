// src/routes/api/delete.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

/**
 * DELETE /fragments/:id - Delete a fragment for the authenticated user
 *
 * Allows the authenticated user to delete one of their existing fragments with
 * the given id. Returns 404 if the fragment doesn't exist.
 */
module.exports = async (req, res) => {
  try {
    // Get the authenticated user's hashed email (already set by auth middleware)
    const ownerId = req.user;
    const fragmentId = req.params.id;

    logger.debug({ ownerId, fragmentId }, 'Attempting to delete fragment');

    // Check if fragment exists before deleting
    try {
      // We only need to check if the fragment exists, we don't need to use the data
      await Fragment.byId(ownerId, fragmentId);
      logger.debug({ fragmentId }, 'Fragment found, proceeding with deletion');
    } catch (error) {
      // The fragment doesn't exist or other error
      if (error.message === 'Fragment not found') {
        logger.warn({ ownerId, fragmentId }, 'Fragment not found for deletion');
        return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
      }

      // For any other errors, return a 500
      logger.error({ error, stack: error.stack }, 'Error checking fragment existence');
      return res.status(500).json(createErrorResponse(500, 'Error deleting fragment'));
    }

    // Delete the fragment
    await Fragment.delete(ownerId, fragmentId);
    logger.info({ ownerId, fragmentId }, 'Fragment deleted successfully');

    // Return success response
    return res.status(200).json(createSuccessResponse());
  } catch (error) {
    logger.error({ error, stack: error.stack }, 'Error deleting fragment');
    return res.status(500).json(createErrorResponse(500, 'Error deleting fragment'));
  }
};
