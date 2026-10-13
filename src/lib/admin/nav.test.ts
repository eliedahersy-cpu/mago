import { ADMIN_NAV, isActiveNav } from '@/lib/admin/nav';

test('the dashboard is active only on /admin; sections stay active on their sub-pages', () => {
  expect(isActiveNav('/admin', '/admin')).toBe(true);
  expect(isActiveNav('/admin/orders', '/admin')).toBe(false);
  expect(isActiveNav('/admin/orders/1042', '/admin/orders')).toBe(true);
  expect(isActiveNav('/admin/ordersx', '/admin/orders')).toBe(false);
  expect(ADMIN_NAV.map((n) => n.href)).toContain('/admin/settings');
});
