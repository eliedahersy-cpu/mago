// Integration tests against the live Supabase project (reads .env.local).
// Run with `npm run test:int` after migrations and seed are applied.
import {
  getActiveAutomaticDiscount,
  getFeaturedProducts,
  getProductBySlug,
  getShopProducts,
  getVisibleCollections,
} from '@/lib/data/catalog';
import { getRecipeCards, getSettings } from '@/lib/data/content';
import { searchCatalog } from '@/lib/data/search';
import { SHOP_DEFAULTS } from '@/lib/catalog/shop-params';

test('featured cups in home-page order', async () => {
  expect((await getFeaturedProducts()).map((p) => p.slug)).toEqual([
    'pastina-sweet-cinnamon',
    'fusilli-spicy-muhammara',
    'rishta-lentil-pasta-soup',
    'fusilli-al-pesto-genovese',
    'tagliolini-al-tartufo-bianco',
  ]);
});

test('shop lists the 12 active cups and honours collections', async () => {
  expect((await getShopProducts(SHOP_DEFAULTS)).total).toBe(12);
  expect((await getShopProducts({ ...SHOP_DEFAULTS, collection: 'fusilli' })).total).toBe(2);
  const unknown = await getShopProducts({ ...SHOP_DEFAULTS, collection: 'nope' });
  expect(unknown.total).toBe(12);
  expect(unknown.activeCollection).toBeNull();
});

test('drafts are invisible and products map correctly', async () => {
  expect(await getProductBySlug('fusilli-400g')).toBeNull();
  const p = await getProductBySlug('fusilli-spicy-muhammara');
  expect(p?.price).toBe(4.5);
  expect(p?.isBestSeller).toBe(true);
  expect(p?.images[0]?.url).toBe('/products/fusilli-spicy-muhammara.webp');
});

test('visible collections with active products', async () => {
  expect((await getVisibleCollections()).map((c) => c.slug)).toEqual([
    'fusilli',
    'rishta',
    'pastina',
    'tagliolini',
    'conchiglie',
    'specialities',
  ]);
});

test('search tolerates punctuation', async () => {
  const r = await searchCatalog('Pesto, (genovese)%');
  expect(r.products.map((p) => p.slug)).toContain('fusilli-al-pesto-genovese');
  expect(await searchCatalog('')).toEqual({ term: '', products: [], recipes: [] });
});

test('automatic discount, settings and recipes', async () => {
  expect(await getActiveAutomaticDiscount()).toEqual({ title: 'Mix & Match 10%', value: 10, minCupQuantity: 5 });
  expect((await getSettings()).freeShippingThreshold).toBe(30);
  const recipes = await getRecipeCards(8);
  expect(recipes).toHaveLength(8);
  expect(recipes[0].productName).toBe('Fusilli Cup Spicy Muhammara');
});
