import { blockingIssues, codeIssue, toOrderConfirmation, toQuote } from '@/lib/checkout/quote';

const raw = {
  currency: 'USD',
  lines: [
    {
      product_id: 'bundle',
      slug: 'mago-mix-box',
      name: 'The MAGO Mix Box',
      flavour: null,
      type: 'bundle',
      image: '/products/mago-mix-box.webp',
      unit_price: '22.50',
      quantity: 1,
      line_total: 22.5,
      children: [
        { product_id: 'a', name: 'Fusilli Cup', flavour: 'Spicy Muhammara', image: '/a.webp', unit_price: 4.5 },
        { product_id: 'b', name: 'Rishta Cup', flavour: 'Lentil & Pasta Soup', image: '/b.webp', unit_price: 4.5 },
        { product_id: 'a', name: 'Fusilli Cup', flavour: 'Spicy Muhammara', image: '/a.webp', unit_price: 4.5 },
      ],
    },
  ],
  cup_quantity: 5,
  subtotal: 22.5,
  automatic_discount: { title: 'Mix & Match 10%', amount: 2.25 },
  code_discount: null,
  discount_total: 2.25,
  shipping_total: 3,
  free_shipping_threshold: 30,
  total: 23.25,
  errors: [
    { code: 'discount_invalid', message: 'That code is not valid.' },
    { code: 'out_of_stock', product_id: 'b', available: 0, message: 'Rishta Cup Lentil & Pasta Soup is sold out.' },
  ],
};

test('maps quote_cart JSON to numbers and grouped box contents', () => {
  const quote = toQuote(raw);
  expect(quote.total).toBe(23.25);
  expect(quote.lines[0].unitPrice).toBe(22.5);
  expect(quote.lines[0].children).toEqual([
    { productId: 'a', name: 'Fusilli Cup', flavour: 'Spicy Muhammara', image: '/a.webp', unitPrice: 4.5, quantity: 2 },
    { productId: 'b', name: 'Rishta Cup', flavour: 'Lentil & Pasta Soup', image: '/b.webp', unitPrice: 4.5, quantity: 1 },
  ]);
  expect(quote.automaticDiscount).toEqual({ title: 'Mix & Match 10%', amount: 2.25 });
  expect(quote.codeDiscount).toBeNull();
});

test('separates code problems from problems that block the order', () => {
  const quote = toQuote(raw);
  expect(codeIssue(quote)?.message).toBe('That code is not valid.');
  expect(blockingIssues(quote).map((e) => e.code)).toEqual(['out_of_stock']);
});

test('an empty or broken response becomes an empty quote', () => {
  const quote = toQuote(null);
  expect(quote.lines).toEqual([]);
  expect(quote.total).toBe(0);
  expect(quote.errors).toEqual([]);
});

test('maps the confirmation order', () => {
  const order = toOrderConfirmation({
    number: 1001,
    status: 'pending',
    created_at: '2026-10-12T19:00:00Z',
    email: 'lina@example.com',
    phone: '+961 70 123 456',
    full_name: 'Lina Haddad',
    shipping_address: { governorate: 'Beirut', area: 'Hamra', street: 'Bliss Street', building: '', floor: '3', notes: null },
    special_instructions: null,
    is_gift: true,
    gift_note: 'Enjoy!',
    subtotal: '22.50',
    discount_total: '2.25',
    shipping_total: '3.00',
    total: '23.25',
    discount_code: null,
    payment_method: 'cod',
    payment_status: 'unpaid',
    items: [
      {
        name: 'The MAGO Mix Box',
        flavour: null,
        image: null,
        unit_price: 22.5,
        quantity: 1,
        line_total: 22.5,
        children: [{ name: 'Fusilli Cup', flavour: 'Spicy Muhammara', image: null, unit_price: 4.5, quantity: 5 }],
      },
    ],
  });
  expect(order?.number).toBe(1001);
  expect(order?.total).toBe(23.25);
  expect(order?.items[0].children[0].quantity).toBe(5);
  expect(order?.address.street).toBe('Bliss Street');
  expect(toOrderConfirmation(null)).toBeNull();
});
