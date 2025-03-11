// src/utils/isTextFragment.js
// separated out into its own file for testing
const logger = require('../logger');

function isTextFragment(fragment) {
  if (!fragment.mimeType || typeof fragment.mimeType !== 'string') {
    logger.warn('Fragment is missing a valid mimeType.');
    return false;
  }

  // Update to support both text/* and application/json
  if (!fragment.mimeType.startsWith('text/') && fragment.mimeType !== 'application/json') {
    logger.warn(
      `Unsupported fragment type: ${fragment.type}. Only text and JSON fragments are supported.`
    );
    return false;
  }

  return true;
}

module.exports = isTextFragment;
