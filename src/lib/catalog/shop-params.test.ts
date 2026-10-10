import { parseShopParams, toShopSearchParams, type ShopQuery } from '@/lib/catalog/shop-params';

const D: ShopQuery = { collection: null, sort: 'featured', page: 1, perPage: 12 };

test('defaults', () => expect(parseShopParams({})).toEqual(D));

test('reads valid values', () =>
  expect(parseShopParams({ collection: 'fusilli', sort: 'price-asc', page: '2', per: '24' })).toEqual({
    collection: 'fusilli',
    sort: 'price-asc',
    page: 2,
    perPage: 24,
  }));

test('rejects junk', () =>
  expect(parseShopParams({ collection: 'Fus illi!', sort: 'bogus', page: '0', per: '7' })).toEqual(D));

test('takes the first array value and lowercases', () =>
  expect(parseShopParams({ collection: ['RISHTA', 'x'], page: 'abc' }).collection).toBe('rishta'));

test('builds links without defaults and resets page', () => {
  expect(toShopSearchParams(D, {})).toBe('');
  expect(toShopSearchParams({ ...D, collection: 'fusilli', page: 3 }, { collection: 'rishta' })).toBe('?collection=rishta');
  expect(toShopSearchParams({ ...D, page: 1 }, { page: 2 })).toBe('?page=2');
});
