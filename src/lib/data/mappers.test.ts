import { toSettings } from '@/lib/data/mappers';

test('toSettings converts numerics and defaults', () => {
  const s = toSettings({
    store_name: 'MAGO',
    contact_email: null,
    contact_phone: null,
    currency: 'USD',
    shipping_flat_fee: '3.00',
    free_shipping_threshold: '30.00',
    delivery_areas: ['Beirut'],
    social_links: null,
    announcement_bar: 'Free delivery on orders over $30',
  });
  expect(s.shippingFlatFee).toBe(3);
  expect(s.freeShippingThreshold).toBe(30);
  expect(s.socialLinks).toEqual({});
  expect(s.deliveryAreas).toEqual(['Beirut']);
});
