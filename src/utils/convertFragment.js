// src/utils/convertFragment.js

const logger = require('../logger');
const markdown = require('markdown-it')();

/**
 * Utility functions for converting fragments between different formats
 * Separated for ease of testing
 */

// Mapping extensions to mime types
const extensionToContentType = {
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.yaml': 'application/yaml',
  '.yml': 'application/yaml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

// Get type from file extension
function getContentTypeFromExtension(extension) {
  const contentType = extensionToContentType[extension.toLowerCase()];
  if (!contentType) {
    logger.warn({ extension }, 'Unknown file extension');
  }
  return contentType || null;
}

// Check if conversion is supported
function isSupportedConversion(sourceType, targetType) {
  // No conversion needed if types are the same
  if (sourceType === targetType) {
    return true;
  }

  // Check if type is supported
  switch (sourceType) {
    case 'text/markdown':
      return ['text/html', 'text/plain'].includes(targetType);
    case 'text/html':
      return ['text/plain'].includes(targetType);
    case 'text/csv':
      return ['text/plain', 'application/json'].includes(targetType);
    case 'application/json':
      return ['text/plain', 'application/yaml', 'application/yml'].includes(targetType);
    case 'application/yaml':
      return ['text/plain'].includes(targetType);
    // TODO: Image conversion in assignment 3
    default:
      // Convert any other text-based type to text/plain
      if (sourceType.startsWith('text/')) {
        return targetType === 'text/plain';
      }
      return false;
  }
}

// Convert fragment data between different formats
function convertFragment(data, sourceType, targetType) {
  logger.debug({ sourceType, targetType }, 'Converting fragment');

  // If source and target are the same, no conversion needed
  if (sourceType === targetType) {
    logger.debug('No conversion necessary, types match');
    return data;
  }

  // Check if this conversion is supported
  if (!isSupportedConversion(sourceType, targetType)) {
    logger.warn({ sourceType, targetType }, 'Unsupported conversion');
    throw new Error(`Conversion from ${sourceType} to ${targetType} is not supported`);
  }

  // Make sure we're working with string data for text conversions
  const textData = Buffer.isBuffer(data) ? data.toString() : data;

  // Handle different conversion types
  switch (sourceType) {
    case 'text/markdown': {
      if (targetType === 'text/html') {
        // Convert Markdown to HTML
        logger.debug('Converting Markdown to HTML');
        const htmlContent = markdown.render(textData);
        return Buffer.from(htmlContent);
      }
      if (targetType === 'text/plain') {
        // Markdown to plaintext just returns the original text
        return Buffer.from(textData);
      }
      break;
    }
    case 'text/html': {
      if (targetType === 'text/plain') {
        // Very basic HTML to text - in a real app you might use a better HTML->text converter
        const plainText = textData.replace(/<[^>]*>/g, '');
        return Buffer.from(plainText);
      }
      break;
    }
    case 'text/csv': {
      if (targetType === 'text/plain') {
        // CSV is already text
        return Buffer.from(textData);
      }
      if (targetType === 'application/json') {
        // Basic CSV to JSON conversion
        // In a real app, you'd want a more robust CSV parser
        const lines = textData.split('\n');
        const headers = lines[0].split(',').map((h) => h.trim());
        const result = [];

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim() === '') continue;

          const values = lines[i].split(',').map((v) => v.trim());
          const obj = {};

          headers.forEach((header, index) => {
            obj[header] = values[index];
          });

          result.push(obj);
        }

        return Buffer.from(JSON.stringify(result));
      }
      break;
    }
    case 'application/json': {
      if (targetType === 'text/plain') {
        // JSON is already text
        return Buffer.from(textData);
      }
      // For JSON to YAML, we'd need a YAML library
      // Not implementing for now, but would go here
      break;
    }
    default: {
      // Any text format to plain text
      if (sourceType.startsWith('text/') && targetType === 'text/plain') {
        return Buffer.from(textData);
      }
    }
  }

  // If we reach here, conversion is not implemented
  logger.warn({ sourceType, targetType }, 'Conversion not implemented');
  throw new Error(`Conversion from ${sourceType} to ${targetType} is not implemented yet`);
}

module.exports = {
  getContentTypeFromExtension,
  isSupportedConversion,
  convertFragment,
};
