import {
  addLine,
  cartCount,
  cartSubtotal,
  clampQuantity,
  sanitizePersistedCart,
  setLineQuantity,
} from '@/lib/cart/lines';

const cup = {
  productId: 'a',
  slug: 'fusilli-spicy-muhammara',
  name: 'Fusilli Cup',
  flavour: 'Spicy Muhammara',
  image: '/products/fusilli-spicy-muhammara.webp',
  unitPrice: 4.5,
};
const extra = { ...cup, productId: 'b', slug: 'chili-flakes', name: 'Chili Flakes', flavour: null, unitPrice: 1.5 };

test('adds a new line', () => expect(addLine([], cup)).toEqual([{ ...cup, id: 'p:a', quantity: 1 }]));

test('merges the same product', () => {
  const lines = addLine(addLine([], cup, 2), cup, 3);
  expect(lines).toHaveLength(1);
  expect(lines[0].quantity).toBe(5);
});

test('clamps quantities', () => {
  expect(addLine([], cup, 150)[0].quantity).toBe(99);
  expect(addLine([], cup, -4)[0].quantity).toBe(1);
  expect(addLine([], cup, Number.NaN)[0].quantity).toBe(1);
  expect(setLineQuantity(addLine([], cup), 'p:a', 120)[0].quantity).toBe(99);
  expect(clampQuantity(2.7)).toBe(2);
});

test('setting zero removes the line', () => expect(setLineQuantity(addLine([], cup), 'p:a', 0)).toEqual([]));

test('count and subtotal', () => {
  const lines = addLine(addLine([], cup, 3), extra, 1);
  expect(cartCount(lines)).toBe(4);
  expect(cartSubtotal(lines)).toBe(15);
  expect(cartSubtotal(addLine([], { ...cup, unitPrice: 0.1 }, 3))).toBe(0.3);
});

test('sanitizePersistedCart returns empty cart for unknown shapes', () => {
  expect(sanitizePersistedCart(null)).toEqual({ lines: [] });
  expect(sanitizePersistedCart({ lines: 'oops' })).toEqual({ lines: [] });
  expect(sanitizePersistedCart({ lines: [{ id: 'p:a' }] })).toEqual({ lines: [] });
  const good = addLine([], cup);
  expect(sanitizePersistedCart({ lines: good })).toEqual({ lines: good });
});
