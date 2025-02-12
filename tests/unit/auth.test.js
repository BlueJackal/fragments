// tests/unit/auth.test.js

describe('Auth Module', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env }; // Backup original environment variables
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original environment variables after each test
    jest.resetModules(); // Clear module cache to reload fresh env vars
  });

  test('should throw an error if both AWS Cognito and HTTP Basic Auth are configured', () => {
    process.env.AWS_COGNITO_POOL_ID = 'test-pool';
    process.env.AWS_COGNITO_CLIENT_ID = 'test-client';
    process.env.HTPASSWD_FILE = 'test-htpasswd';

    expect(() => require('../../src/auth')).toThrow(
      'env contains configuration for both AWS Cognito and HTTP Basic Auth. Only one is allowed.'
    );
  });

  test('should require basic-auth if only HTPASSWD_FILE is set and not in production', () => {
    process.env.HTPASSWD_FILE = 'test-htpasswd';
    process.env.NODE_ENV = 'development'; // NOT production

    const authModule = require('../../src/auth');
    expect(authModule).toBeDefined();
  });

  test('should throw an error if no authorization configuration is found', () => {
    delete process.env.AWS_COGNITO_POOL_ID;
    delete process.env.AWS_COGNITO_CLIENT_ID;
    delete process.env.HTPASSWD_FILE;

    expect(() => require('../../src/auth')).toThrow(
      'missing env vars: no authorization configuration found'
    );
  });
});
