import type { BoxCup } from '@/lib/cart/lines';
import { addCupToBox, boxCount, boxSubtotal, remainingSlots, setCupQuantityInBox } from '@/lib/mix-box/box';

const cup = (productId: string): Omit<BoxCup, 'quantity'> => ({
  productId,
  slug: `cup-${productId}`,
  name: 'Fusilli Cup',
  flavour: productId,
  image: null,
  unitPrice: 4.5,
});

const fill = (ids: string[]) => ids.reduce<BoxCup[]>((cups, id) => addCupToBox(cups, cup(id), 5), []);

test('stops at the box size', () => {
  const cups = addCupToBox(fill(['a', 'b', 'c', 'd', 'e']), cup('f'), 5);
  expect(boxCount(cups)).toBe(5);
  expect(cups.map((c) => c.productId)).not.toContain('f');
  expect(remainingSlots(cups, 5)).toBe(0);
});

test('increments an existing cup', () => {
  const cups = fill(['a', 'a', 'b']);
  expect(cups).toHaveLength(2);
  expect(cups[0]).toMatchObject({ productId: 'a', quantity: 2 });
  expect(remainingSlots(cups, 5)).toBe(2);
});

test('setCupQuantityInBox clamps to the remaining slots', () => {
  const cups = setCupQuantityInBox(fill(['a', 'a', 'a', 'b']), 'b', 4, 5);
  expect(cups.find((c) => c.productId === 'b')?.quantity).toBe(2);
  expect(boxCount(cups)).toBe(5);
});

test('setting a quantity below one removes the cup', () => {
  expect(setCupQuantityInBox(fill(['a', 'b']), 'a', 0, 5).map((c) => c.productId)).toEqual(['b']);
  expect(setCupQuantityInBox(fill(['a']), 'a', Number.NaN, 5)).toEqual([]);
});

test('box subtotal is cent-safe', () => {
  expect(boxSubtotal(fill(['a', 'b', 'c', 'd', 'e']))).toBe(22.5);
  const cheap = [{ ...cup('x'), unitPrice: 0.1, quantity: 3 }];
  expect(boxSubtotal(cheap)).toBe(0.3);
});
