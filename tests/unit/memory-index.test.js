// tests/unit/memory-index.test.js

const {
  writeFragment,
  readFragment,
  readFragmentData,
  writeFragmentData,
} = require('../../src/model/data/memory/index');

// Writing Metadata
describe('writeFragment()', () => {
  test('Store metadata fragment', async () => {
    const fragment = { ownerId: 'Chris', id: '00000001', type: 'text/plain' };
    const result = await writeFragment(fragment);
    const getFragment = await readFragment('Chris', '00000001');

    expect(result).toBe(undefined);
    expect(getFragment).toEqual(fragment);
  });
  test('Error writing metadata if missing fields', async () => {
    expect(() => writeFragment({})).toThrow();
    expect(() => writeFragment({ ownerId: 'user1' })).toThrow();
    expect(() => writeFragment({ id: '010101' })).toThrow();
  });
});

// Reading Metadata
describe('readFragment()', () => {
  test('Return undefined if entry doesnt exist', async () => {
    const result = await readFragment('Chris', 'scuffed_id');
    expect(result).toBe(undefined);
  });
  test('Retrieve stored metadata fragment', async () => {
    const fragment = { ownerId: 'Chris', id: '00000002', type: 'text/plain' };
    await writeFragment(fragment);
    const result = await readFragment('Chris', '00000002');

    expect(result).toEqual(fragment);
  });
});

// Writing data
describe('writeFragmentData()', () => {
  test('Store data fragment', async () => {
    const ownerId = 'Chris';
    const id = '00000003';
    const buffer = 'My roommate is really loud';

    await writeFragmentData(ownerId, id, buffer);
    const result = await readFragmentData(ownerId, id);

    expect(result).toEqual(buffer);
  });
  test('Error writing fragment if missing fields', async () => {
    expect(() => writeFragmentData({})).toThrow();
    expect(() => writeFragmentData({ ownerId: 'user1' })).toThrow();
    expect(() => writeFragmentData({ id: '010101' })).toThrow();
    expect(() =>
      writeFragmentData({ buffer: 'Why is my roommate playing guitar at 1am' })
    ).toThrow();
  });
});

// Reading data
describe('readFragmentData()', () => {
  test('Return undefined if entry doesnt exist', async () => {
    const result = await readFragmentData('Chris', 'scuffed_id');
    expect(result).toBe(undefined);
  });
  test('Retrieve stored data fragment', async () => {
    const ownerId = 'Chris';
    const id = '00000004';
    const buffer = 'Why is my roommate playing guitar at 2am';

    await writeFragmentData(ownerId, id, buffer);
    const result = await readFragmentData(ownerId, id);

    expect(result).toEqual(buffer);
  });
});
