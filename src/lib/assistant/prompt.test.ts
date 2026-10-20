import { describe, expect, it } from 'vitest';
import type { Product, StoreSettings } from '@/lib/types';
import { catalogContext } from './prompt';

const base: Product = {
  id: 'p1',
  slug: 'fusilli-spicy-muhammara',
  name: 'Fusilli',
  flavour: 'Spicy Muhammara',
  type: 'cup',
  status: 'active',
  tagline: null,
  sauce: 'Roasted pepper and walnut',
  shortDescription: null,
  description: null,
  story: null,
  price: 3.69,
  compareAtPrice: null,
  stock: 10,
  trackInventory: true,
  allowBackorder: false,
  proteinG: null,
  prepMinutes: 5,
  isBestSeller: false,
  isFeatured: false,
  sortOrder: 0,
  badges: [],
  ingredients: [{ name: 'Walnuts' }, { name: 'Red pepper' }],
  nutrition: [],
  preparation: [],
  flavourProfiles: ['spicy'],
  spiceLevel: 2,
  textures: [],
  occasions: [],
  style: 'lebanese',
  bundleSize: null,
  ratingAvg: null,
  ratingCount: 0,
  images: [],
  collections: [],
  seoTitle: null,
  seoDescription: null,
  createdAt: '2026-01-01',
};

const settings: StoreSettings = {
  storeName: 'MAGO',
  contactEmail: 'hello@mago.example',
  contactPhone: null,
  currency: 'USD',
  shippingFlatFee: 3,
  freeShippingThreshold: 25,
  deliveryAreas: [],
  socialLinks: {},
  announcementBar: null,
};

describe('catalogContext', () => {
  it('lists live products with the facts the assistant may quote', () => {
    const text = catalogContext([base], [], settings);
    expect(text).toContain('- fusilli-spicy-muhammara: Fusilli, Spicy Muhammara (cup) $3.69');
    expect(text).toContain('ingredients: Walnuts, Red pepper');
    expect(text).toContain('spice 2/3');
    expect(text).not.toContain('protein:');
    expect(text).toContain('free on orders over $25.00');
    expect(text).toContain('hello@mago.example');
  });

  it('marks sold-out products and leaves out drafts', () => {
    const text = catalogContext(
      [
        { ...base, stock: 0 },
        { ...base, slug: 'secret-draft', status: 'draft' },
      ],
      [],
      settings,
    );
    expect(text).toContain('SOLD OUT');
    expect(text).not.toContain('secret-draft');
  });
});
