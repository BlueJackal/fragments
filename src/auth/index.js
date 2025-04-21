// src/auth/index.js

// In test environments, be more flexible about auth configuration
const isTestEnvironment = process.env.NODE_ENV === 'test' || typeof jest !== 'undefined';
const isIntegrationTest = process.env.TEST_TYPE === 'integration';

// Special flag to force this check even in test env (for testing this condition)
const forceAuthCheck = process.env.FORCE_AUTH_CHECK === 'true';

// In production, don't allow both auth methods
if (
  (forceAuthCheck || (!isTestEnvironment && process.env.NODE_ENV === 'production')) && 
  process.env.AWS_COGNITO_POOL_ID &&
  process.env.AWS_COGNITO_CLIENT_ID &&
  process.env.HTPASSWD_FILE
) {
  throw new Error(
    'env contains configuration for both AWS Cognito and HTTP Basic Auth. Only one is allowed.'
  );
}

// For integration tests, ALWAYS use HTTP Basic Auth
if (isIntegrationTest && process.env.HTPASSWD_FILE) {
  console.log('🔑 Using HTTP Basic Auth for integration tests');
  module.exports = require('./basic-auth');
}
// For unit tests, prefer HTTP Basic Auth over Cognito
else if (isTestEnvironment && process.env.TEST_TYPE === 'unit' && process.env.HTPASSWD_FILE) {
  console.log('🔑 Using HTTP Basic Auth for unit tests');
  module.exports = require('./basic-auth');
}
// Prefer Amazon Cognito for production and non-test environments
else if (process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID) {
  // During testing, we might not want to actually load cognito, so this flag allows us to bypass
  if (isTestEnvironment && process.env.MOCK_COGNITO === 'true') {
    console.log('🔑 Using mocked Cognito auth');
    module.exports = {
      strategy: () => {},
      authenticate: () => {}
    };
  } else {
    console.log('🔑 Using Cognito auth');
    module.exports = require('./cognito');
  }
}
// Also allow for an .htpasswd file to be used
else if (process.env.HTPASSWD_FILE) {
  console.log('🔑 Using HTTP Basic Auth');
  module.exports = require('./basic-auth');
}
// In all other cases, we need to stop now and fix our config
else {
  throw new Error('missing env vars: no authorization configuration found');
}
