import { toProduct, toSettings } from '@/lib/data/mappers';

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

test('toProduct maps a raw row', () => {
  const p = toProduct({
    id: 'p1', slug: 'fusilli-spicy-muhammara', name: 'Fusilli Cup', flavour: 'Spicy Muhammara',
    sauce: 'Smoky pepper, walnut & chili sauce', type: 'cup', status: 'active', tagline: 'Bold.',
    short_description: null, description: null, story: null, price: '4.50', compare_at_price: null,
    stock: 200, track_inventory: true, allow_backorder: false, protein_g: 30, prep_minutes: 4,
    is_best_seller: true, is_featured: true, sort_order: 2, badges: null, ingredients: null,
    nutrition: [{ label: 'Protein', value: '30 g per serving' }], preparation: [], flavour_profiles: ['spicy'],
    spice_level: 3, textures: ['twirly'], occasions: ['quick-lunch'], style: 'lebanese', bundle_size: null,
    seo_title: null, seo_description: null, rating_avg: '4.67', rating_count: 3,
    created_at: "2026-10-10T00:00:00Z",
    product_images: [
      { url: '/b.webp', alt: 'B', kind: 'lifestyle', position: 1 },
      { url: '/a.webp', alt: 'A', kind: 'packshot', position: 0 },
    ],
    collection_products: [{ collections: { slug: 'fusilli', title: 'Fusilli' } }],
  });
  expect(p.price).toBe(4.5);
  expect(p.ratingAvg).toBe(4.67);
  expect(p.badges).toEqual([]);
  expect(p.ingredients).toEqual([]);
  expect(p.images.map((i) => i.position)).toEqual([0, 1]);
  expect(p.collections).toEqual([{ slug: 'fusilli', title: 'Fusilli' }]);
  expect(p.isBestSeller).toBe(true);
});
