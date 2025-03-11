// src/tests/unit/isTextFragment.test.js

const isTextFragment = require('../../src/utils/isTextFragment');

// Mock the logger
jest.mock('../../src/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('isTextFragment utility', () => {
  test('returns true for text/plain fragment', () => {
    const fragment = { mimeType: 'text/plain' };
    expect(isTextFragment(fragment)).toBe(true);
  });

  test('returns true for text/markdown fragment', () => {
    const fragment = { mimeType: 'text/markdown' };
    expect(isTextFragment(fragment)).toBe(true);
  });

  test('returns true for text/html fragment', () => {
    const fragment = { mimeType: 'text/html' };
    expect(isTextFragment(fragment)).toBe(true);
  });

  test('returns true for text/csv fragment', () => {
    const fragment = { mimeType: 'text/csv' };
    expect(isTextFragment(fragment)).toBe(true);
  });

  test('returns true for application/json fragment', () => {
    const fragment = { mimeType: 'application/json' };
    expect(isTextFragment(fragment)).toBe(true);
  });

  test('returns false for image/png fragment', () => {
    const fragment = { mimeType: 'image/png' };
    expect(isTextFragment(fragment)).toBe(false);
  });

  test('returns false for fragment without mimeType', () => {
    const fragment = {};
    expect(isTextFragment(fragment)).toBe(false);
  });

  test('returns false for fragment with non-string mimeType', () => {
    const fragment = { mimeType: 123 };
    expect(isTextFragment(fragment)).toBe(false);
  });

  test('returns false for fragment with null mimeType', () => {
    const fragment = { mimeType: null };
    expect(isTextFragment(fragment)).toBe(false);
  });
});
