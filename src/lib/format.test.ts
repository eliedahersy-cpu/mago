import { formatPrice } from '@/lib/format';

test('formats USD with two decimals', () => {
  expect(formatPrice(4.5)).toBe('$4.50');
  expect(formatPrice(22.5)).toBe('$22.50');
  expect(formatPrice(0)).toBe('$0.00');
  expect(formatPrice(1234.5)).toBe('$1,234.50');
});
