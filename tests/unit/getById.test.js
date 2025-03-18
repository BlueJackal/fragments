// tests/unit/getById.test.js

const { Fragment } = require('../../src/model/fragment');
const getByIdHandler = require('../../src/routes/api/getById');
const convertUtils = require('../../src/utils/convertFragment');
const isTextFragment = require('../../src/utils/isTextFragment');

// Mock dependencies
jest.mock('../../src/model/fragment');
jest.mock('../../src/logger');
jest.mock('../../src/utils/isTextFragment');
jest.mock('../../src/utils/convertFragment');

describe('GET /fragments/:id', () => {
  // Sample fragment data for testing
  const sampleFragment = {
    id: 'test-fragment-id',
    ownerId: 'test-owner-id',
    type: 'text/markdown',
    size: 10,
    created: '2023-01-01T00:00:00.000Z',
    updated: '2023-01-01T00:00:00.000Z',
    mimeType: 'text/markdown',
    getData: jest.fn(),
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
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };

    // Default mock implementations
    Fragment.byId.mockResolvedValue(sampleFragment);
    sampleFragment.getData.mockResolvedValue(Buffer.from('# Test content'));
    isTextFragment.mockReturnValue(true);

    // Mock convertFragment utils
    convertUtils.getContentTypeFromExtension.mockImplementation((ext) => {
      const map = {
        '.html': 'text/html',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
      };
      return map[ext] || null;
    });

    convertUtils.isSupportedConversion.mockImplementation((source, target) => {
      if (source === 'text/markdown' && (target === 'text/html' || target === 'text/plain')) {
        return true;
      }
      return source === target;
    });

    convertUtils.convertFragment.mockImplementation((data, source, target) => {
      if (source === 'text/markdown' && target === 'text/html') {
        return Buffer.from('<h1>Test content</h1>');
      }
      return data;
    });
  });

  test('should return 404 if fragment not found', async () => {
    // Mock Fragment.byId to throw error
    Fragment.byId.mockRejectedValue(new Error('Fragment not found'));

    await getByIdHandler(req, res);

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

  test('should return 404 if Fragment.byId throws any error with "Fragment not found" message', async () => {
    // Mock Fragment.byId to throw a different error but with the same message
    Fragment.byId.mockRejectedValue(new Error('Fragment not found'));

    await getByIdHandler(req, res);

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

  test('should return 500 if Fragment.byId throws an unexpected error', async () => {
    // Mock Fragment.byId to throw a different error
    Fragment.byId.mockRejectedValue(new Error('Database connection error'));

    await getByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          message: 'Error retrieving fragment',
        }),
      })
    );
  });

  test('should return fragment data in original format when no extension is specified', async () => {
    await getByIdHandler(req, res);

    expect(Fragment.byId).toHaveBeenCalledWith('test-owner-id', 'test-fragment-id');
    expect(sampleFragment.getData).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/markdown');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
  });

  test('should return 415 if fragment type is not supported', async () => {
    // Mock isTextFragment to return false (simulating an unsupported fragment type)
    isTextFragment.mockReturnValue(false);

    await getByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('supported'),
      })
    );
  });

  test('should extract fragment ID without extension when extension is provided', async () => {
    // Request with .html extension
    req.params.id = 'test-fragment-id.html';

    await getByIdHandler(req, res);

    // Should extract fragment ID without extension
    expect(Fragment.byId).toHaveBeenCalledWith('test-owner-id', 'test-fragment-id');
  });

  test('should convert markdown to HTML when .html extension is specified', async () => {
    // Request with .html extension
    req.params.id = 'test-fragment-id.html';

    await getByIdHandler(req, res);

    // Should check if conversion is supported
    expect(convertUtils.isSupportedConversion).toHaveBeenCalledWith('text/markdown', 'text/html');

    // Should attempt conversion
    expect(convertUtils.convertFragment).toHaveBeenCalled();

    // Should set correct content type for converted data
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');

    // Should send converted data
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
  });

  test('should convert markdown to text when .txt extension is specified', async () => {
    // Request with .txt extension
    req.params.id = 'test-fragment-id.txt';

    await getByIdHandler(req, res);

    // Should check if conversion is supported
    expect(convertUtils.isSupportedConversion).toHaveBeenCalledWith('text/markdown', 'text/plain');

    // Should set correct content type for converted data
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
  });

  test('should return 415 for unsupported conversion', async () => {
    // Request with .png extension (not supported from markdown)
    req.params.id = 'test-fragment-id.png';

    // Mock content type lookup for .png
    convertUtils.getContentTypeFromExtension.mockReturnValue('image/png');

    // Mock unsupported conversion
    convertUtils.isSupportedConversion.mockReturnValue(false);

    await getByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          code: 415,
          message: expect.stringContaining('not supported'),
        }),
      })
    );
  });

  test('should return 415 if extension is unknown', async () => {
    // Request with unknown extension
    req.params.id = 'test-fragment-id.unknown';

    // Mock unknown content type
    convertUtils.getContentTypeFromExtension.mockReturnValue(null);

    await getByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(415);
  });

  test('should handle conversion errors', async () => {
    // Request with .html extension
    req.params.id = 'test-fragment-id.html';

    // Make conversion throw an error
    convertUtils.convertFragment.mockImplementation(() => {
      throw new Error('Conversion failed');
    });

    await getByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          message: expect.stringContaining('Error converting fragment'),
        }),
      })
    );
  });

  test('should return 500 if an unexpected error occurs', async () => {
    // Force an unexpected error in the handler
    sampleFragment.getData.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    await getByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          message: 'Error retrieving fragment',
        }),
      })
    );
  });
});
