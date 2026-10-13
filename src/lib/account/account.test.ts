import { addressSchema, profileSchema } from '@/lib/account/address';
import { orderItemCount, toAccountOrder } from '@/lib/account/orders';
import { fieldErrors } from '@/lib/checkout/schema';

const address = {
  label: 'Home',
  fullName: 'Lina Haddad',
  phone: '+961 70 123 456',
  governorate: 'Beirut',
  area: 'Hamra',
  street: 'Bliss Street',
  building: 'Blue Tower',
  floor: '3',
  notes: '',
  isDefault: true,
};

test('a complete address passes', () => {
  expect(addressSchema.parse(address).isDefault).toBe(true);
});

test('an address needs a name, phone, governorate, area and street', () => {
  const result = addressSchema.safeParse({ ...address, fullName: '', phone: '12', governorate: '', area: ' ', street: '' });
  expect(result.success).toBe(false);
  if (!result.success)
    expect(Object.keys(fieldErrors(result.error)).sort()).toEqual(['area', 'fullName', 'governorate', 'phone', 'street']);
});

test('the profile phone is optional but must look like a phone when given', () => {
  expect(profileSchema.safeParse({ fullName: 'Lina Haddad', phone: '' }).success).toBe(true);
  expect(profileSchema.safeParse({ fullName: 'Lina Haddad', phone: 'call me' }).success).toBe(false);
});

const row = {
  number: 1001,
  status: 'confirmed',
  created_at: '2026-10-13T10:00:00Z',
  email: 'lina@example.com',
  phone: '+961 70 123 456',
  shipping_address: { full_name: 'Lina Haddad', governorate: 'Beirut', area: 'Hamra', street: 'Bliss Street' },
  special_instructions: null,
  is_gift: false,
  gift_note: null,
  subtotal: '27.00',
  discount_total: '2.70',
  shipping_total: '3.00',
  total: '27.30',
  discount_code: null,
  payment_method: 'cod',
  payment_status: 'unpaid',
  order_items: [
    { id: 'c2', parent_item_id: 'box', name: 'Rishta Cup', flavour: 'Lentil & Pasta Soup', image: null, unit_price: 4.5, quantity: 2, line_total: 9, created_at: '2026-10-13T10:00:00.003Z' },
    { id: 'box', parent_item_id: null, name: 'The MAGO Mix Box', flavour: null, image: null, unit_price: 22.5, quantity: 1, line_total: 22.5, created_at: '2026-10-13T10:00:00.001Z' },
    { id: 'c1', parent_item_id: 'box', name: 'Fusilli Cup', flavour: 'Spicy Muhammara', image: null, unit_price: 4.5, quantity: 3, line_total: 13.5, created_at: '2026-10-13T10:00:00.002Z' },
    { id: 'loose', parent_item_id: null, name: 'Pastina Cup', flavour: 'Sweet Cinnamon', image: null, unit_price: 4.5, quantity: 1, line_total: 4.5, created_at: '2026-10-13T10:00:00.004Z' },
  ],
};

test('order rows become the confirmation shape with box cups under their box', () => {
  const order = toAccountOrder(row);
  expect(order.number).toBe(1001);
  expect(order.fullName).toBe('Lina Haddad');
  expect(order.items.map((i) => i.name)).toEqual(['The MAGO Mix Box', 'Pastina Cup']);
  expect(order.items[0].children.map((c) => `${c.quantity} ${c.name}`)).toEqual(['3 Fusilli Cup', '2 Rishta Cup']);
  expect(order.total).toBe(27.3);
});

test('the item count shows what was ordered, not the cups inside boxes', () => {
  expect(orderItemCount(row.order_items)).toBe(2);
});
