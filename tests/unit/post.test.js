// tests/unit/post.test.js

const request = require('supertest');
const express = require('express');
const router = require('../../src/routes/api/post'); // <--- Correct path now
const { Fragment } = require('../../src/model/fragment');

const app = express();

app.use(express.raw({ type: '*/*' }));

app.use((req, _res, next) => {
  req.user = 'test-user';
  next();
});

// Mount our router. Because src/routes/api/post.js does:
//   router.post('/fragments', async (req, res) => { ... })
//
// we can just use the router directly:
app.use(router);

describe('POST /fragments', () => {
  test('should return 400 if Content-Type format is invalid', async () => {
    const res = await request(app)
      .post('/fragments')
      .set('Content-Type', '???=invalid')
      .send(Buffer.from('Test Buffer'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid Content-Type format');
  });

  test('should return 415 if Content-Type is unsupported', async () => {
    const res = await request(app)
      .post('/fragments')
      .set('Content-Type', 'image/png')
      .send(Buffer.from('PNG data'));

    expect(res.status).toBe(415);
    expect(res.body).toHaveProperty('error', 'Unsupported Content-Type');
  });

  test('should create a fragment (201) with supported Content-Type and body as Buffer', async () => {
    const bufferData = Buffer.from('Hello, this is text content');
    const res = await request(app)
      .post('/fragments')
      .set('Content-Type', 'text/plain')
      .send(bufferData);

    expect(res.status).toBe(201);
    expect(res.headers).toHaveProperty('location');
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('ownerId', 'test-user');
    expect(res.body).toHaveProperty('type', 'text/plain');
    expect(res.body).toHaveProperty('size', bufferData.length);
  });

  test('should return 500 if an unexpected error occurs (mock)', async () => {
    // Temporarily mock Fragment.save() or setData() to force an error
    const originalSave = Fragment.prototype.save;
    Fragment.prototype.save = jest.fn().mockImplementation(() => {
      throw new Error('Mocked save() failure');
    });

    const bufferData = Buffer.from('Forcing a failure');
    const res = await request(app)
      .post('/fragments')
      .set('Content-Type', 'text/plain')
      .send(bufferData);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal Server Error');

    // Restore original implementation
    Fragment.prototype.save = originalSave;
  });
});
