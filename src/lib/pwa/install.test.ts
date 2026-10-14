import { fabView, isIosDevice } from '@/lib/pwa/install';

const base = { ready: true, installed: false, canPrompt: true, ios: false, dismissed: false, pathname: '/' };

test('the floating button offers the install prompt where the browser has one', () => {
  expect(fabView(base)).toBe('prompt');
  expect(fabView({ ...base, canPrompt: false, ios: true })).toBe('ios');
});

test('it stays hidden until ready, once installed, after "hide", and where the browser cannot install', () => {
  expect(fabView({ ...base, ready: false })).toBe('hidden');
  expect(fabView({ ...base, installed: true })).toBe('hidden');
  expect(fabView({ ...base, dismissed: true })).toBe('hidden');
  expect(fabView({ ...base, canPrompt: false, ios: false })).toBe('hidden');
});

test('it never covers checkout steps or the bars fixed at the bottom of a page', () => {
  for (const pathname of ['/subscribe/build', '/mix-box', '/mix-box/review', '/cart', '/checkout', '/order/abc']) {
    expect(fabView({ ...base, pathname })).toBe('hidden');
  }
  expect(fabView({ ...base, pathname: '/subscribe' })).toBe('prompt');
  expect(fabView({ ...base, pathname: '/shop/fusilli-spicy-muhammara' })).toBe('prompt');
});

test('iPhones and iPads (including iPadOS that reports a Mac) count as iOS', () => {
  expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'iPhone', 5)).toBe(true);
  expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5)).toBe(true);
  expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 0)).toBe(false);
  expect(isIosDevice('Mozilla/5.0 (Linux; Android 15)', 'Linux armv8l', 5)).toBe(false);
});
