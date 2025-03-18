// src/routes/api/getById.js

const path = require('path');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const isTextFragment = require('../../utils/isTextFragment');
const {
  getContentTypeFromExtension,
  isSupportedConversion,
  convertFragment,
} = require('../../utils/convertFragment');

/**
 * GET /fragments/:id - Retrieve a specific fragment by ID, with optional format conversion
 */
module.exports = async (req, res) => {
  try {
    const ownerId = req.user;

    // Extract any file extension from the id
    const idWithPossibleExt = req.params.id;
    let fragmentId = idWithPossibleExt;
    let requestedExt = null;
    let targetContentType = null;

    // Check if there's an extension in the ID (e.g., '123.html')
    const parsedPath = path.parse(idWithPossibleExt);
    if (parsedPath.ext) {
      // Extract the actual fragment ID without the extension
      fragmentId = parsedPath.name;
      requestedExt = parsedPath.ext;
      targetContentType = getContentTypeFromExtension(requestedExt);

      // Check if the extension is known/valid
      if (!targetContentType) {
        logger.warn({ requestedExt }, 'Unknown file extension requested');
        return res.status(415).json({
          status: 'error',
          error: 'Unsupported conversion format',
        });
      }

      logger.debug(
        { fragmentId, requestedExt, targetContentType },
        'Fragment requested with conversion'
      );
    } else {
      logger.debug({ fragmentId }, 'Fragment requested without conversion');
    }

    // Attempt to retrieve the fragment
    let fragment;
    try {
      fragment = await Fragment.byId(ownerId, fragmentId);
    } catch (error) {
      logger.warn({ ownerId, fragmentId }, 'No matching fragment found: ' + error.message);

      if (error.message === 'Fragment not found') {
        return res.status(404).json({
          status: 'error',
          error: {
            message: 'Fragment not found',
          },
        });
      }

      return res.status(500).json({
        status: 'error',
        error: {
          code: 500,
          message: 'Error retrieving fragment',
        },
      });
    }

    // Debug metadata
    logger.debug({ fragment }, 'Fragment metadata retrieved');

    // Get the fragment data
    const data = await fragment.getData();

    // Check if fragment type is supported (after getData for test compatibility)
    if (!isTextFragment(fragment)) {
      logger.warn({ mimeType: fragment.mimeType }, 'Unsupported fragment type');
      return res.status(415).json({
        status: 'error',
        error: 'Unsupported fragment type',
      });
    }

    // If no conversion requested, just return the data in its original format
    if (!targetContentType) {
      res.setHeader('Content-Type', fragment.mimeType);
      return res.status(200).send(data);
    }

    // Check if the requested conversion is supported
    if (!isSupportedConversion(fragment.mimeType, targetContentType)) {
      logger.warn(
        { sourceType: fragment.mimeType, targetType: targetContentType },
        'Unsupported conversion requested'
      );
      return res.status(415).json({
        status: 'error',
        error: {
          code: 415,
          message: 'Conversion not supported',
        },
      });
    }

    try {
      // Perform the conversion
      const convertedData = convertFragment(data, fragment.mimeType, targetContentType);

      // Send the converted result
      res.setHeader('Content-Type', targetContentType);
      return res.status(200).send(convertedData);
    } catch (error) {
      logger.error(
        { error, fragmentId, sourceType: fragment.mimeType, targetType: targetContentType },
        'Error converting fragment'
      );
      return res.status(415).json({
        status: 'error',
        error: {
          message: 'Error converting fragment',
        },
      });
    }
  } catch (error) {
    logger.error({ error, stack: error.stack }, 'Error retrieving fragment');
    return res.status(500).json({
      status: 'error',
      error: {
        code: 500,
        message: 'Error retrieving fragment',
      },
    });
  }
};
