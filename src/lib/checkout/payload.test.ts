import { addBox, addLine } from '@/lib/cart/lines';
import { itemsPayloadSchema, toItemsPayload, toOrderPayload } from '@/lib/checkout/payload';
import { checkoutSchema } from '@/lib/checkout/schema';

const cup = (productId: string) => ({ productId, slug: productId, name: 'Cup', flavour: productId, image: null, unitPrice: 4.5 });
const box = {
  productId: 'bundle',
  slug: 'mago-mix-box',
  name: 'The MAGO Mix Box',
  image: null,
  cups: [
    { ...cup('a'), quantity: 2 },
    { ...cup('b'), quantity: 3 },
  ],
};

test('product lines become ids and quantities', () => {
  expect(toItemsPayload(addLine([], cup('a'), 3))).toEqual([{ product_id: 'a', quantity: 3 }]);
});

test('a box lists one child per cup', () => {
  const lines = addBox([], box, 'x');
  expect(toItemsPayload(lines)).toEqual([{ product_id: 'bundle', quantity: 1, children: ['a', 'a', 'b', 'b', 'b'] }]);
});

test('no price ever leaves the browser', () => {
  const lines = addBox(addLine([], cup('a'), 2), box, 'x');
  expect(JSON.stringify(toItemsPayload(lines))).not.toMatch(/price|total/i);
});

test('the items schema rejects tampered shapes', () => {
  expect(itemsPayloadSchema.safeParse([{ product_id: 'a', quantity: 0 }]).success).toBe(false);
  expect(itemsPayloadSchema.safeParse([{ product_id: 'a', quantity: 2, unit_price: 0 }]).success).toBe(false);
  expect(itemsPayloadSchema.safeParse(Array.from({ length: 51 }, () => ({ product_id: 'a', quantity: 1 }))).success).toBe(false);
  expect(itemsPayloadSchema.safeParse([{ product_id: 'a', quantity: 1, children: ['b'] }]).success).toBe(true);
});

test('the order payload matches place_order', () => {
  const form = checkoutSchema.parse({
    fullName: 'Lina Haddad',
    email: 'lina@example.com',
    phone: '+961 70 123 456',
    governorate: 'Beirut',
    area: 'Hamra',
    street: 'Bliss Street',
    isGift: true,
    giftNote: 'Enjoy!',
    acceptsMarketing: false,
    code: 'freeship',
  });
  const payload = toOrderPayload(form, [{ product_id: 'a', quantity: 1 }], 'key-1', 7.5);
  expect(payload).toEqual({
    idempotency_key: 'key-1',
    expected_total: 7.5,
    items: [{ product_id: 'a', quantity: 1 }],
    code: 'freeship',
    accepts_marketing: false,
    contact: { full_name: 'Lina Haddad', email: 'lina@example.com', phone: '+961 70 123 456' },
    address: { governorate: 'Beirut', area: 'Hamra', street: 'Bliss Street', building: '', floor: '', notes: '' },
    special_instructions: '',
    is_gift: true,
    gift_note: 'Enjoy!',
  });
});
