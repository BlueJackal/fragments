// src/model/data/memory/index.js

const MemoryDB = require('./memory-db');

// Create two in-memory databases: one for fragment metadata and the other for raw data
/* Note to self - metadata is paired with data, but kept separate to make queries easier.
   For example, if a fragment is a 10mb image, fetching all fragments with their data would suck. 
   Every time we create a new fragment, we store metadata and data separately, but
   can reference easily reference each because they share the same primary/secondary keys. I'm understand this. Sweet. */

const data = new MemoryDB();
const metadata = new MemoryDB();

// Write a fragment's metadata to memory db. Returns a Promise<void>
function writeFragment(fragment) {
  // Simulate db/network serialization of the value, storing only JSON representation.
  // This is important because it's how things will work later with AWS data stores.

  /* Note to self - serialization means converting data into a format that can be stored or transmitted.
     It's done because databases can't always store complex JavaScript objects, but strings are safe to store.
     JSON.stringify() and JSON.parse() are built in functions for converting to/from strings. */

  if (!fragment || !fragment.ownerId || !fragment.id || !fragment.type) {
    throw new Error(
      `Invalid fragment: Missing required fields. Received: ${JSON.stringify(fragment)}`
    );
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
  return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
}

// Write a fragment's data buffer to memory db. Returns a Promise
function writeFragmentData(ownerId, id, buffer) {
  if (!ownerId || !id || !buffer) {
    throw new Error(
      `Invalid fragment: Missing required fields. Received: ${JSON.stringify(ownerId, id, buffer)}`
    );
  }

  return data.put(ownerId, id, buffer);
}

// Read a fragment's data from memory db. Returns a Promise
function readFragmentData(ownerId, id) {
  return data.get(ownerId, id);
}

// Get a list of fragment ids/objects for the given user from memory db. Returns a Promise
async function listFragments(ownerId, expand = false) {
  const fragments = await metadata.query(ownerId);
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
  return Promise.all([
    // Delete metadata
    metadata.del(ownerId, id),
    // Delete data
    data.del(ownerId, id),
  ]);
}

module.exports.listFragments = listFragments;
module.exports.writeFragment = writeFragment;
module.exports.readFragment = readFragment;
module.exports.writeFragmentData = writeFragmentData;
module.exports.readFragmentData = readFragmentData;
module.exports.deleteFragment = deleteFragment;
