// src/tests/integration/fragments.test.js

const request = require('supertest');
const app = require('../../src/app');
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
   * TESTS FOR SUPPORTED CONTENT TYPES: POST /fragments
   */
  describe('POST /fragments with different content types', () => {
    test('creates a text/plain fragment successfully', async () => {
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
      expect(res.body.size).toBe(data.length);
    });

    test('creates a text/markdown fragment successfully', async () => {
      const data = '# Markdown Heading\n\nThis is a paragraph.';
      const res = await request(app)
        .post('/v1/fragments')
        .set('Content-Type', 'text/markdown')
        .auth(validUser.email, validUser.password)
        .send(data);

      expect(res.statusCode).toBe(201);
      expect(res.headers.location).toBeDefined();
      expect(res.body.ownerId).toBe(hashedUserId);
      expect(res.body.type).toBe('text/markdown');
      expect(res.body.size).toBe(data.length);
    });

    test('creates a text/html fragment successfully', async () => {
      const data = '<h1>HTML Heading</h1><p>This is a paragraph.</p>';
      const res = await request(app)
        .post('/v1/fragments')
        .set('Content-Type', 'text/html')
        .auth(validUser.email, validUser.password)
        .send(data);

      expect(res.statusCode).toBe(201);
      expect(res.headers.location).toBeDefined();
      expect(res.body.ownerId).toBe(hashedUserId);
      expect(res.body.type).toBe('text/html');
      expect(res.body.size).toBe(data.length);
    });

    test('creates a text/csv fragment successfully', async () => {
      const data = 'id,name,email\n1,John,john@example.com\n2,Jane,jane@example.com';
      const res = await request(app)
        .post('/v1/fragments')
        .set('Content-Type', 'text/csv')
        .auth(validUser.email, validUser.password)
        .send(data);

      expect(res.statusCode).toBe(201);
      expect(res.headers.location).toBeDefined();
      expect(res.body.ownerId).toBe(hashedUserId);
      expect(res.body.type).toBe('text/csv');
      expect(res.body.size).toBe(data.length);
    });

    test('creates an application/json fragment successfully', async () => {
      const data = JSON.stringify({ name: 'John', email: 'john@example.com', age: 30 });
      const res = await request(app)
        .post('/v1/fragments')
        .set('Content-Type', 'application/json')
        .auth(validUser.email, validUser.password)
        .send(data);

      expect(res.statusCode).toBe(201);
      expect(res.headers.location).toBeDefined();
      expect(res.body.ownerId).toBe(hashedUserId);
      expect(res.body.type).toBe('application/json');
      expect(res.body.size).toBe(data.length);
    });

    test('rejects an unsupported content type', async () => {
      const data = 'Some data';
      const res = await request(app)
        .post('/v1/fragments')
        .set('Content-Type', 'image/png')
        .auth(validUser.email, validUser.password)
        .send(data);

      expect(res.statusCode).toBe(415);
    });
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
   * TEST: GET /fragments?expand=1 - Should return full fragment metadata
   */
  test('GET /fragments?expand=1 returns full fragment metadata', async () => {
    const data = 'Test Fragment';
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .auth(validUser.email, validUser.password)
      .send(data);

    const fragmentId = postRes.body.id;

    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth(validUser.email, validUser.password);

    expect(res.statusCode).toBe(200);
    expect(res.body.fragments.length).toBe(1);
    expect(res.body.fragments[0].id).toBe(fragmentId);
    expect(res.body.fragments[0].type).toBe('text/plain');
    expect(res.body.fragments[0].size).toBe(data.length);
  });

  /**
   * TESTS FOR RETRIEVING FRAGMENTS: GET /fragments/:id
   */
  describe('GET /fragments/:id with different content types', () => {
    test('retrieves a text/plain fragment correctly', async () => {
      const data = 'Hello Plain Text!';
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
      expect(getRes.headers['content-type']).toContain('text/plain');
    });

    test('retrieves a text/markdown fragment correctly', async () => {
      const data = '# Markdown Heading\n\nThis is a paragraph.';
      const postRes = await request(app)
        .post('/v1/fragments')
        .set('Content-Type', 'text/markdown')
        .auth(validUser.email, validUser.password)
        .send(data);

      const fragmentId = postRes.body.id;

      const getRes = await request(app)
        .get(`/v1/fragments/${fragmentId}`)
        .auth(validUser.email, validUser.password);

      expect(getRes.statusCode).toBe(200);
      expect(getRes.text).toBe(data);
      expect(getRes.headers['content-type']).toContain('text/markdown');
    });

    test('retrieves a text/html fragment correctly', async () => {
      const data = '<h1>HTML Heading</h1><p>This is a paragraph.</p>';
      const postRes = await request(app)
        .post('/v1/fragments')
        .set('Content-Type', 'text/html')
        .auth(validUser.email, validUser.password)
        .send(data);

      const fragmentId = postRes.body.id;

      const getRes = await request(app)
        .get(`/v1/fragments/${fragmentId}`)
        .auth(validUser.email, validUser.password);

      expect(getRes.statusCode).toBe(200);
      expect(getRes.text).toBe(data);
      expect(getRes.headers['content-type']).toContain('text/html');
    });

    test('retrieves a text/csv fragment correctly', async () => {
      const data = 'id,name,email\n1,John,john@example.com\n2,Jane,jane@example.com';
      const postRes = await request(app)
        .post('/v1/fragments')
        .set('Content-Type', 'text/csv')
        .auth(validUser.email, validUser.password)
        .send(data);

      const fragmentId = postRes.body.id;

      const getRes = await request(app)
        .get(`/v1/fragments/${fragmentId}`)
        .auth(validUser.email, validUser.password);

      expect(getRes.statusCode).toBe(200);
      expect(getRes.text).toBe(data);
      expect(getRes.headers['content-type']).toContain('text/csv');
    });

    test('retrieves an application/json fragment correctly', async () => {
      const data = JSON.stringify({ name: 'John', email: 'john@example.com', age: 30 });
      const postRes = await request(app)
        .post('/v1/fragments')
        .set('Content-Type', 'application/json')
        .auth(validUser.email, validUser.password)
        .send(data);

      const fragmentId = postRes.body.id;

      const getRes = await request(app)
        .get(`/v1/fragments/${fragmentId}`)
        .auth(validUser.email, validUser.password);

      expect(getRes.statusCode).toBe(200);
      expect(getRes.text).toBe(data);
      expect(getRes.headers['content-type']).toContain('application/json');
    });

    test('returns 404 for non-existent fragment', async () => {
      const res = await request(app)
        .get('/v1/fragments/nonexistent-id')
        .auth(validUser.email, validUser.password);

      expect(res.statusCode).toBe(404);
      // Update this line to match the expected error format
      expect(res.body.error.message).toBe('Fragment not found');
    });
  });

  /**
   * TEST: GET /fragments/:id/info - Should return fragment metadata
   */
  test('GET /fragments/:id/info returns correct fragment metadata', async () => {
    const data = 'Test Fragment for Info';
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .auth(validUser.email, validUser.password)
      .send(data);

    const fragmentId = postRes.body.id;

    const infoRes = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth(validUser.email, validUser.password);

    expect(infoRes.statusCode).toBe(200);
    expect(infoRes.body.status).toBe('ok');
    expect(infoRes.body.fragment.id).toBe(fragmentId);
    expect(infoRes.body.fragment.type).toBe('text/plain');
    expect(infoRes.body.fragment.size).toBe(data.length);
    expect(infoRes.body.fragment.ownerId).toBe(hashedUserId);
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
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Error retrieving fragments');
    expect(res.body.error.code).toBe(500);

    jest.resetModules();
  });
});
