export type ShopSort = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
export type ShopQuery = { collection: string | null; sort: ShopSort; page: number; perPage: 12 | 24 | 48 };

export const SHOP_SORTS: { value: ShopSort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'newest', label: 'Newest' },
];

export const PER_PAGE_OPTIONS = [12, 24, 48] as const;
export const SHOP_DEFAULTS: ShopQuery = { collection: null, sort: 'featured', page: 1, perPage: 12 };

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

export function parseShopParams(sp: RawParams): ShopQuery {
  const collection = first(sp.collection)?.trim().toLowerCase();
  const sort = first(sp.sort);
  const page = Number.parseInt(first(sp.page) ?? '', 10);
  const perPage = Number(first(sp.per));
  return {
    collection: collection && /^[a-z0-9-]+$/.test(collection) ? collection : null,
    sort: SHOP_SORTS.some((s) => s.value === sort) ? (sort as ShopSort) : 'featured',
    page: Number.isInteger(page) && page > 0 ? page : 1,
    perPage: (PER_PAGE_OPTIONS as readonly number[]).includes(perPage) ? (perPage as ShopQuery['perPage']) : 12,
  };
}

/** Query string for a shop link: omits defaults; changing filter, sort or page size resets to page 1. */
export function toShopSearchParams(current: ShopQuery, patch: Partial<ShopQuery>): string {
  const resetsPage = (['collection', 'sort', 'perPage'] as const).some((k) => k in patch && patch[k] !== current[k]);
  const next: ShopQuery = { ...current, ...patch, ...(resetsPage ? { page: 1 } : {}) };
  const params = new URLSearchParams();
  if (next.collection) params.set('collection', next.collection);
  if (next.sort !== SHOP_DEFAULTS.sort) params.set('sort', next.sort);
  if (next.perPage !== SHOP_DEFAULTS.perPage) params.set('per', String(next.perPage));
  if (next.page !== 1) params.set('page', String(next.page));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
