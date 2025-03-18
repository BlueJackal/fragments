// tests/unit/delete.test.js

const { Fragment } = require('../../src/model/fragment');
const deleteHandler = require('../../src/routes/api/delete');
const logger = require('../../src/logger');

// Mock dependencies
jest.mock('../../src/model/fragment');
jest.mock('../../src/logger');

describe('DELETE /fragments/:id', () => {
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
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock the Fragment.delete static method
    Fragment.delete = jest.fn().mockResolvedValue();
  });

  test('should return 404 if fragment not found', async () => {
    // Mock Fragment.byId to throw "Fragment not found" error
    Fragment.byId.mockRejectedValue(new Error('Fragment not found'));

    await deleteHandler(req, res);

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
    // Make sure delete wasn't called
    expect(Fragment.delete).not.toHaveBeenCalled();
  });

  test('should delete fragment successfully', async () => {
    // Mock Fragment.byId to return successfully (fragment exists)
    Fragment.byId.mockResolvedValue({
      id: 'test-fragment-id',
      ownerId: 'test-owner-id',
    });

    await deleteHandler(req, res);

    console.log('Response status:', res.status.mock.calls[0][0]);
    console.log('Response body:', res.json.mock.calls[0][0]);

    // Verify Fragment.delete was called with correct params
    expect(Fragment.delete).toHaveBeenCalledWith('test-owner-id', 'test-fragment-id');

    // Verify response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ok',
      })
    );
  });

  test('should handle unexpected errors during fragment check', async () => {
    // Mock Fragment.byId to throw an unexpected error
    const errorMessage = 'Database connection failed';
    Fragment.byId.mockRejectedValue(new Error(errorMessage));

    await deleteHandler(req, res);

    console.log('Response status:', res.status.mock.calls[0][0]);
    console.log('Response body:', res.json.mock.calls[0][0]);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          message: 'Error deleting fragment',
        }),
      })
    );
    expect(logger.error).toHaveBeenCalled();
  });

  test('should handle unexpected errors during deletion', async () => {
    // Mock Fragment.byId to succeed but Fragment.delete to fail
    Fragment.byId.mockResolvedValue({
      id: 'test-fragment-id',
      ownerId: 'test-owner-id',
    });

    // Make delete throw an error
    Fragment.delete.mockRejectedValue(new Error('Deletion failed'));

    await deleteHandler(req, res);

    console.log('Response status:', res.status.mock.calls[0][0]);
    console.log('Response body:', res.json.mock.calls[0][0]);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          message: 'Error deleting fragment',
        }),
      })
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
