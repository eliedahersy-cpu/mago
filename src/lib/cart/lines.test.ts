import {
  addBox,
  addLine,
  cartCount,
  cartSubtotal,
  clampQuantity,
  EMPTY_ORDER_NOTES,
  lineUnitPrice,
  sanitizePersistedCart,
  setLineQuantity,
  type BoxCup,
  type NewBox,
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

const boxCup = (productId: string, quantity = 1): BoxCup => ({ ...cup, productId, slug: `cup-${productId}`, quantity });
const box = (cups: BoxCup[]): NewBox => ({
  productId: 'bundle',
  slug: 'mago-mix-box',
  name: 'The MAGO Mix Box',
  image: '/products/mago-mix-box.webp',
  cups,
});
const fullBox = box([boxCup('c1', 2), boxCup('c2'), boxCup('c3'), boxCup('c4')]);

test('adds a new line', () => expect(addLine([], cup)).toEqual([{ ...cup, kind: 'product', id: 'p:a', quantity: 1 }]));

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

test('adds a box line with a b: id', () => {
  const [line] = addBox([], fullBox, 'x');
  expect(line).toMatchObject({ kind: 'box', id: 'b:x', quantity: 1, productId: 'bundle' });
});

test('an identical box increments instead of duplicating', () => {
  const reordered = box([boxCup('c4'), boxCup('c3'), boxCup('c1', 2), boxCup('c2')]);
  const lines = addBox(addBox([], fullBox, 'x'), reordered, 'y');
  expect(lines).toHaveLength(1);
  expect(lines[0]).toMatchObject({ id: 'b:x', quantity: 2 });
});

test('a different box is a separate line', () => {
  const other = box([boxCup('c1'), boxCup('c2'), boxCup('c3'), boxCup('c4'), boxCup('c5')]);
  expect(addBox(addBox([], fullBox, 'x'), other, 'y')).toHaveLength(2);
});

test('box unit price is the sum of its cups', () => {
  const [line] = addBox([], fullBox, 'x');
  expect(lineUnitPrice(line)).toBe(22.5);
});

test('count treats a box as one item; subtotal includes boxes', () => {
  const lines = addLine(addBox([], fullBox, 'x'), cup, 2);
  expect(cartCount(lines)).toBe(3);
  expect(cartSubtotal(lines)).toBe(31.5);
});

test('box quantity can be changed and removed like any line', () => {
  const lines = setLineQuantity(addBox([], fullBox, 'x'), 'b:x', 3);
  expect(cartSubtotal(lines)).toBe(67.5);
  expect(setLineQuantity(lines, 'b:x', 0)).toEqual([]);
});

test('sanitizePersistedCart returns an empty cart for unknown shapes', () => {
  const empty = { lines: [], orderNotes: EMPTY_ORDER_NOTES };
  expect(sanitizePersistedCart(null)).toEqual(empty);
  expect(sanitizePersistedCart({ lines: 'oops' })).toEqual(empty);
  expect(sanitizePersistedCart({ lines: [{ id: 'p:a' }] })).toEqual(empty);
  const good = addBox(addLine([], cup), fullBox, 'x');
  const notes = { instructions: 'Ring twice', isGift: true, giftNote: 'Enjoy!' };
  expect(sanitizePersistedCart({ lines: good, orderNotes: notes })).toEqual({ lines: good, orderNotes: notes });
});

test('upgrades v1 product lines that have no kind', () => {
  const v1 = { id: 'p:a', ...cup, quantity: 2 };
  expect(sanitizePersistedCart({ lines: [v1] })).toEqual({
    lines: [{ ...v1, kind: 'product' }],
    orderNotes: EMPTY_ORDER_NOTES,
  });
});

test('drops malformed boxes and bad notes', () => {
  const [line] = addBox([], fullBox, 'x');
  const emptyBox = { ...line, cups: [] };
  const zeroCup = { ...line, cups: [{ ...line.kind === 'box' ? line.cups[0] : {}, quantity: 0 }] };
  expect(sanitizePersistedCart({ lines: [emptyBox, zeroCup] }).lines).toEqual([]);
  expect(sanitizePersistedCart({ lines: [], orderNotes: { isGift: 'yes' } }).orderNotes).toEqual(EMPTY_ORDER_NOTES);
});
