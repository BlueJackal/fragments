// src/routes/api/getById.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const isTextFragment = require('../../utils/isTextFragment');

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
      logger.warn({ ownerId, fragmentId }, 'No matching fragment found: ' + error.message);

      if (error.message === 'Fragment not found') {
        return res.status(404).json({ error: 'Fragment not found' });
      }

      res.status(500).json({ error: 'Error retrieving fragment', details: error.message });
    }

    // Debug metadata
    logger.debug({ fragment }, 'Fragment metadata retrieved');

    // Debugging to check if fragment has the correct type
    logger.debug(
      { fragmentId, type: fragment.type, mimeType: fragment.mimeType },
      'Checking fragment type'
    );

    logger.debug('Checking if fragment type is supported.');

    // Check fragment type
    if (!isTextFragment(fragment)) {
      return res.status(415).json({
        error: 'Only text fragments are supported',
      });
    }

    logger.debug('Fragment type is supported:' + fragment.type);

    logger.debug('Retreiving fragment data.');
    const data = await fragment.getData();

    // Log retrieved data
    logger.debug({ fragmentId, data: data.toString() }, 'Retrieved fragment data');

    res.setHeader('Content-Type', fragment.mimeType);
    res.status(200).send(data.toString());
  } catch (error) {
    logger.error({ error, stack: error.stack }, 'Error retrieving fragment');
    res.status(500).json({ error: 'Error retrieving fragment', details: error.message });
  }
};
