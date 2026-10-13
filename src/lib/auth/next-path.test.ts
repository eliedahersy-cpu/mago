import { safeNextPath } from '@/lib/auth/next-path';

test('keeps same-site paths with their query and hash', () => {
  expect(safeNextPath('/account/orders')).toBe('/account/orders');
  expect(safeNextPath('/checkout?step=2')).toBe('/checkout?step=2');
  expect(safeNextPath('/account/orders?x=1#top')).toBe('/account/orders?x=1#top');
});

test.each([
  ['//evil.com', 'protocol-relative'],
  ['https://evil.com', 'absolute'],
  ['/\\evil.com', 'backslash'],
  ['/x\\y', 'backslash later on'],
  ['/\t/evil.com', 'tab (URL parsers drop it, making //evil.com)'],
  ['/\n/evil.com', 'newline'],
  ['/\r/evil.com', 'carriage return'],
  ['/\u0000/evil.com', 'nul'],
  ['javascript:alert(1)', 'scheme'],
  ['account', 'relative without slash'],
  ['', 'empty'],
])('falls back for %j (%s)', (raw) => {
  expect(safeNextPath(raw)).toBe('/account');
});

test('falls back for missing values and uses the given fallback', () => {
  expect(safeNextPath(null)).toBe('/account');
  expect(safeNextPath(undefined, '/checkout')).toBe('/checkout');
});
