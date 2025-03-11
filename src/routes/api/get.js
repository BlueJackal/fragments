// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

/**
 * GET /fragments - Returns a list of the authenticated user's existing fragment IDs.
 * If expand=1 is provided as a query param, returns full fragment metadata.
 */
module.exports = async (req, res) => {
  try {
    // Get the authenticated user's hashed email (already set by auth middleware)
    const ownerId = req.user;

    // Check if the expand parameter is set to 1
    const expand = req.query.expand === '1';

    logger.debug({ ownerId, expand }, 'Getting fragments with expand=' + expand);

    // Fetch the user's fragments (IDs or full metadata based on expand)
    const fragments = (await Fragment.byUser(ownerId, expand)) || [];

    // Log retrieved fragments
    logger.info({ ownerId, fragmentsCount: fragments.length }, 'User fragments retrieved');

    // Respond with the list of fragment IDs or full metadata
    res.status(200).json({
      status: 'ok',
      fragments, // List of fragment IDs or full metadata objects
    });
  } catch (error) {
    logger.error({ error }, 'Error retrieving fragments:' + error);
    res.status(500).json({
      status: 'error',
      error: {
        message: 'Error retrieving fragments',
        code: 500,
      },
    });
  }
};
