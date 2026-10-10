import { sanitizeSearchTerm } from '@/lib/catalog/search-term';

test('sanitizeSearchTerm strips filter syntax', () => {
  expect(sanitizeSearchTerm('pesto, (truffle)%_*')).toBe('pesto truffle');
  expect(sanitizeSearchTerm('  Mac   &  Cheese ')).toBe('Mac & Cheese');
  expect(sanitizeSearchTerm('*')).toBe('');
  expect(sanitizeSearchTerm('a'.repeat(100))).toHaveLength(60);
});

test('keeps accents and apostrophes', () => {
  expect(sanitizeSearchTerm("Crème d'été")).toBe("Crème d'été");
});
