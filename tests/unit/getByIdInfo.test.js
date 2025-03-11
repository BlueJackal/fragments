// tests/integration/getByIdInfo.test.js

const request = require('supertest');
const app = require('../../src/app');
const hash = require('../../src/hash');
const { Fragment } = require('../../src/model/fragment');

describe('GET /fragments/:id/info', () => {
  const validUser = { email: 'user1@email.com', password: 'password1' };
  const hashedUserId = hash(validUser.email);
  const invalidUser = { email: 'invalid@email.com', password: 'wrongpassword' };
  let fragmentId;

  beforeEach(async () => {
    // Clean up existing fragments
    const { deleteFragment, listFragments } = require('../../src/model/data');

    const fragments = await listFragments(hashedUserId, true);
    if (fragments && fragments.length > 0) {
      await Promise.all(fragments.map((frag) => deleteFragment(hashedUserId, frag.id)));
    }

    // Create a test fragment
    const fragment = new Fragment({
      ownerId: hashedUserId,
      type: 'text/plain',
    });
    await fragment.save();
    await fragment.setData(Buffer.from('Test fragment data'));
    fragmentId = fragment.id;
  });

  /**
   * TEST: Successful retrieval of fragment metadata
   */
  test('GET /fragments/:id/info returns metadata for a valid fragment', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth(validUser.email, validUser.password);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
    expect(res.body.fragment.id).toBe(fragmentId);
    expect(res.body.fragment.ownerId).toBe(hashedUserId);
    expect(res.body.fragment.type).toBe('text/plain');
    expect(res.body.fragment.size).toBe(18); // 'Test fragment data' length
  });

  /**
   * TEST: Fragment not found
   */
  test('GET /fragments/:id/info returns 404 if fragment does not exist', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id/info')
      .auth(validUser.email, validUser.password);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');
  });

  /**
   * TEST: Unauthorized access
   */
  test('GET /fragments/:id/info returns 401 for unauthorized users', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth(invalidUser.email, invalidUser.password);

    expect(res.statusCode).toBe(401);
  });

  /**
   * TEST: Server error handling
   */
  test('GET /fragments/:id/info returns 500 if there is a database error', async () => {
    // Reset modules to be able to mock them
    jest.resetModules();

    // Mock the Fragment module to throw an error when byId is called
    jest.doMock('../../src/model/fragment', () => ({
      Fragment: {
        byId: jest.fn().mockRejectedValue(new Error('Database error')),
      },
    }));

    // Re-require app with our mocked Fragment module
    const mockedApp = require('../../src/app');

    const res = await request(mockedApp)
      .get('/v1/fragments/some-id/info')
      .auth(validUser.email, validUser.password);

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(500);
    expect(res.body.error.message).toBe('Error retrieving fragment metadata');

    // Reset modules back to their original state
    jest.resetModules();
  });
});
