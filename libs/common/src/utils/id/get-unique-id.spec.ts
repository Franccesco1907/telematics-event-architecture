import { getUniqueId } from './get-unique-id';

describe('getUniqueId', () => {
  it('should return a string', () => {
    const id = getUniqueId();
    expect(typeof id).toBe('string');
  });

  it('should return a unique value each time', () => {
    const id1 = getUniqueId();
    const id2 = getUniqueId();
    expect(id1).not.toBe(id2);
  });

  it('should return a UUID of correct format', () => {
    const id = getUniqueId();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(id)).toBe(true);
  });
});

