import { forgetOrderKey, orderKeyFor } from '@/lib/checkout/order-key';

function memory() {
  const map = new Map<string, string>();
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), removeItem: (k: string) => void map.delete(k) };
}

let n = 0;
const makeId = () => `key-${++n}`;

test('the same cart keeps the same key across retries and reloads', () => {
  const storage = memory();
  const first = orderKeyFor('cart-a', storage, makeId);
  expect(orderKeyFor('cart-a', storage, makeId)).toBe(first);
});

test('a different cart gets a new key', () => {
  const storage = memory();
  const first = orderKeyFor('cart-a', storage, makeId);
  expect(orderKeyFor('cart-b', storage, makeId)).not.toBe(first);
});

test('after a successful order the next order gets a new key', () => {
  const storage = memory();
  const first = orderKeyFor('cart-a', storage, makeId);
  forgetOrderKey(storage);
  expect(orderKeyFor('cart-a', storage, makeId)).not.toBe(first);
});

test('a corrupt saved value is replaced', () => {
  const storage = memory();
  storage.setItem('mago-order-key', '{not json');
  expect(orderKeyFor('cart-a', storage, makeId)).toMatch(/^key-/);
});
