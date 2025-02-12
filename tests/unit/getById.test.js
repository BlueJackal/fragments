const request = require('supertest');
const app = require('../../src/app');
const hash = require('../../src/hash');

describe('GET /fragments/:id API (Basic Auth)', () => {
  const validUser = { email: 'user1@email.com', password: 'password1' };
  const anotherUser = { email: 'user2@email.com', password: 'password2' };
  const hashedUserId = hash(validUser.email);
  const hashedAnotherUserId = hash(anotherUser.email);
  let fragmentId, imageFragmentId;

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

    // ✅ Create an image fragment (for unsupported type test)
    const imgRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'image/png')
      .auth(validUser.email, validUser.password)
      .send(Buffer.from([0x89, 0x50, 0x4e, 0x47])); // PNG header bytes

    imageFragmentId = imgRes.body.id;
  });

  test('GET /fragments/:id returns 404 if fragment does not exist', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id')
      .auth(validUser.email, validUser.password);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Fragment not found');
  });
});
