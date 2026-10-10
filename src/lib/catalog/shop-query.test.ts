import { applyShopQuery, matchesSearch, relatedProducts } from '@/lib/catalog/shop-query';
import { SHOP_DEFAULTS } from '@/lib/catalog/shop-params';
import type { Product } from '@/lib/types';

function makeProduct(slug: string, overrides: Partial<Product> = {}): Product {
  return {
    id: slug, slug, name: 'Cup', flavour: slug, type: 'cup', status: 'active', tagline: null, sauce: null,
    shortDescription: null, description: null, story: null, price: 4.5, compareAtPrice: null, stock: 10,
    trackInventory: true, allowBackorder: false, proteinG: 30, prepMinutes: 4, isBestSeller: false,
    isFeatured: false, sortOrder: 0, badges: [], ingredients: [], nutrition: [], preparation: [],
    flavourProfiles: [], spiceLevel: 0, textures: [], occasions: [], style: null, bundleSize: null,
    ratingAvg: null, ratingCount: 0, images: [], collections: [], seoTitle: null, seoDescription: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const fusilli = [{ slug: 'fusilli', title: 'Fusilli' }];
const all = [
  makeProduct('a', { isFeatured: true, sortOrder: 2, collections: fusilli, createdAt: '2026-01-03T00:00:00Z' }),
  makeProduct('b', { sortOrder: 1, price: 5, ratingAvg: 4.9, ratingCount: 3, createdAt: '2026-01-05T00:00:00Z' }),
  makeProduct('c', { type: 'retail', sortOrder: 3, price: 3 }),
  makeProduct('d', { type: 'extra', sortOrder: 4 }),
  makeProduct('e', { isFeatured: true, sortOrder: 1, collections: fusilli, ratingAvg: 4.1, ratingCount: 9 }),
];
const slugs = (ps: Product[]) => ps.map((p) => p.slug);

test('lists cups and retail only, featured first then sort order', () => {
  const r = applyShopQuery(all, SHOP_DEFAULTS, null);
  expect(slugs(r.products)).toEqual(['e', 'a', 'b', 'c']);
  expect(r.total).toBe(4);
});

test('filters by collection slug', () => {
  expect(slugs(applyShopQuery(all, SHOP_DEFAULTS, 'fusilli').products)).toEqual(['e', 'a']);
});

test('sorts by price, rating and newest', () => {
  expect(slugs(applyShopQuery(all, { ...SHOP_DEFAULTS, sort: 'price-asc' }, null).products)).toEqual(['c', 'e', 'a', 'b']);
  expect(slugs(applyShopQuery(all, { ...SHOP_DEFAULTS, sort: 'price-desc' }, null).products)[0]).toBe('b');
  expect(slugs(applyShopQuery(all, { ...SHOP_DEFAULTS, sort: 'rating' }, null).products).slice(0, 2)).toEqual(['b', 'e']);
  expect(slugs(applyShopQuery(all, { ...SHOP_DEFAULTS, sort: 'newest' }, null).products)[0]).toBe('b');
});

test('paginates and survives a page past the end', () => {
  const many = Array.from({ length: 13 }, (_, i) => makeProduct(`p${i}`, { sortOrder: i }));
  expect(applyShopQuery(many, SHOP_DEFAULTS, null).products).toHaveLength(12);
  const page2 = applyShopQuery(many, { ...SHOP_DEFAULTS, page: 2 }, null);
  expect(slugs(page2.products)).toEqual(['p12']);
  expect(page2.total).toBe(13);
  expect(applyShopQuery(many, { ...SHOP_DEFAULTS, page: 9 }, null).products).toEqual([]);
});

test('related products prefer the same collection and exclude the product itself', () => {
  expect(slugs(relatedProducts(all, all[0], 5))).toEqual(['e', 'b']);
});

test('search matches every word across name, flavour, tagline, sauce and ingredients', () => {
  const p = makeProduct('x', {
    name: 'Fusilli Cup',
    flavour: 'Al Pesto Genovese',
    sauce: 'Basil, parmesan & pine nut sauce',
    ingredients: [{ name: 'Basil' }],
  });
  expect(matchesSearch(p, 'pesto genovese')).toBe(true);
  expect(matchesSearch(p, 'PARMESAN')).toBe(true);
  expect(matchesSearch(p, 'pesto truffle')).toBe(false);
  expect(matchesSearch(p, '')).toBe(false);
});
