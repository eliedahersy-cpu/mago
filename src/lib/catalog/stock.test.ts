import { isPurchasable } from '@/lib/catalog/stock';

const base = { status: 'active', stock: 0, trackInventory: true, allowBackorder: false } as const;

test('out of stock is not purchasable', () => expect(isPurchasable(base)).toBe(false));

test('backorder or untracked is purchasable', () => {
  expect(isPurchasable({ ...base, allowBackorder: true })).toBe(true);
  expect(isPurchasable({ ...base, trackInventory: false })).toBe(true);
});

test('in stock is purchasable', () => expect(isPurchasable({ ...base, stock: 3 })).toBe(true));

test('draft never purchasable', () => expect(isPurchasable({ ...base, status: 'draft', stock: 5 })).toBe(false));
