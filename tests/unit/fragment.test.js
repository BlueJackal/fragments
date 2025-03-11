// src/tests/unit/fragment.test.js

const { Fragment } = require('../../src/model/fragment');

// Mock the data and logger modules
jest.mock('../../src/model/data', () => ({
  readFragment: jest.fn(),
  writeFragment: jest.fn().mockResolvedValue(),
  readFragmentData: jest.fn(),
  writeFragmentData: jest.fn().mockResolvedValue(),
  listFragments: jest.fn(),
  deleteFragment: jest.fn(),
}));

jest.mock('../../src/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Fragment Class', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('creates a new fragment with defaults', () => {
      const ownerId = 'user1';
      const fragment = new Fragment({ ownerId, type: 'text/plain' });

      expect(fragment.ownerId).toBe(ownerId);
      expect(fragment.type).toBe('text/plain');
      expect(fragment.size).toBe(0);
      expect(fragment.id).toBeDefined();
      expect(fragment.created).toBeDefined();
      expect(fragment.updated).toBeDefined();
    });

    test('throws if no ownerId is provided', () => {
      expect(() => new Fragment({ type: 'text/plain' })).toThrow();
    });

    test('throws if no type is provided', () => {
      expect(() => new Fragment({ ownerId: 'user1' })).toThrow();
    });

    test('throws if invalid size is provided', () => {
      expect(() => new Fragment({ ownerId: 'user1', type: 'text/plain', size: -1 })).toThrow();
    });

    test('throws if unsupported type is provided', () => {
      expect(() => new Fragment({ ownerId: 'user1', type: 'image/png' })).toThrow();
    });
  });

  describe('isSupportedType', () => {
    test('returns true for text/plain', () => {
      expect(Fragment.isSupportedType('text/plain')).toBe(true);
    });

    test('returns true for text/plain with charset', () => {
      expect(Fragment.isSupportedType('text/plain; charset=utf-8')).toBe(true);
    });

    test('returns true for text/markdown', () => {
      expect(Fragment.isSupportedType('text/markdown')).toBe(true);
    });

    test('returns true for text/html', () => {
      expect(Fragment.isSupportedType('text/html')).toBe(true);
    });

    test('returns true for text/csv', () => {
      expect(Fragment.isSupportedType('text/csv')).toBe(true);
    });

    test('returns true for application/json', () => {
      expect(Fragment.isSupportedType('application/json')).toBe(true);
    });

    test('returns false for image/png', () => {
      expect(Fragment.isSupportedType('image/png')).toBe(false);
    });

    test('returns false for invalid content type', () => {
      expect(Fragment.isSupportedType('invalid-content-type')).toBe(false);
    });
  });

  describe('mimeType', () => {
    test('returns mime type without charset', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain; charset=utf-8',
      });
      expect(fragment.mimeType).toBe('text/plain');
    });

    test('returns mime type as is if no charset', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain',
      });
      expect(fragment.mimeType).toBe('text/plain');
    });
  });

  describe('isText', () => {
    test('returns true for text/plain fragment', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain',
      });
      expect(fragment.isText).toBe(true);
    });

    test('returns true for text/html fragment', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/html',
      });
      expect(fragment.isText).toBe(true);
    });

    test('returns true for text/markdown fragment', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/markdown',
      });
      expect(fragment.isText).toBe(true);
    });

    test('returns true for text/csv fragment', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/csv',
      });
      expect(fragment.isText).toBe(true);
    });

    test('returns true for application/json fragment', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'application/json',
      });
      expect(fragment.isText).toBe(true);
    });
  });

  describe('formats', () => {
    test('returns appropriate formats for text/plain', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain',
      });
      const formats = fragment.formats;
      expect(formats).toContain('text/plain');
      expect(formats.length).toBe(1);
    });

    test('returns appropriate formats for text/markdown', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/markdown',
      });
      const formats = fragment.formats;
      expect(formats).toContain('text/markdown');
      expect(formats).toContain('text/html');
      expect(formats).toContain('text/plain');
      expect(formats.length).toBe(3);
    });

    test('returns appropriate formats for text/html', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/html',
      });
      const formats = fragment.formats;
      expect(formats).toContain('text/html');
      expect(formats).toContain('text/plain');
      expect(formats.length).toBe(2);
    });

    test('returns appropriate formats for text/csv', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/csv',
      });
      const formats = fragment.formats;
      expect(formats).toContain('text/csv');
      expect(formats).toContain('text/plain');
      expect(formats).toContain('application/json');
      expect(formats.length).toBe(3);
    });

    test('returns appropriate formats for application/json', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'application/json',
      });
      const formats = fragment.formats;
      expect(formats).toContain('application/json');
      expect(formats).toContain('application/yaml');
      expect(formats).toContain('text/plain');
      expect(formats.length).toBe(3);
    });
  });

  describe('getData and setData', () => {
    const { readFragmentData, writeFragmentData } = require('../../src/model/data');

    test('getData returns fragment data from storage', async () => {
      const fragment = new Fragment({
        id: 'fragment123',
        ownerId: 'user1',
        type: 'text/plain',
      });

      const expectedData = Buffer.from('Hello World');
      readFragmentData.mockResolvedValue(expectedData);

      const data = await fragment.getData();
      expect(data).toEqual(expectedData);
      expect(readFragmentData).toHaveBeenCalledWith('user1', 'fragment123');
    });

    test('setData updates fragment size and saves data', async () => {
      const fragment = new Fragment({
        id: 'fragment123',
        ownerId: 'user1',
        type: 'text/plain',
      });

      const testData = Buffer.from('New test data');
      await fragment.setData(testData);

      expect(fragment.size).toBe(testData.length);
      expect(writeFragmentData).toHaveBeenCalledWith('user1', 'fragment123', testData);
    });

    test('setData throws if data is not a Buffer', async () => {
      const fragment = new Fragment({
        id: 'fragment123',
        ownerId: 'user1',
        type: 'text/plain',
      });

      await expect(fragment.setData('not a buffer')).rejects.toThrow();
    });
  });

  describe('static methods', () => {
    const { readFragment, listFragments, deleteFragment } = require('../../src/model/data');

    test('byUser returns fragments for a user', async () => {
      const ownerId = 'user1';
      const fragmentList = [
        { id: 'fragment1', ownerId, type: 'text/plain', size: 10 },
        { id: 'fragment2', ownerId, type: 'text/markdown', size: 20 },
      ];

      listFragments.mockResolvedValue(fragmentList);

      const fragments = await Fragment.byUser(ownerId, true);

      expect(fragments.length).toBe(2);
      expect(fragments[0]).toBeInstanceOf(Fragment);
      expect(fragments[1]).toBeInstanceOf(Fragment);
      expect(listFragments).toHaveBeenCalledWith(ownerId, true);
    });

    test('byId returns a specific fragment', async () => {
      const ownerId = 'user1';
      const id = 'fragment123';
      const fragmentData = {
        id,
        ownerId,
        type: 'text/plain',
        size: 10,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      readFragment.mockResolvedValue(fragmentData);

      const fragment = await Fragment.byId(ownerId, id);

      expect(fragment).toBeInstanceOf(Fragment);
      expect(fragment.id).toBe(id);
      expect(fragment.ownerId).toBe(ownerId);
      expect(readFragment).toHaveBeenCalledWith(ownerId, id);
    });

    test('delete removes a fragment', async () => {
      const ownerId = 'user1';
      const id = 'fragment123';

      await Fragment.delete(ownerId, id);

      expect(deleteFragment).toHaveBeenCalledWith(ownerId, id);
    });
  });
});
