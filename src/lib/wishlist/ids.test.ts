import { mergeIds, sanitizeIds, toggleId } from '@/lib/wishlist/ids';

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
