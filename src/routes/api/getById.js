// src/routes/api/getById.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

// Get specific fragment
// ownerId is fixed and tied to auth, so it will only retrieve frags for current user
module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const fragmentId = req.params.id;

    logger.debug({ ownerId, fragmentId }, 'Fetching fragment');

    // Attempt to retrieve the fragment
    let fragment;
    try {
      fragment = await Fragment.byId(ownerId, fragmentId);
    } catch (error) {
      logger.warn({ ownerId, fragmentId }, 'No matching fragment found:' + error);
      return res.status(404).json({ error: 'Fragment not found' });
    }

    if (!fragment) {
      logger.warn({ ownerId, fragmentId }, 'No matching fragment found for user');
      return res.status(404).json({ error: 'No matching fragment found' });
    }

    // Debug metadata
    logger.debug({ fragment }, 'Fragment metadata retrieved');

    // Debugging to check if fragment has the correct type
    logger.debug(
      { fragmentId, type: fragment.type, mimeType: fragment.mimeType },
      'Checking fragment type'
    );

    if (!fragment.mimeType.startsWith('text/')) {
      logger.warn(
        { fragmentId, type: fragment.type, mimeType: fragment.mimeType },
        'Unsupported fragment type: ' + fragment.type + ' only text fragments are supported.'
      );
      return res.status(415).json({
        error:
          'Unsupported fragment type: ' + fragment.type + ' only text fragments are supported.',
      });
    }

    if (!fragment) {
      logger.warn({ ownerId, fragmentId }, 'No matching fragment found');
      return res.status(404).json({ error: 'Fragment not found' });
    }

    const data = await fragment.getData();

    // Log retrieved data
    logger.debug({ fragmentId, data: data.toString() }, 'Retrieved fragment data');

    // Ensure the authenticated user owns this fragment
    if (fragment.ownerId !== ownerId) {
      logger.warn(
        { requestedBy: ownerId, actualOwner: fragment.ownerId },
        'Unauthorized access attempt'
      );
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.setHeader('Content-Type', fragment.mimeType);
    res.status(200).send(data.toString());
  } catch (error) {
    logger.error({ error, stack: error.stack }, 'Error retrieving fragment');
    res.status(500).json({ error: 'Error retrieving fragment', details: error.message });
  }
};
