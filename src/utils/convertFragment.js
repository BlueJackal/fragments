// src/utils/convertFragment.js

const MarkdownIt = require('markdown-it');
const TurndownService = require('turndown');
const { parse: csvParse } = require('csv-parse/sync');
const { Parser: Json2CsvParser } = require('json2csv');

/**
 * Map file extension to MIME type.
 */
function getContentTypeFromExtension(ext) {
  const mapping = {
    '.txt':  'text/plain',
    '.md':   'text/markdown',
    '.html': 'text/html',
    '.csv':  'text/csv',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif':  'image/gif',
    '.avif': 'image/avif',
  };
  return mapping[ext.toLowerCase()] || null;
}

/**
 * Determine if conversion between two types is supported.
 */
function isSupportedConversion(srcType, tgtType) {
  // Identity conversion
  if (srcType === tgtType) return true;

  // Any text/* -> text/plain
  if (tgtType === 'text/plain' && srcType.startsWith('text/')) return true;

  // Markdown -> HTML
  if (srcType === 'text/markdown' && tgtType === 'text/html') return true;

  // CSV -> JSON
  if (srcType === 'text/csv' && tgtType === 'application/json') return true;

  return false;
}

/**
 * Convert the fragment data from srcType to tgtType. Returns a Buffer.
 */
function convertFragment(data, srcType, tgtType) {
  // Normalize input to string
  let text;
  if (Buffer.isBuffer(data)) {
    text = data.toString('utf8');
  } else if (typeof data === 'string') {
    text = data;
  } else {
    text = String(data);
  }

  // Identity
  if (srcType === tgtType) {
    return data;
  }

  // Markdown -> HTML
  if (srcType === 'text/markdown' && tgtType === 'text/html') {
    const md = new MarkdownIt();
    return Buffer.from(md.render(text), 'utf8');
  }

  // Markdown -> Plain Text (passthrough)
  if (srcType === 'text/markdown' && tgtType === 'text/plain') {
    return Buffer.from(text, 'utf8');
  }

  // HTML -> Markdown
  if (srcType === 'text/html' && tgtType === 'text/markdown') {
    const turndown = new TurndownService();
    return Buffer.from(turndown.turndown(text), 'utf8');
  }

  // HTML -> Plain Text (strip tags)
  if (srcType === 'text/html' && tgtType === 'text/plain') {
    // Remove all HTML tags
    const stripped = text.replace(/<[^>]*>/g, '');
    return Buffer.from(stripped, 'utf8');
  }

  // Plain Text -> HTML (wrap in <pre>)
  if (srcType === 'text/plain' && tgtType === 'text/html') {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return Buffer.from(`<pre>${escaped}</pre>`, 'utf8');
  }

  // Plain Text -> Markdown (passthrough)
  if (srcType === 'text/plain' && tgtType === 'text/markdown') {
    return Buffer.from(text, 'utf8');
  }

  // CSV -> JSON
  if (srcType === 'text/csv' && tgtType === 'application/json') {
    const records = csvParse(text, { columns: true, skip_empty_lines: true });
    return Buffer.from(JSON.stringify(records, null, 2), 'utf8');
  }

  // JSON -> CSV
  if (srcType === 'application/json' && tgtType === 'text/csv') {
    let obj = JSON.parse(text);
    if (!Array.isArray(obj)) obj = [obj];
    const parser = new Json2CsvParser({ flatten: true });
    return Buffer.from(parser.parse(obj), 'utf8');
  }

  // JSON -> Plain Text (passthrough)
  if (srcType === 'application/json' && tgtType === 'text/plain') {
    return Buffer.from(text, 'utf8');
  }

  // Plain Text -> JSON (wrap in quotes)
  if (srcType === 'text/plain' && tgtType === 'application/json') {
    return Buffer.from(JSON.stringify(text), 'utf8');
  }

  // CSV -> Plain Text (passthrough)
  if (srcType === 'text/csv' && tgtType === 'text/plain') {
    return Buffer.from(text, 'utf8');
  }

  // Unsupported conversion
  throw new Error(`Conversion from ${srcType} to ${tgtType} is not supported`);
}

module.exports = {
  getContentTypeFromExtension,
  isSupportedConversion,
  convertFragment,
};
