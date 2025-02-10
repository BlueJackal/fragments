// src/model/data/memory/index.js

const MemoryDB = require('./memory-db');
const logger = require('../../../logger');

// Create two in-memory databases: one for fragment metadata and the other for raw data
/* Note to self - metadata is paired with data, but kept separate to make queries easier.
   For example, if a fragment is a 10mb image, fetching all fragments with their data would suck. 
   Every time we create a new fragment, we store metadata and data separately, but
   can reference easily reference each because they share the same primary/secondary keys. */

const data = new MemoryDB();
const metadata = new MemoryDB();

// Write a fragment's metadata to memory db. Returns a Promise<void>
function writeFragment(fragment) {
  // Simulate db/network serialization of the value, storing only JSON representation.
  // This is important because it's how things will work later with AWS data stores.

  /* Note to self - serialization means converting data into a format that can be stored or transmitted.
     It's done because databases can't always store complex JavaScript objects, but strings are safe to store.
     JSON.stringify() and JSON.parse() are built in functions for converting to/from strings. */
  logger.debug({ fragment }, 'Attempting to write fragment metadata');

  if (!fragment || !fragment.ownerId || !fragment.id || !fragment.type) {
    const errorMessage = `Invalid fragment: Missing required fields. Received: ${JSON.stringify(fragment)}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  const serialized = JSON.stringify(fragment);
  return metadata.put(fragment.ownerId, fragment.id, serialized);
}

// Read a fragment's metadata from memory db. Returns a Promise<Object>
async function readFragment(ownerId, id) {
  // NOTE: this data will be raw JSON, we need to turn it back into an Object.
  // You'll need to take care of converting this back into a Fragment instance
  // higher up in the callstack.

  // Note to self - figure out why we do this further up the call stack
  const serialized = await metadata.get(ownerId, id);
  if (!serialized) {
    logger.warn({ ownerId, id }, 'Fragment not found');
    return undefined;
  }
  logger.debug({ ownerId, id }, 'Fragment metadata retrieved');
  return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
}

// Write a fragment's data buffer to memory db. Returns a Promise
function writeFragmentData(ownerId, id, buffer) {
  if (!ownerId || !id || !buffer) {
    const errorMessage = `Invalid fragment: Missing required fields. Received: ${JSON.stringify({ ownerId, id, buffer })}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  return data.put(ownerId, id, buffer);
}

// Read a fragment's data from memory db. Returns a Promise
function readFragmentData(ownerId, id) {
  return data.get(ownerId, id);
}

// Get a list of fragment ids/objects for the given user from memory db. Returns a Promise
async function listFragments(ownerId, expand = false) {
  logger.debug({ ownerId, expand }, 'Listing fragments');

  const fragments = await metadata.query(ownerId);
  if (!fragments.length) {
    logger.warn({ ownerId }, 'No fragments found');
    return [];
  }

  logger.info({ ownerId, count: fragments.length }, ' fragments retrieved');
  const parsedFragments = fragments.map((fragment) => JSON.parse(fragment));

  // If we don't get anything back, or are supposed to give expanded fragments, return
  if (expand || !fragments) {
    return parsedFragments;
  }

  // Otherwise, map to only send back the ids
  return parsedFragments.map((fragment) => fragment.id);
}

// Delete a fragment's metadata and data from memory db. Returns a Promise
function deleteFragment(ownerId, id) {
  logger.debug({ ownerId, id }, 'Attempting to delete fragment');

  return Promise.all([
    metadata.del(ownerId, id).catch((err) => {
      logger.error({ ownerId, id, error: err.message }, 'Error deleting fragment metadata');
      throw err;
    }),
    data.del(ownerId, id).catch((err) => {
      logger.error({ ownerId, id, error: err.message }, 'Error deleting fragment data');
      throw err;
    }),
  ]).then(() => {
    logger.info({ ownerId, id }, 'Fragment deleted');
  });
}

module.exports.listFragments = listFragments;
module.exports.writeFragment = writeFragment;
module.exports.readFragment = readFragment;
module.exports.writeFragmentData = writeFragmentData;
module.exports.readFragmentData = readFragmentData;
module.exports.deleteFragment = deleteFragment;
