// src/tests/integration/fragments.test.js

// Made to help debugging because get and post were driving me INSANE

const request = require('supertest');
const app = require('../../src/app');
//const { writeFragment, readFragment, readFragmentData } = require('../../src/model/data');
const hash = require('../../src/hash');

describe('Fragments API (Basic Auth)', () => {
  const validUser = { email: 'user1@email.com', password: 'password1' };
  const hashedUserId = hash(validUser.email);
  const invalidUser = { email: 'invalid@email.com', password: 'wrongpassword' };

  beforeEach(async () => {
    const { deleteFragment, listFragments } = require('../../src/model/data');

    const fragments = await listFragments(hashedUserId, true); // true = get full metadata

    if (fragments.length > 0) {
      await Promise.all(fragments.map((frag) => deleteFragment(hashedUserId, frag.id)));
    }
  });

  /**
   * TEST: GET /fragments - Should return an empty array when no fragments exist
   */
  test('GET /fragments returns an empty array for a new user', async () => {
    const res = await request(app).get('/v1/fragments').auth(validUser.email, validUser.password);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragments).toEqual([]);
  });

  /**
   * TEST: POST /fragments - Should create a fragment
   */
  test('POST /fragments creates a fragment successfully', async () => {
    const data = 'Hello, World!';
    const res = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .auth(validUser.email, validUser.password)
      .send(data);

    expect(res.statusCode).toBe(201);
    expect(res.headers.location).toBeDefined();
    expect(res.body.ownerId).toBe(hashedUserId);
    expect(res.body.type).toBe('text/plain');
  });

  /**
   * TEST: GET /fragments - Should return list of fragment IDs after creating one
   */
  test('GET /fragments returns list of created fragment IDs', async () => {
    const data = 'Test Fragment';
    await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .auth(validUser.email, validUser.password)
      .send(data);

    const res = await request(app).get('/v1/fragments').auth(validUser.email, validUser.password);

    expect(res.statusCode).toBe(200);
    expect(res.body.fragments.length).toBe(1);
  });

  /**
   * TEST: GET /fragments/:id - Should return created fragment data
   */
  test('GET /fragments/:id returns the correct fragment data', async () => {
    const data = 'Hello Fragment!';
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .auth(validUser.email, validUser.password)
      .send(data);

    const fragmentId = postRes.body.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth(validUser.email, validUser.password);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe(data);
  });

  /**
   * TEST: GET /fragments/:id - Should return 404 for non-existent fragment
   */
  test('GET /fragments/:id returns 404 if fragment does not exist', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id')
      .auth(validUser.email, validUser.password);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Fragment not found');
  });

  /**
   * TEST: Unauthorized requests should fail
   */
  test('GET /fragments should return 401 for unauthorized users', async () => {
    const res = await request(app)
      .get('/v1/fragments')
      .auth(invalidUser.email, invalidUser.password);

    expect(res.statusCode).toBe(401);
  });

  test('POST /fragments should return 401 for unauthorized users', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .auth(invalidUser.email, invalidUser.password)
      .send('Unauthorized User Data');

    expect(res.statusCode).toBe(401);
  });

  test('GET /fragments/:id should return 401 for unauthorized users', async () => {
    const res = await request(app)
      .get('/v1/fragments/some-id')
      .auth(invalidUser.email, invalidUser.password);

    expect(res.statusCode).toBe(401);
  });
  test('GET /fragments returns 500 if there is a database error', async () => {
    jest.resetModules();
    jest.doMock('../../src/model/data', () => ({
      listFragments: undefined,
    }));

    const app = require('../../src/app');

    const res = await request(app).get('/v1/fragments').auth(validUser.email, validUser.password);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Error retrieving fragments');

    jest.resetModules();
  });
});
