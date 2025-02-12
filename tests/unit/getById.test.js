const request = require('supertest');
const app = require('../../src/app');
const hash = require('../../src/hash');
const { Fragment } = require('../../src/model/fragment'); // ✅ Import Fragment directly

describe('GET /fragments/:id API (Basic Auth)', () => {
  const validUser = { email: 'user1@email.com', password: 'password1' };
  const hashedUserId = hash(validUser.email);
  let fragmentId;

  beforeEach(async () => {
    const { deleteFragment, listFragments } = require('../../src/model/data');

    const fragments = await listFragments(hashedUserId, true);
    if (fragments.length > 0) {
      await Promise.all(fragments.map((frag) => deleteFragment(hashedUserId, frag.id)));
    }

    // ✅ Create a valid text fragment for tests
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .auth(validUser.email, validUser.password)
      .send('Test Fragment Data');

    fragmentId = postRes.body.id;
  });

  test('GET /fragments/:id returns 404 if fragment does not exist', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id')
      .auth(validUser.email, validUser.password);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Fragment not found');
  });

  test('GET /fragments/:id returns 404 if fragment retrieval fails and throws an error', async () => {
    // ✅ Spy on Fragment.byId and force it to throw an error
    jest.spyOn(Fragment, 'byId').mockRejectedValue(new Error('Fragment not found'));

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth(validUser.email, validUser.password);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Fragment not found');

    // ✅ Restore original behavior after test
    jest.restoreAllMocks();
  });
});
