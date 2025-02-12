// src/utils/isTextFragment.js
// separated out into its own file for testing
const logger = require('../logger');

function isTextFragment(fragment) {
  if (!fragment.mimeType || typeof fragment.mimeType !== 'string') {
    logger.warn('Fragment is missing a valid mimeType.');
    return false;
  }

  if (!fragment.mimeType.startsWith('text/')) {
    logger.warn(`Unsupported fragment type: ${fragment.type}. Only text fragments are supported.`);
    return false;
  }

  return true;
}

module.exports = isTextFragment;
