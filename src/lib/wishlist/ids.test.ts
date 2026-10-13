import { GUEST, idsToUpload, mergeIds, sanitizeIds, sanitizeOwner, toggleId } from '@/lib/wishlist/ids';

test('toggling adds a product once and removes it again', () => {
  expect(toggleId([], 'a')).toEqual(['a']);
  expect(toggleId(['a', 'b'], 'a')).toEqual(['b']);
});

test('merging keeps both lists without duplicates', () => {
  expect(mergeIds(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
});

test('saved values are cleaned up', () => {
  expect(sanitizeIds(null)).toEqual([]);
  expect(sanitizeIds({ ids: ['a', 3, '', 'a', 'b'] })).toEqual(['a', 'b']);
  expect(sanitizeIds({ ids: Array.from({ length: 300 }, (_, i) => `p${i}`) })).toHaveLength(200);
});

test('signing in uploads only a guest list, never a list that already came from an account', () => {
  expect(idsToUpload(GUEST, 'user-1', ['a', 'b'])).toEqual(['a', 'b']);
  expect(idsToUpload('user-1', 'user-1', ['a', 'b'])).toEqual([]);
  expect(idsToUpload('user-2', 'user-1', ['a'])).toEqual([]);
});

test('a saved owner is kept only when it is a plain string', () => {
  expect(sanitizeOwner({ owner: 'user-1' })).toBe('user-1');
  expect(sanitizeOwner({ owner: 42 })).toBe(GUEST);
  expect(sanitizeOwner(null)).toBe(GUEST);
});
