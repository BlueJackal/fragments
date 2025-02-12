const isTextFragment = require('../../src/utils/isTextFragment');

describe('isTextFragment', () => {
  test('returns true for text fragments', () => {
    const fragment = { mimeType: 'text/plain' };
    expect(isTextFragment(fragment)).toBe(true);
  });

  test('returns false for non-text fragments', () => {
    const fragment = { mimeType: 'image/png' };
    expect(isTextFragment(fragment)).toBe(false);
  });

  test('returns false for missing mimeType', () => {
    const fragment = {};
    expect(isTextFragment(fragment)).toBe(false);
  });
});
