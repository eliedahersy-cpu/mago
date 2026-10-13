// The account queries must filter by the signed-in customer themselves: RLS also lets staff
// read every order, so "your orders" would otherwise list the whole store for the owner.
// A small recording stand-in for the Supabase client (no account can be created in tests).

import { vi } from 'vitest';

const calls: string[] = [];
let claimedCustomer: string | null = 'cust-1';

function query(table: string) {
  const builder = {
    select: () => builder,
    order: () => builder,
    limit: () => builder,
    eq: (column: string, value: unknown) => {
      calls.push(`${table}.eq(${column}=${String(value)})`);
      return builder;
    },
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null }),
  };
  calls.push(`from(${table})`);
  return builder;
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    rpc: async (fn: string) => {
      calls.push(`rpc(${fn})`);
      return { data: claimedCustomer, error: null };
    },
    from: query,
  }),
}));

const { getMyOrder, getMyOrders } = await import('@/lib/data/account');

beforeEach(() => {
  calls.length = 0;
  claimedCustomer = 'cust-1';
});

test('order history is limited to the signed-in customer', async () => {
  await getMyOrders();
  expect(calls).toContain('orders.eq(customer_id=cust-1)');
});

test('a single order is looked up within the signed-in customer only', async () => {
  await getMyOrder(1001);
  expect(calls).toContain('orders.eq(customer_id=cust-1)');
  expect(calls).toContain('orders.eq(number=1001)');
});

test('without a customer record there is nothing to show and no order query', async () => {
  claimedCustomer = null;
  expect(await getMyOrders()).toEqual([]);
  expect(await getMyOrder(1001)).toBeNull();
  expect(calls.some((c) => c.startsWith('from(orders)'))).toBe(false);
});
