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

  test('should throw an error if both AWS Cognito and HTTP Basic Auth are configured in non-test environment', () => {
    // Set conflicting auth configurations
    process.env.AWS_COGNITO_POOL_ID = 'test-pool';
    process.env.AWS_COGNITO_CLIENT_ID = 'test-client';
    process.env.HTPASSWD_FILE = 'test-htpasswd';
    
    // Force the check even in test environment 
    process.env.FORCE_AUTH_CHECK = 'true';
    // Don't actually load cognito
    process.env.MOCK_COGNITO = 'true';
  
    expect(() => require('../../src/auth')).toThrow(
      'env contains configuration for both AWS Cognito and HTTP Basic Auth. Only one is allowed.'
    );
  });

  test('should allow both auth configs in test environment but prefer one', () => {
    // Set conflicting auth configurations
    process.env.AWS_COGNITO_POOL_ID = 'test-pool';
    process.env.AWS_COGNITO_CLIENT_ID = 'test-client';
    process.env.HTPASSWD_FILE = 'test-htpasswd';
    
    // Set as a test environment
    process.env.NODE_ENV = 'test';
    process.env.TEST_TYPE = 'unit';

    // Should not throw in test environment
    const authModule = require('../../src/auth');
    expect(authModule).toBeDefined();
  });

  test('should require basic-auth if only HTPASSWD_FILE is set and not in production', () => {
    process.env.HTPASSWD_FILE = 'test-htpasswd';
    process.env.NODE_ENV = 'development'; // NOT production
    // Make sure AWS Cognito vars are NOT set for this test
    delete process.env.AWS_COGNITO_POOL_ID;
    delete process.env.AWS_COGNITO_CLIENT_ID;
    
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
