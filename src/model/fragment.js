// src/model/fragment.js

// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
const logger = require('../logger');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    logger.debug({ id, ownerId, type, size }, 'Initializing Fragment');
    if (!ownerId) {
      logger.error('Fragment creation failed: Missing ownerId');
      throw new Error(400, 'fragment ownerId is required');
    }

    if (!type) {
      logger.error('Fragment creation failed: Missing type');
      throw new Error(400, 'fragment type is required');
    }

    if (typeof size !== 'number' || size < 0) {
      logger.error('Fragment creation failed: Invalid size');
      throw new Error(400, 'incorrect fragment size');
    }

    if (!Fragment.isSupportedType(type)) {
      logger.error({ type }, 'Fragment creation failed: Unsupported type');
      throw new Error(415, 'unspported fragment type: ' + type);
    }

    this.id = id || randomUUID(); // Short circuit - provides random id if not provided
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || this.created;
    this.type = type;
    this.size = size; // defaults to 0
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    logger.debug({ ownerId, expand }, 'Fetching fragments by user');

    const fragments = await listFragments(ownerId, expand);

    if (!fragments.length) {
      logger.warn({ ownerId }, 'No fragments found for user');
    }

    return expand ? fragments.map((f) => new Fragment(f)) : fragments;
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    logger.debug({ ownerId, id }, 'Fetching fragment by ID');

    const metadata = await readFragment(ownerId, id);
    if (!metadata) {
      logger.error({ ownerId, id }, 'Fragment not found');
      throw new Error('Fragment not found');
    }

    logger.info({ ownerId, id }, 'Fragment retrieved');
    return new Fragment(metadata);
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static async delete(ownerId, id) {
    logger.debug({ ownerId, id }, 'Deleting fragment');
    await deleteFragment(ownerId, id);
    logger.info({ ownerId, id }, 'Fragment deleted');
  }

  /**
   * Saves the current fragment (metadata) to the database
   * @returns Promise<void>
   */
  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  async getData() {
    logger.debug({ id: this.id, ownerId: this.ownerId }, 'Fetching fragment data');
    return await readFragmentData(this.ownerId, this.id);
  }

  /**
   * Sets the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    logger.debug(
      { id: this.id, ownerId: this.ownerId, size: data.length },
      'Setting fragment data'
    );

    if (!(data instanceof Buffer)) {
      logger.error({ id: this.id, ownerId: this.ownerId }, 'Data must be a buffer');
      throw new Error('Cannot set data - data must be a buffer');
    }

    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragmentData(this.ownerId, this.id, data);
    await this.save();
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    if (!this.type) {
      logger.error({ fragment: this }, 'Fragment is missing type');
      return undefined;
    }
    try {
      const { type } = contentType.parse(this.type);
      return type;
    } catch (error) {
      logger.error({ error, type: this.type }, 'Failed to parse Content-Type');
      return undefined;
    }
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/') || this.mimeType === 'application/json';
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    const mimeType = this.mimeType;

    // Default format is always the original type
    const formats = [mimeType];

    switch (mimeType) {
      case 'text/plain':
        // text/plain can only be returned as text/plain
        break;
      case 'text/markdown':
        formats.push('text/html', 'text/plain');
        break;
      case 'text/html':
        formats.push('text/plain');
        break;
      case 'text/csv':
        formats.push('text/plain', 'application/json');
        break;
      case 'application/json':
        formats.push('application/yaml', 'text/plain');
        break;
      default:
        // Any other text/* type can be returned as text/plain
        if (mimeType.startsWith('text/')) {
          formats.push('text/plain');
        }
        break;
    }

    return formats;
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    try {
      const { type } = contentType.parse(value);
      return type.startsWith('text/') || type === 'application/json';
    } catch (err) {
      logger.error({ err }, 'Invalid Content-Type format');
      return false;
    }
  }
}

module.exports.Fragment = Fragment;
