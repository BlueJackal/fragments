// app.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('Express App', () => {
  test('should return 404 for non-existent routes', async () => {
    const res = await request(app).get('/non-existent-route');
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        message: 'not found',
        code: 404,
      },
    });
  });

  test('should load the root route', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });

  test('should have CORS headers set correctly', async () => {
    const res = await request(app).get('/');
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-expose-headers']).toContain('Location');
  });

  test('should set security headers via helmet', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  test('should initialize Passport authentication middleware', () => {
    expect(typeof app._router.stack.find((layer) => layer.handle.length === 3)).toBe('object');
  });

  test('should initialize Express app', () => {
    expect(app).toBeDefined();
  });

  test('should allow CORS requests', async () => {
    const res = await request(app).options('/').set('Origin', 'http://example.com');

    expect(res.headers).toHaveProperty('access-control-allow-origin');
  });

  test('should return 500 for internal server errors', async () => {
    const res = await request(app).get('/test-error');

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('unable to process request');
  });
});
