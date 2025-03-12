// tests/unit/put.test.js

const { Fragment } = require('../../src/model/fragment');
const putHandler = require('../../src/routes/api/put');
const logger = require('../../src/logger');

// Mock dependencies
jest.mock('../../src/model/fragment');
jest.mock('../../src/logger');

describe('PUT /fragments/:id', () => {
  // Sample fragment data for testing
  const sampleFragment = {
    id: 'test-fragment-id',
    ownerId: 'test-owner-id',
    type: 'text/plain',
    size: 10,
    created: '2023-01-01T00:00:00.000Z',
    updated: '2023-01-01T00:00:00.000Z',
    mimeType: 'text/plain',
    save: jest.fn().mockResolvedValue(),
    setData: jest.fn().mockResolvedValue(),
  };

  // Mock request and response objects
  let req;
  let res;

  // Reset mocks and set up req/res before each test
  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: 'test-owner-id',
      params: {
        id: 'test-fragment-id',
      },
      headers: {
        'content-type': 'text/plain',
      },
      body: Buffer.from('Updated content'),
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('should return 404 if fragment not found', async () => {
    // Mock Fragment.byId to throw error
    Fragment.byId.mockRejectedValue(new Error('Fragment not found'));

    await putHandler(req, res);

    // Log for debugging
    console.log('Response status:', res.status.mock.calls[0][0]);
    console.log('Response body:', res.json.mock.calls[0][0]);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          message: 'Fragment not found',
        }),
      })
    );
  });

  test('should return 400 if content type missing', async () => {
    // Set up request with missing content-type
    req.headers = {};

    await putHandler(req, res);

    console.log('Response status:', res.status.mock.calls[0][0]);
    console.log('Response body:', res.json.mock.calls[0][0]);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          message: 'Content-Type header is required',
        }),
      })
    );
  });

  test('should return 400 if content type does not match', async () => {
    // Mock Fragment.byId to return sample fragment
    Fragment.byId.mockResolvedValue(sampleFragment);

    // Set up request with different content-type
    req.headers['content-type'] = 'application/json';

    await putHandler(req, res);

    console.log('Response status:', res.status.mock.calls[0][0]);
    console.log('Response body:', res.json.mock.calls[0][0]);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          message: expect.stringContaining('Cannot update fragment with different Content-Type'),
        }),
      })
    );
  });

  test('should return 400 if request body is not a buffer', async () => {
    // Mock Fragment.byId to return sample fragment
    Fragment.byId.mockResolvedValue(sampleFragment);

    // Set up request with non-buffer body
    req.body = 'Not a buffer';

    await putHandler(req, res);

    console.log('Response status:', res.status.mock.calls[0][0]);
    console.log('Response body:', res.json.mock.calls[0][0]);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          message: 'Invalid request body format',
        }),
      })
    );
  });

  test('should update fragment successfully', async () => {
    // Mock Fragment.byId to return sample fragment
    Fragment.byId.mockResolvedValue(sampleFragment);

    await putHandler(req, res);

    console.log('Fragment.setData calls:', sampleFragment.setData.mock.calls);
    console.log('Response status:', res.status.mock.calls[0][0]);
    console.log('Response body:', res.json.mock.calls[0][0]);

    expect(sampleFragment.setData).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ok',
        fragment: expect.any(Object),
      })
    );
  });

  test('should handle errors properly', async () => {
    // Mock Fragment.byId to throw an unexpected error
    // that is NOT "Fragment not found"
    const errorMessage = 'Unexpected database error';
    Fragment.byId.mockRejectedValue(new Error(errorMessage));

    await putHandler(req, res);

    console.log('Response status:', res.status.mock.calls[0][0]);
    console.log('Response body:', res.json.mock.calls[0][0]);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          message: 'Error updating fragment',
        }),
      })
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
