import { describe, expect, it } from 'vitest';
import { orderConfirmation, orderStatusUpdate, staffNewOrder, type MailBrand, type MailOrder } from './templates';

const brand: MailBrand = { storeName: 'MAGO', siteUrl: 'https://mago.test', contactEmail: 'hello@mago.test' };
const order: MailOrder = {
  number: 1042,
  status: 'pending',
  created_at: '2026-10-19T10:00:00Z',
  email: 'sara@example.com',
  phone: '+961 70 111 222',
  full_name: 'Sara <b>Khoury</b>',
  shipping_address: { street: 'Bliss St', area: 'Hamra', governorate: 'Beirut' },
  special_instructions: 'Ring twice',
  is_gift: true,
  gift_note: 'Happy birthday',
  subtotal: '22.50',
  discount_total: '2.25',
  shipping_total: '3.00',
  total: '23.25',
  discount_code: 'MIX10',
  payment_method: 'cod',
  items: [{ name: 'The MAGO Mix Box', flavour: null, unit_price: '22.50', quantity: 1, line_total: '22.50', children: [{ name: 'Fusilli Cup', flavour: 'Spicy Muhammara', quantity: 2 }] }],
};

describe('order emails', () => {
  it('confirms the order with number, total, items and the tracking link', () => {
    const m = orderConfirmation(order, brand, 'https://mago.test/order/abc');
    expect(m.subject).toBe('Order #1042 confirmed');
    expect(m.html).toContain('$23.25');
    expect(m.html).toContain('2 × Fusilli Cup Spicy Muhammara');
    expect(m.html).toContain('https://mago.test/order/abc');
    expect(m.html).toContain('Cash on delivery');
    expect(m.html).toContain('Happy birthday');
  });
  it('escapes customer-supplied text', () => {
    const m = staffNewOrder(order, brand, 'https://mago.test/admin/orders/1042');
    expect(m.html).not.toContain('<b>Khoury</b>');
    expect(m.html).toContain('Sara &lt;b&gt;Khoury&lt;/b&gt;');
    expect(m.subject).toBe('[MAGO] New order #1042 · $23.25');
  });
  it('writes a status email only for statuses customers care about', () => {
    expect(orderStatusUpdate(order, 'out_for_delivery', brand, 'u')?.subject).toBe('Order #1042 is on its way');
    expect(orderStatusUpdate(order, 'cancelled', brand, 'u')?.subject).toBe('Order #1042 was cancelled');
    expect(orderStatusUpdate(order, 'pending', brand, 'u')).toBeNull();
  });
  it('shows free delivery as Free', () => {
    const m = orderConfirmation({ ...order, shipping_total: 0 }, brand, 'u');
    expect(m.html).toContain('Free');
  });
});
