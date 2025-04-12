// src/model/data/memory/index.js

const logger = require('../../../logger');
const s3Client = require('./s3Client');
const ddbDocClient = require('./ddbDocClient');
const { PutCommand, GetCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// At the beginning of aws/index.js
console.log('🔵 LOADING AWS IMPLEMENTATION');

// Create two in-memory databases: one for fragment metadata and the other for raw data
/* Note to self - metadata is paired with data, but kept separate to make queries easier.
   For example, if a fragment is a 10mb image, fetching all fragments with their data would suck. 
   Every time we create a new fragment, we store metadata and data separately, but
   can reference easily reference each because they share the same primary/secondary keys. */

// commented out MemoryDB and replaced with Dynamo
// const data = new MemoryDB();
// const metadata = new MemoryDB();

// Write a fragment's metadata to memory db. Returns a Promise<void>
// In aws/index.js (writeFragment function)
function writeFragment(fragment) {
  console.log(`📝 WRITING FRAGMENT TO DYNAMODB:`, JSON.stringify(fragment, null, 2));
  
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Item: fragment,
  };

  console.log('📝 WRITE PARAMS:', JSON.stringify(params, null, 2));
  
  const command = new PutCommand(params);

  try {
    console.log('⏳ SENDING WRITE COMMAND TO DYNAMODB');
    const result = ddbDocClient.send(command);
    console.log('✅ WRITE COMMAND SENT SUCCESSFULLY');
    return result;
  } catch (err) {
    console.error('❌ ERROR WRITING TO DYNAMODB:', err);
    logger.warn({ err, params, fragment }, 'error writing fragment to DynamoDB');
    throw err;
  }
}
// Read a fragment's metadata from memory db. Returns a Promise<Object>
// Reads a fragment from DynamoDB. Returns a Promise<fragment|undefined>
// In aws/index.js (readFragment function)
async function readFragment(ownerId, id) {
  console.log(`🔍 TRYING TO READ FRAGMENT: ${ownerId}/${id}`);
  console.log(`📊 TABLE NAME: ${process.env.AWS_DYNAMODB_TABLE_NAME}`);
  
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };
  
  console.log('📝 READ PARAMS:', JSON.stringify(params, null, 2));
  
  const command = new GetCommand(params);
  
  try {
    console.log('⏳ SENDING READ COMMAND TO DYNAMODB');
    const data = await ddbDocClient.send(command);
    console.log('📥 RESULT FROM DYNAMODB:', JSON.stringify(data, null, 2));
    // Log if the item is missing
    if (!data?.Item) {
      console.log('⚠️ NO ITEM FOUND IN DYNAMODB RESPONSE');
    }
    return data?.Item;
  } catch (err) {
    console.error('❌ ERROR READING FROM DYNAMODB:', err);
    logger.warn({ err, params }, 'error reading fragment from DynamoDB');
    throw err;
  }
}

// Writes a fragment's data to an S3 Object in a Bucket
// https://github.com/awsdocs/aws-sdk-for-javascript-v3/blob/main/doc_source/s3-example-creating-buckets.md#upload-an-existing-object-to-an-amazon-s3-bucket
async function writeFragmentData(ownerId, id, data) {
  // Create the PUT API params from our details
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
    Body: data,
  };

  // Create a PUT Object command to send to S3
  const command = new PutObjectCommand(params);

  try {
    // Use our client to send the command
    await s3Client.send(command);
  } catch (err) {
    // If anything goes wrong, log enough info that we can debug
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }
}

// Convert a stream of data into a Buffer, by collecting
// chunks of data until finished, then assembling them together.
// We wrap the whole thing in a Promise so it's easier to consume.
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    // As the data streams in, we'll collect it into an array.
    const chunks = [];

    // Streams have events that we can listen for and run
    // code.  We need to know when new `data` is available,
    // if there's an `error`, and when we're at the `end`
    // of the stream.

    // When there's data, add the chunk to our chunks list
    stream.on('data', (chunk) => chunks.push(chunk));
    // When there's an error, reject the Promise
    stream.on('error', reject);
    // When the stream is done, resolve with a new Buffer of our chunks
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

// Reads a fragment's data from S3 and returns (Promise<Buffer>)
// https://github.com/awsdocs/aws-sdk-for-javascript-v3/blob/main/doc_source/s3-example-creating-buckets.md#getting-a-file-from-an-amazon-s3-bucket
async function readFragmentData(ownerId, id) {
  // Create the PUT API params from our details
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
  };

  // Create a GET Object command to send to S3
  const command = new GetObjectCommand(params);

  try {
    // Get the object from the Amazon S3 bucket. It is returned as a ReadableStream.
    const data = await s3Client.send(command);
    // Convert the ReadableStream to a Buffer
    return streamToBuffer(data.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

// Get a list of fragments, either ids-only, or full Objects, for the given user.
// Returns a Promise<Array<Fragment>|Array<string>|undefined>
async function listFragments(ownerId, expand = false) {
  // Configure our QUERY params, with the name of the table and the query expression
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    // Specify that we want to get all items where the ownerId is equal to the
    // `:ownerId` that we'll define below in the ExpressionAttributeValues.
    KeyConditionExpression: 'ownerId = :ownerId',
    // Use the `ownerId` value to do the query
    ExpressionAttributeValues: {
      ':ownerId': ownerId,
    },
  };

  // Limit to only `id` if we aren't supposed to expand. Without doing this
  // we'll get back every attribute.  The projection expression defines a list
  // of attributes to return, see:
  // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ProjectionExpressions.html
  if (!expand) {
    params.ProjectionExpression = 'id';
  }

  // Create a QUERY command to send to DynamoDB
  const command = new QueryCommand(params);

  try {
    // Wait for the data to come back from AWS
    const data = await ddbDocClient.send(command);

    // If we haven't expanded to include all attributes, remap this array from
    // [ {"id":"b9e7a264-630f-436d-a785-27f30233faea"}, {"id":"dad25b07-8cd6-498b-9aaf-46d358ea97fe"} ,... ] to
    // [ "b9e7a264-630f-436d-a785-27f30233faea", "dad25b07-8cd6-498b-9aaf-46d358ea97fe", ... ]
    return !expand ? data?.Items.map((item) => item.id) : data?.Items
  } catch (err) {
    logger.error({ err, params }, 'error getting all fragments for user from DynamoDB');
    throw err;
  }
}

// Delete a fragment's data from S3 and metadata from DynamoDB
async function deleteFragment(ownerId, id) {
  logger.debug({ ownerId, id }, 'Attempting to delete fragment');

  try {
    // 1. Delete metadata from DynamoDB
    const deleteParams = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      Key: { ownerId, id }
    };
    
    const deleteCommand = new DeleteCommand(deleteParams);
    await ddbDocClient.send(deleteCommand);
    logger.info({ ownerId, id }, 'Fragment metadata deleted successfully from DynamoDB');
    
    // 2. Delete data from S3
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${ownerId}/${id}`
    };
    
    const deleteObjectCommand = new DeleteObjectCommand(s3Params);
    await s3Client.send(deleteObjectCommand);
    logger.info({ ownerId, id }, 'Fragment data deleted successfully from S3');
    
  } catch (err) {
    logger.error({ err, ownerId, id }, 'Error deleting fragment');
    throw new Error('unable to delete fragment');
  }
}

module.exports.listFragments = listFragments;
module.exports.writeFragment = writeFragment;
module.exports.readFragment = readFragment;
module.exports.writeFragmentData = writeFragmentData;
module.exports.readFragmentData = readFragmentData;
module.exports.deleteFragment = deleteFragment;
