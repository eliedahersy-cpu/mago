import { nextStatuses, ORDERS_PAGE_SIZE, parseOrderFilters } from '@/lib/admin/orders';

test('orders move forward (skipping is allowed) and can be cancelled until delivered', () => {
  expect(nextStatuses('pending')).toEqual(['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']);
  expect(nextStatuses('preparing')).toEqual(['out_for_delivery', 'delivered', 'cancelled']);
  expect(nextStatuses('out_for_delivery')).toEqual(['delivered', 'cancelled']);
  expect(nextStatuses('delivered')).toEqual([]);
  expect(nextStatuses('cancelled')).toEqual([]);
  expect(nextStatuses('nonsense')).toEqual([]);
});

test('reads order filters from the URL and ignores anything invalid', () => {
  expect(parseOrderFilters({})).toEqual({ q: '', status: null, payment: null, source: null, from: null, to: null, page: 1 });
  expect(
    parseOrderFilters({ q: '  1042 ', status: 'preparing', payment: 'paid', source: 'admin', from: '2026-10-01', to: '2026-10-13', page: '3' }),
  ).toEqual({ q: '1042', status: 'preparing', payment: 'paid', source: 'admin', from: '2026-10-01', to: '2026-10-13', page: 3 });
  expect(parseOrderFilters({ status: 'lost', payment: 'free', source: 'shop', from: '13/10/2026', to: '2026-02-31', page: '-2' })).toEqual({
    q: '',
    status: null,
    payment: null,
    source: null,
    from: null,
    to: null,
    page: 1,
  });
  expect(parseOrderFilters({ q: ['a', 'b'], page: ['2', '9'] })).toMatchObject({ q: 'a', page: 2 });
  expect(parseOrderFilters({ q: 'x'.repeat(300) }).q).toHaveLength(100);
  expect(ORDERS_PAGE_SIZE).toBe(25);
});
