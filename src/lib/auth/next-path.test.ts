import { safeNextPath } from '@/lib/auth/next-path';

test('keeps same-site paths with their query', () => {
  expect(safeNextPath('/account/orders')).toBe('/account/orders');
  expect(safeNextPath('/checkout?step=2')).toBe('/checkout?step=2');
});

test.each([
  ['//evil.com', 'protocol-relative'],
  ['https://evil.com', 'absolute'],
  ['/\\evil.com', 'backslash'],
  ['javascript:alert(1)', 'scheme'],
  ['account', 'relative without slash'],
  ['', 'empty'],
])('falls back for %s (%s)', (raw) => {
  expect(safeNextPath(raw)).toBe('/account');
});

test('falls back for missing values and uses the given fallback', () => {
  expect(safeNextPath(null)).toBe('/account');
  expect(safeNextPath(undefined, '/checkout')).toBe('/checkout');
});
