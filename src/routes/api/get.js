// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

/**
 * GET /fragments - Returns a list of the authenticated user's existing fragment IDs.
 */
module.exports = async (req, res) => {
  try {
    // Get the authenticated user's hashed email (already set by auth middleware)
    const ownerId = req.user;

    // Fetch the user's fragments (Only the IDs / metadata)
    const fragments = (await Fragment.byUser(ownerId, false)) || [];

    // Log retrieved fragments
    logger.info({ ownerId, fragments }, 'User fragments retrieved');

    // Respond with the list of fragment IDs
    res.status(200).json({
      status: 'ok',
      fragments, // List of fragment IDs
    });
  } catch (error) {
    logger.error({ error }, 'Error retrieving fragments:' + error);
    res.status(500).json({ error: 'Error retrieving fragments', details: error.message });
  }
};
