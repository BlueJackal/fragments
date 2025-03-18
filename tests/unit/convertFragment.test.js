// tests/unit/convertFragment.test.js

const {
  getContentTypeFromExtension,
  isSupportedConversion,
  convertFragment,
} = require('../../src/utils/convertFragment');

describe('Fragment Conversion Utilities', () => {
  describe('getContentTypeFromExtension', () => {
    test('should return the correct content type for known extensions', () => {
      expect(getContentTypeFromExtension('.html')).toBe('text/html');
      expect(getContentTypeFromExtension('.txt')).toBe('text/plain');
      expect(getContentTypeFromExtension('.md')).toBe('text/markdown');
      expect(getContentTypeFromExtension('.json')).toBe('application/json');
      expect(getContentTypeFromExtension('.png')).toBe('image/png');
    });

    test('should handle case-insensitive extensions', () => {
      expect(getContentTypeFromExtension('.HTML')).toBe('text/html');
      expect(getContentTypeFromExtension('.Json')).toBe('application/json');
    });

    test('should return null for unknown extensions', () => {
      expect(getContentTypeFromExtension('.unknown')).toBeNull();
      expect(getContentTypeFromExtension('.xyz')).toBeNull();
    });
  });

  describe('isSupportedConversion', () => {
    test('should return true for same source and target type', () => {
      expect(isSupportedConversion('text/plain', 'text/plain')).toBe(true);
      expect(isSupportedConversion('image/png', 'image/png')).toBe(true);
    });

    test('should return true for supported conversions', () => {
      expect(isSupportedConversion('text/markdown', 'text/html')).toBe(true);
      expect(isSupportedConversion('text/markdown', 'text/plain')).toBe(true);
      expect(isSupportedConversion('text/html', 'text/plain')).toBe(true);
      expect(isSupportedConversion('text/csv', 'application/json')).toBe(true);
    });

    test('should return false for unsupported conversions', () => {
      expect(isSupportedConversion('text/plain', 'image/png')).toBe(false);
      expect(isSupportedConversion('image/png', 'text/html')).toBe(false);
      expect(isSupportedConversion('application/json', 'text/html')).toBe(false);
    });

    test('should handle any text/* to text/plain', () => {
      expect(isSupportedConversion('text/custom', 'text/plain')).toBe(true);
      expect(isSupportedConversion('text/whatever', 'text/plain')).toBe(true);
    });
  });

  describe('convertFragment', () => {
    test('should return original data if source and target types are the same', () => {
      const data = Buffer.from('test data');
      expect(convertFragment(data, 'text/plain', 'text/plain')).toBe(data);
    });

    test('should convert markdown to HTML', () => {
      const markdown = '# Heading\n\nParagraph with **bold** text.';
      const converted = convertFragment(markdown, 'text/markdown', 'text/html');

      // Check that it contains HTML tags
      const html = converted.toString();
      expect(html).toContain('<h1>');
      expect(html).toContain('<strong>');
      expect(html).toContain('Heading');
      expect(html).toContain('Paragraph with');
      expect(html).toContain('bold');
    });

    test('should convert markdown to plain text', () => {
      const markdown = '# Heading\n\nParagraph with **bold** text.';
      const result = convertFragment(markdown, 'text/markdown', 'text/plain');
      expect(result.toString()).toBe(markdown);
    });

    test('should convert HTML to plain text', () => {
      const html = '<h1>Title</h1><p>Paragraph <strong>content</strong></p>';
      const result = convertFragment(html, 'text/html', 'text/plain');
      // HTML tags should be stripped
      expect(result.toString()).not.toContain('<');
      expect(result.toString()).not.toContain('>');
      expect(result.toString()).toContain('Title');
      expect(result.toString()).toContain('Paragraph');
      expect(result.toString()).toContain('content');
    });

    test('should convert CSV to JSON', () => {
      const csv = 'name,age,city\nJohn,30,New York\nJane,25,Boston';
      const result = convertFragment(csv, 'text/csv', 'application/json');
      const json = JSON.parse(result.toString());

      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBe(2);
      expect(json[0].name).toBe('John');
      expect(json[0].age).toBe('30');
      expect(json[0].city).toBe('New York');
      expect(json[1].name).toBe('Jane');
    });

    test('should throw error for unsupported conversions', () => {
      expect(() => {
        convertFragment('test', 'text/plain', 'image/png');
      }).toThrow('Conversion from text/plain to image/png is not supported');
    });
  });
});
